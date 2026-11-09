// UAT зрізу 3 «підрядник»: AC-VENDOR-03 (список запусків підрядника — лише запуски з його задачами, статус і
// «Your tasks: N of K done»), AC-VENDOR-06 (чужий запуск за прямим посиланням — «Run not found» і жодної задачі),
// AC-VENDOR-10 (підрядник без задач — «No tasks assigned to you yet.» без таблиці). Пише дані (@writes): синтетичні
// uat-…@example.test (менеджер A і підрядники V, V6, V10; роль — у profiles секретним ключем) і запуски A.
// Прибирання — test.afterAll (deleteUatUsers: спершу A з його запусками й задачами, потім підрядники).
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-03, 06, 10); план: openspec/changes/impl-vendor/design.md.
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adminClient, deleteUatUsers, randomPassword, uatEmail } from "./support/admin";
import { attachRuntimeErrors, given, signIn, thenStep, when } from "./support/uat";

// «Tenant move-in» — шаблон із початкових даних (міграція 20261019174350_run_launch.sql), той самий id на проді.
const TENANT_MOVE_IN = "10000000-0000-0000-0000-000000000001";
const OWN_RUN = "Apartment 12, move-in";
const OTHER_RUN = "Apartment 14, repair";

type Role = "manager" | "vendor";
type Account = { email: string; password: string; fullName: string; role: Role; id: string };

// A — перший: afterAll видаляє A разом із його запусками, і лише тоді підрядників (на них посилаються задачі запусків A).
// Окремий підрядник на кожен AC: список запусків V не залежить від порядку тестів і повторних прогонів.
const ACCOUNTS: Record<"A" | "V" | "V6" | "V10", Omit<Account, "id" | "password">> = {
  A: { email: uatEmail("r1"), fullName: "Uat Runs One", role: "manager" },
  V: { email: uatEmail("r2"), fullName: "Uat Runs Two", role: "vendor" },
  V6: { email: uatEmail("r3"), fullName: "Uat Runs Three", role: "vendor" },
  V10: { email: uatEmail("r4"), fullName: "Uat Runs Four", role: "vendor" },
};
const users = {} as Record<keyof typeof ACCOUNTS, Account>;

test.beforeAll(async () => {
  const supabase = adminClient();
  for (const [key, a] of Object.entries(ACCOUNTS) as [keyof typeof ACCOUNTS, (typeof ACCOUNTS)["A"]][]) {
    const password = randomPassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email: a.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: a.fullName },
    });
    if (error) throw error;
    // Роль задає адміністратор (service_role), як npm run users:demo; тригер створив профіль з роллю за замовчуванням.
    const { error: roleError } = await supabase.from("profiles").update({ role: a.role }).eq("id", data.user.id);
    if (roleError) throw roleError;
    users[key] = { ...a, password, id: data.user.id };
  }
});

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test.afterAll(async () => {
  for (const a of Object.values(ACCOUNTS)) await deleteUatUsers(a.email);
});

const roleOf = async (id: string) =>
  (await adminClient().from("profiles").select("role").eq("id", id).single()).data?.role as string | undefined;

/** Клієнт Data API від імені користувача (публічний ключ + вхід паролем) — так A запускає шаблон (rpc launch_run). */
async function signedInClient(who: Account) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  expect(url && key, "потрібні NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").toBeTruthy();
  const client = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: who.email, password: who.password });
  expect(error).toBeNull();
  return client;
}

type RunTask = { id: string; name: string; assignee_id: string };

const runTasks = async (runId: string) => {
  const { data, error } = await adminClient()
    .from("run_tasks")
    .select("id, name, assignee_id")
    .eq("run_id", runId)
    .order("section_position")
    .order("position");
  expect(error).toBeNull();
  return (data ?? []) as RunTask[];
};

/** Ключі задач поточної версії «Tenant move-in» (5 задач) — для призначення задач 3 і 4 під час запуску. */
async function currentVersionTaskKeys() {
  const admin = adminClient();
  const { data: template } = await admin.from("templates").select("current_version").eq("id", TENANT_MOVE_IN).single();
  const { data: version } = await admin
    .from("template_versions")
    .select("id")
    .eq("template_id", TENANT_MOVE_IN)
    .eq("number", template?.current_version)
    .single();
  const { data: versionTasks } = await admin
    .from("template_version_tasks")
    .select("template_task_id")
    .eq("version_id", version?.id)
    .order("section_position")
    .order("position");
  const keys = (versionTasks ?? []).map((x) => x.template_task_id as string);
  expect(keys).toHaveLength(5);
  return keys;
}

/** A запускає «Tenant move-in» для caseName (rpc launch_run від імені A); assignees: {template_task_id: user_id}, решта — на A. */
async function launchAsA(caseName: string, assignees: Record<string, string> = {}) {
  const asA = await signedInClient(users.A);
  const { data: runId, error } = await asA.rpc("launch_run", {
    p_template_id: TENANT_MOVE_IN,
    p_case_name: caseName,
    p_assignees: assignees,
  });
  await asA.auth.signOut();
  expect(error).toBeNull();
  return runId as string;
}

/** Дано: vendor — виконавець задач 3 і 4 у «Apartment 12, move-in» і жодної задачі в «Apartment 14, repair» (обидва — запуски A). */
async function ownAndOtherRun(vendor: Account) {
  const keys = await currentVersionTaskKeys();
  const ownRunId = await launchAsA(OWN_RUN, { [keys[2]]: vendor.id, [keys[3]]: vendor.id });
  const otherRunId = await launchAsA(OTHER_RUN);
  expect((await runTasks(ownRunId)).filter((x) => x.assignee_id === vendor.id)).toHaveLength(2);
  const otherTasks = await runTasks(otherRunId);
  expect(otherTasks).toHaveLength(5);
  expect(otherTasks.map((x) => x.assignee_id)).not.toContain(vendor.id);
  return { ownRunId, otherRunId, otherTasks };
}

const main = (page: Page) => page.getByRole("main");

test(
  "AC-VENDOR-03: підрядник V (2 задачі в «Apartment 12, move-in», жодної в «Apartment 14, repair») відкриває список запусків — бачить лише «Apartment 12, move-in» зі статусом запуску й «Your tasks: 0 of 2 done»; «Apartment 14, repair» не бачить",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-03" } },
  async ({ page }) => {
    let ownRunId = "";
    await given("підрядник V — виконавець 2 задач у запуску «Apartment 12, move-in» і жодної задачі в запуску «Apartment 14, repair»", async () => {
      expect(await roleOf(users.A.id)).toBe("manager");
      expect(await roleOf(users.V.id)).toBe("vendor");
      ({ ownRunId } = await ownAndOtherRun(users.V));
      await signIn(page, users.V.email, users.V.password);
    });

    await when("V відкриває список запусків", async () => {
      await page.goto("/runs");
    });

    await thenStep(
      page,
      {
        clause: 'V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".',
        visible: [
          "рівно один запуск — посилання «Apartment 12, move-in»",
          "статус запуску «in progress»",
          "«Your tasks: 0 of 2 done»",
          "немає «Apartment 14, repair»",
        ],
        hidden: ["посилання веде на сторінку цього запуску (/runs/<id>)", `немає email менеджера ${users.A.email}`],
      },
      async () => {
        const link = main(page).getByRole("link", { name: OWN_RUN, exact: true });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAttribute("href", `/runs/${ownRunId}`);
        await expect(main(page).getByText("in progress", { exact: true })).toBeVisible();
        await expect(main(page).getByText("Your tasks: 0 of 2 done", { exact: true })).toBeVisible();
        await expect(main(page).getByText(OTHER_RUN)).toHaveCount(0);
        await expect(page.getByText(users.A.email)).toHaveCount(0);
      },
    );
  },
);

test(
  "AC-VENDOR-06: запуск «Apartment 14, repair», у якому підрядник V не має задач; V відкриває сторінку цього запуску за прямим посиланням — бачить «Run not found» і жодної задачі запуску",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-06" } },
  async ({ page }) => {
    let otherRunId = "";
    let otherTasks: RunTask[] = [];
    await given("запуск «Apartment 14, repair», у якому підрядник V не має задач", async () => {
      expect(await roleOf(users.V6.id)).toBe("vendor");
      ({ otherRunId, otherTasks } = await ownAndOtherRun(users.V6));
      await signIn(page, users.V6.email, users.V6.password);
    });

    await when("V відкриває сторінку цього запуску за прямим посиланням", async () => {
      await page.goto(`/runs/${otherRunId}`);
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "Run not found" and none of the tasks of the run.',
        visible: ["повідомлення «Run not found»", `немає жодної задачі запуску: ${otherTasks.map((x) => `«${x.name}»`).join(", ")}`],
        hidden: ["на сторінці немає назви запуску «Apartment 14, repair» і жодного рядка задачі (data-testid=run-task)"],
      },
      async () => {
        await expect(main(page).getByText("Run not found", { exact: true })).toBeVisible();
        await expect(main(page).getByTestId("run-task")).toHaveCount(0);
        for (const task of otherTasks) await expect(main(page).getByText(task.name, { exact: true })).toHaveCount(0);
        await expect(main(page).getByText(OTHER_RUN)).toHaveCount(0);
      },
    );
  },
);

test(
  "AC-VENDOR-10: підрядник V без жодної задачі відкриває список запусків — бачить «No tasks assigned to you yet.» і не бачить порожньої таблиці",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-10" } },
  async ({ page }) => {
    await given("підрядник V, якому не призначено жодної задачі", async () => {
      expect(await roleOf(users.V10.id)).toBe("vendor");
      const { count, error } = await adminClient()
        .from("run_tasks")
        .select("id", { count: "exact", head: true })
        .eq("assignee_id", users.V10.id);
      expect(error).toBeNull();
      expect(count).toBe(0);
      await signIn(page, users.V10.email, users.V10.password);
    });

    await when("V відкриває список запусків", async () => {
      await page.goto("/runs");
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "No tasks assigned to you yet." and no empty table.',
        visible: ["повідомлення «No tasks assigned to you yet.»", "немає порожньої таблиці"],
        hidden: ["жодного елемента table на сторінці", "немає посилання «Launch a template»"],
      },
      async () => {
        await expect(main(page).getByText("No tasks assigned to you yet.", { exact: true })).toBeVisible();
        await expect(page.getByRole("table")).toHaveCount(0);
        await expect(main(page).getByRole("link", { name: "Launch a template" })).toHaveCount(0);
      },
    );
  },
);
