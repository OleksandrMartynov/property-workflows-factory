// UAT зрізу 3 «підрядник»: AC-VENDOR-04 (підрядник бачить у запуску лише свої задачі), AC-VENDOR-05 (позначає свою задачу
// й бачить «Your tasks: 1 of 2 done»), AC-VENDOR-07 (прямий запит на чужу задачу — вона лишається «to do»). Пише дані
// (@writes): синтетичні uat-…@example.test (менеджер A і підрядник V; роль — у profiles секретним ключем) і запуски A.
// Прибирання — test.afterAll (deleteUatUsers: спершу A з його запусками й задачами, потім V; OWNED_ROWS у support/admin.ts).
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-04, 05, 07); план: openspec/changes/impl-vendor/design.md.
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adminClient, deleteUatUsers, randomPassword, uatEmail } from "./support/admin";
import { attachRuntimeErrors, given, signIn, thenStep, when } from "./support/uat";

// «Tenant move-in» — шаблон із початкових даних (міграція 20261019174350_run_launch.sql), той самий id на проді.
const TENANT_MOVE_IN = "10000000-0000-0000-0000-000000000001";
const CASE_NAME = "Apartment 12, move-in";

type Role = "manager" | "vendor";
type Account = { email: string; password: string; fullName: string; role: Role; id: string };

// A — перший: afterAll видаляє A разом із його запусками, і лише тоді V (на нього посилаються задачі запусків A).
const ACCOUNTS: Record<"A" | "V", Omit<Account, "id" | "password">> = {
  A: { email: uatEmail("q1"), fullName: "Uat Tasks One", role: "manager" },
  V: { email: uatEmail("q2"), fullName: "Uat Tasks Two", role: "vendor" },
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

/** Клієнт Data API від імені користувача (публічний ключ + вхід паролем) — як запит, що оминає сторінки застосунку. */
async function signedInClient(who: Account) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  expect(url && key, "потрібні NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").toBeTruthy();
  const client = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: who.email, password: who.password });
  expect(error).toBeNull();
  return client;
}

type RunTask = { id: string; name: string; section_name: string; required: boolean; status: string; assignee_id: string; done_by: string | null };

const runTasks = async (runId: string) => {
  const { data, error } = await adminClient()
    .from("run_tasks")
    .select("id, name, section_name, required, status, assignee_id, done_by")
    .eq("run_id", runId)
    .order("section_position")
    .order("position");
  expect(error).toBeNull();
  return (data ?? []) as RunTask[];
};

/**
 * Дано: A запускає «Tenant move-in» (поточна версія, 5 задач) для «Apartment 12, move-in» і призначає V задачі 3 і 4;
 * решта — на A. Запуск — rpc launch_run від імені A (сторінку запуску перевіряє AC-VENDOR-01). Повертає id і задачі 1–5.
 */
async function launchRunWithVendorTasks() {
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

  const asA = await signedInClient(users.A);
  const { data: runId, error } = await asA.rpc("launch_run", {
    p_template_id: TENANT_MOVE_IN,
    p_case_name: CASE_NAME,
    p_assignees: { [keys[2]]: users.V.id, [keys[3]]: users.V.id },
  });
  await asA.auth.signOut();
  expect(error).toBeNull();

  const tasks = await runTasks(runId as string);
  expect(tasks).toHaveLength(5);
  expect(tasks.map((x) => x.assignee_id)).toEqual([users.A.id, users.A.id, users.V.id, users.V.id, users.A.id]);
  return { runId: runId as string, tasks };
}

const taskRows = (page: Page) => page.getByRole("main").getByTestId("run-task");
const requiredLabel = (required: boolean) => (required ? "required" : "optional");

test(
  "AC-VENDOR-04: підрядник V (виконавець задач 3 і 4 запуску «Apartment 12, move-in» з 5 задачами) відкриває запуск — бачить рівно задачі 3 і 4 з назвою, секцією, «required»/«optional» і статусом; не бачить задач 1, 2 і 5, email інших користувачів і прогресу всього запуску",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-04" } },
  async ({ page }) => {
    let runId = "";
    let tasks: RunTask[] = [];
    await given("підрядник V — виконавець задач 3 і 4 у запуску «Apartment 12, move-in» з 5 задачами", async () => {
      expect(await roleOf(users.A.id)).toBe("manager");
      expect(await roleOf(users.V.id)).toBe("vendor");
      ({ runId, tasks } = await launchRunWithVendorTasks());
      await signIn(page, users.V.email, users.V.password);
    });

    await when("V відкриває цей запуск", async () => {
      await page.goto(`/runs/${runId}`);
    });

    const [task1, task2, task3, task4, task5] = tasks;
    await thenStep(
      page,
      {
        clause:
          'V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run.',
        visible: [
          `рівно 2 задачі: «${task3.name}» (секція «${task3.section_name}», «${requiredLabel(task3.required)}», «to do») і «${task4.name}» (секція «${task4.section_name}», «${requiredLabel(task4.required)}», «to do»)`,
          `немає задач «${task1.name}», «${task2.name}», «${task5.name}»`,
          `немає email ${users.A.email} і панелі «Details»; немає прогресу всього запуску «N of 5 done»`,
        ],
        hidden: ["у тексті main немає жодного «N of M done», крім «Your tasks: N of K done»"],
      },
      async () => {
        const main = page.getByRole("main");
        const rows = taskRows(page);
        await expect(rows).toHaveCount(2);
        for (const [i, task] of [task3, task4].entries()) {
          await expect(rows.nth(i)).toContainText(task.name);
          await expect(rows.nth(i)).toContainText(requiredLabel(task.required));
          await expect(rows.nth(i)).toContainText("to do");
          await expect(main.getByRole("heading", { name: task.section_name })).toBeVisible();
        }
        for (const task of [task1, task2, task5]) await expect(main.getByText(task.name, { exact: true })).toHaveCount(0);

        await expect(page.getByText(users.A.email)).toHaveCount(0);
        await expect(main.getByRole("heading", { name: "Details" })).toHaveCount(0);
        const mainText = await main.innerText();
        expect(mainText.replace(/Your tasks: \d+ of \d+ done/g, "")).not.toMatch(/\d+ of \d+ done/);
      },
    );
  },
);

test(
  "AC-VENDOR-05: підрядник V позначає свою задачу 3 «to do» (не остання обов'язкова) у «Apartment 12, move-in» — задача 3 має статус «done», V бачить «Your tasks: 1 of 2 done»",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-05" } },
  async ({ page }) => {
    let runId = "";
    let tasks: RunTask[] = [];
    await given("підрядник V — виконавець задачі 3 «to do», яка не є останньою обов'язковою задачею запуску «Apartment 12, move-in»", async () => {
      expect(await roleOf(users.V.id)).toBe("vendor");
      ({ runId, tasks } = await launchRunWithVendorTasks());
      const task3 = tasks[2];
      expect(task3.status).toBe("to_do");
      expect(tasks.filter((x) => x.required && x.status === "to_do" && x.id !== task3.id).length).toBeGreaterThan(0);
      await signIn(page, users.V.email, users.V.password);
      await page.goto(`/runs/${runId}`);
      await expect(taskRows(page).nth(0)).toContainText(task3.name);
    });

    await when("V позначає задачу 3 виконаною", async () => {
      await taskRows(page).nth(0).getByRole("button", { name: "Mark as done" }).click();
    });

    const task3 = tasks[2];
    await thenStep(
      page,
      {
        clause: 'task 3 has status "done", and V sees "Your tasks: 1 of 2 done".',
        visible: [`задача «${task3.name}» зі статусом «done»`, "«Your tasks: 1 of 2 done»"],
        hidden: ["у базі задача 3 — status = done, done_by = id V"],
      },
      async () => {
        const row = taskRows(page).nth(0);
        await expect(row).toContainText(task3.name);
        await expect(row.getByText("done", { exact: true })).toBeVisible();
        await expect(row).not.toContainText("to do");
        await expect(page.getByRole("main").getByText("Your tasks: 1 of 2 done")).toBeVisible();

        const after = (await runTasks(runId)).find((x) => x.id === task3.id);
        expect(after?.status).toBe("done");
        expect(after?.done_by).toBe(users.V.id);
      },
    );
  },
);

test(
  "AC-VENDOR-07: у «Apartment 12, move-in» задача 1 — на менеджері A, задачі 3 і 4 — на підряднику V; V напряму, оминаючи сторінки, позначає задачу 1 виконаною — задача 1 лишається «to do»",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-07" } },
  async ({ page }) => {
    let runId = "";
    let tasks: RunTask[] = [];
    await given("запуск «Apartment 12, move-in», у якому задача 1 призначена менеджеру A, а задачі 3 і 4 — підряднику V", async () => {
      expect(await roleOf(users.A.id)).toBe("manager");
      expect(await roleOf(users.V.id)).toBe("vendor");
      ({ runId, tasks } = await launchRunWithVendorTasks());
      expect(tasks[0].assignee_id).toBe(users.A.id);
      expect(tasks[0].status).toBe("to_do");
      // Екран менеджера A: на ньому видно задачу 1 до й після спроби V.
      await signIn(page, users.A.email, users.A.password);
      await page.goto(`/runs/${runId}`);
      await expect(taskRows(page)).toHaveCount(5);
      await expect(taskRows(page).nth(0)).toContainText("to do");
    });

    let errorMessage = "";
    await when("V намагається позначити задачу 1 виконаною напряму, оминаючи сторінки застосунку (rpc complete_task від імені V)", async () => {
      const asVendor = await signedInClient(users.V);
      const { error } = await asVendor.rpc("complete_task", { p_task_id: tasks[0].id, p_confirmed: false });
      errorMessage = error?.message ?? "";
      await asVendor.auth.signOut();
    });

    const task1 = tasks[0];
    await thenStep(
      page,
      {
        clause: 'task 1 stays "to do".',
        visible: [`на сторінці запуску менеджера A задача «${task1.name}» зі статусом «to do»`],
        hidden: ["complete_task від імені V відхилено з NOT_ALLOWED", "у базі задача 1 — status = to_do, done_by порожній"],
      },
      async () => {
        await page.reload();
        const row = taskRows(page).nth(0);
        await expect(row).toContainText(task1.name);
        await expect(row.getByText("to do", { exact: true })).toBeVisible();

        expect(errorMessage).toContain("NOT_ALLOWED");
        const after = (await runTasks(runId)).find((x) => x.id === task1.id);
        expect(after?.status).toBe("to_do");
        expect(after?.done_by).toBeNull();
      },
    );
  },
);
