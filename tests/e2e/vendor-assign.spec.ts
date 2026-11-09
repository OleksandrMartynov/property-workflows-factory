// UAT зрізу 3 «підрядник»: AC-VENDOR-01 (призначення підрядника під час запуску), AC-VENDOR-02 (email підрядника у
// виборі виконавця), AC-VENDOR-09 (підрядник не запускає шаблон напряму). Пише дані (@writes): синтетичні
// uat-…@example.test (менеджери A і B, адміністратор, підрядник V; роль — у profiles секретним ключем) і запуски A.
// Прибирання — test.afterAll (deleteUatUsers: спершу запуски й задачі, OWNED_ROWS у support/admin.ts).
// Специфікація: openspec/specs/run-launch/spec.md (AC-VENDOR-01, 02), openspec/specs/vendor-access/spec.md (AC-VENDOR-09).
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adminClient, deleteUatUsers, randomPassword, uatEmail } from "./support/admin";
import { attachRuntimeErrors, given, signIn, thenStep, when } from "./support/uat";

// «Tenant move-in» — шаблон із початкових даних (міграція 20261019174350_run_launch.sql), той самий id на проді.
const TENANT_MOVE_IN = "10000000-0000-0000-0000-000000000001";
const CASE_NAME = "Apartment 12, move-in";

type Role = "manager" | "admin" | "vendor";
type Account = { email: string; password: string; fullName: string; role: Role; id: string };

// Суфікси без слів ролей: перевірка «без ролей» шукає ці слова в списку вибору, а адреса їх не має містити.
const ACCOUNTS: Record<"A" | "B" | "ADMIN" | "V" | "V9", Omit<Account, "id" | "password">> = {
  A: { email: uatEmail("p1"), fullName: "Uat Person One", role: "manager" },
  B: { email: uatEmail("p2"), fullName: "Uat Person Two", role: "manager" },
  ADMIN: { email: uatEmail("p3"), fullName: "Uat Person Three", role: "admin" },
  V: { email: uatEmail("p4"), fullName: "Uat Person Four", role: "vendor" },
  // Окремий підрядник для AC-VENDOR-09: без задач з AC-VENDOR-01, щоб його список запусків не залежав від порядку тестів.
  V9: { email: uatEmail("p5"), fullName: "Uat Person Five", role: "vendor" },
};
const users = {} as Record<keyof typeof ACCOUNTS, Account>;

// Без serial: якщо тест упаде, Playwright перезапустить воркер — afterAll прибере користувачів, а beforeAll створить
// їх знову, і наступні AC усе одно пройдуть (кожен AC — окремий доказ).
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

const runsCount = async () => {
  const { count, error } = await adminClient().from("runs").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
};

const assigneePickers = (page: Page) => page.getByRole("main").getByRole("combobox", { name: /^Assignee of / });

async function chooseAssignee(page: Page, index: number, email: string) {
  const picker = assigneePickers(page).nth(index);
  await picker.click();
  await picker.fill(email);
  await page.getByRole("option", { name: email }).click();
}

test(
  "AC-VENDOR-01: менеджер A запускає «Tenant move-in» для «Apartment 12, move-in» і призначає підрядника V задачам 3 і 4 — задачі 3 і 4 на V, задачі 1, 2 і 5 на A",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-01" } },
  async ({ page }) => {
    await given("менеджер A, підрядник V і шаблон «Tenant move-in» з 5 задачами", async () => {
      expect(await roleOf(users.A.id)).toBe("manager");
      expect(await roleOf(users.V.id)).toBe("vendor");
      await signIn(page, users.A.email, users.A.password);
      await page.goto(`/templates/${TENANT_MOVE_IN}/launch`);
      await expect(assigneePickers(page)).toHaveCount(5);
    });

    let runId = "";
    await when("A запускає шаблон для випадку «Apartment 12, move-in» і призначає V виконавцем задач 3 і 4", async () => {
      await page.getByRole("main").getByLabel("Case name").fill(CASE_NAME);
      await chooseAssignee(page, 2, users.V.email);
      await chooseAssignee(page, 3, users.V.email);
      await page.getByRole("main").getByRole("button", { name: "Launch", exact: true }).click();
      await page.waitForURL(/\/runs\/[0-9a-f-]{36}/);
      runId = new URL(page.url()).pathname.split("/").pop() ?? "";
    });

    await thenStep(
      page,
      {
        clause: "tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.",
        visible: [
          `задачі 3 і 4 запуску «${CASE_NAME}» з виконавцем ${users.V.email}`,
          `задачі 1, 2 і 5 з виконавцем ${users.A.email}`,
        ],
        hidden: ["у базі run_tasks цього запуску: виконавець задач 3 і 4 — id V, задач 1, 2 і 5 — id A"],
      },
      async () => {
        const tasks = page.getByRole("main").getByTestId("run-task");
        await expect(tasks).toHaveCount(5);
        const expected = [users.A, users.A, users.V, users.V, users.A];
        for (const [i, who] of expected.entries()) await expect(tasks.nth(i)).toContainText(who.email);

        const { data, error } = await adminClient()
          .from("run_tasks")
          .select("assignee_id")
          .eq("run_id", runId)
          .order("section_position")
          .order("position");
        expect(error).toBeNull();
        expect((data ?? []).map((x) => x.assignee_id)).toEqual(expected.map((x) => x.id));
      },
    );
  },
);

test(
  "AC-VENDOR-02: менеджер A у виборі виконавця під час запуску бачить email менеджера B, адміністратора і підрядника V — без імен, ролей та інших даних профілю",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-02" } },
  async ({ page }) => {
    await given("менеджери A і B, адміністратор і підрядник V, і A запускає шаблон", async () => {
      expect(await roleOf(users.A.id)).toBe("manager");
      expect(await roleOf(users.B.id)).toBe("manager");
      expect(await roleOf(users.ADMIN.id)).toBe("admin");
      expect(await roleOf(users.V.id)).toBe("vendor");
      await signIn(page, users.A.email, users.A.password);
      await page.goto(`/templates/${TENANT_MOVE_IN}/launch`);
      await expect(assigneePickers(page).first()).toBeVisible();
    });

    await when("A відкриває вибір виконавця", async () => {
      await assigneePickers(page).first().click();
      await expect(page.getByRole("listbox")).toBeVisible();
    });

    // Список прокручується: варіанти B, адміністратора й V можуть бути нижче видимої частини. Тож «Тоді» — три кадри,
    // по одному на кожен email: варіант прокручено в поле зору списку, і його email показано повністю (без трикрапки).
    const seen = [
      { who: "B", email: users.B.email },
      { who: "адміністратора", email: users.ADMIN.email },
      { who: "V", email: users.V.email },
    ];
    for (const { who, email } of seen) {
      await thenStep(
        page,
        {
          clause: "A sees the emails of B, of the administrator and of V, and no names, roles or other profile data.",
          visible: [`email ${who} ${email} — повністю, без трикрапки, у видимій частині відкритого списку вибору виконавця`],
          hidden: [
            `варіант ${email} у полі зору списку (toBeInViewport), підпис не обрізано (scrollWidth ≤ clientWidth)`,
            `немає імен «${users.B.fullName}», «${users.ADMIN.fullName}», «${users.V.fullName}» ніде на сторінці`,
            "у варіантах B, адміністратора й V немає слів ролей (manager, admin, administrator, vendor)",
          ],
        },
        async () => {
          const listbox = page.getByRole("listbox");
          await expect(listbox).toBeVisible();
          const option = listbox.getByRole("option", { name: email });
          await option.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
          await expect(option).toBeInViewport({ ratio: 1 });
          // Підпис варіанта — найменший елемент з текстом email: увесь текст уміщено, нічого не сховано за краєм.
          const label = option.getByText(email, { exact: true });
          await expect(label).toBeVisible();
          const fits = await label.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
          expect(fits.scroll, `email ${email} обрізано: scrollWidth ${fits.scroll} > clientWidth ${fits.client}`).toBeLessThanOrEqual(
            fits.client,
          );

          for (const other of [users.B, users.ADMIN, users.V]) {
            await expect(listbox.getByRole("option", { name: other.email })).not.toContainText(/manager|admin|vendor/i);
            await expect(page.getByText(other.fullName)).toHaveCount(0);
          }
        },
      );
    }
  },
);

test(
  "AC-VENDOR-09: підрядник V напряму, оминаючи сторінки, запускає «Tenant move-in» — запуск не створено, список запусків не змінився",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-09" } },
  async ({ page }) => {
    let before = 0;
    let listBefore = "";
    await given("підрядник V увійшов і шаблон «Tenant move-in» має поточну версію", async () => {
      expect(await roleOf(users.V9.id)).toBe("vendor");
      // На проді поточна версія може бути вже не 1 (зріз 2 зберігав нові версії) — фіксуємо, що вона є.
      const { data } = await adminClient().from("templates").select("current_version").eq("id", TENANT_MOVE_IN).single();
      expect(data?.current_version).toBeGreaterThanOrEqual(1);
      await signIn(page, users.V9.email, users.V9.password);
      await page.goto("/runs");
      listBefore = await page.getByRole("main").ariaSnapshot();
      before = await runsCount();
    });

    let errorMessage = "";
    await when("V намагається запустити цей шаблон напряму, оминаючи сторінки застосунку (rpc launch_run від імені V)", async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      expect(url && key, "потрібні NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").toBeTruthy();
      const asVendor = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: signInError } = await asVendor.auth.signInWithPassword({
        email: users.V9.email,
        password: users.V9.password,
      });
      expect(signInError).toBeNull();
      const { error } = await asVendor.rpc("launch_run", {
        p_template_id: TENANT_MOVE_IN,
        p_case_name: CASE_NAME,
        p_assignees: {},
      });
      errorMessage = error?.message ?? "";
      await asVendor.auth.signOut();
    });

    await thenStep(
      page,
      {
        clause: "no run is created, and the list of runs does not change.",
        visible: ["список запусків V такий самий, як до спроби запуску: без запуску «Apartment 12, move-in»"],
        hidden: [
          "launch_run від імені V відхилено з LAUNCH_NOT_ALLOWED",
          "кількість запусків у базі до = після; запуску з менеджером запуску V немає",
        ],
      },
      async () => {
        await page.reload();
        await expect(page.getByRole("main").getByText(CASE_NAME)).toHaveCount(0);
        expect(await page.getByRole("main").ariaSnapshot()).toBe(listBefore);

        expect(errorMessage).toContain("LAUNCH_NOT_ALLOWED");
        expect(await runsCount()).toBe(before);
        const { count } = await adminClient()
          .from("runs")
          .select("id", { count: "exact", head: true })
          .eq("run_manager_id", users.V9.id);
        expect(count).toBe(0);
      },
    );
  },
);
