// UAT зрізу 3 «підрядник»: AC-VENDOR-08 (підрядник за прямим посиланням на список шаблонів — «Not enough rights» і
// жодного шаблону). Пише дані (@writes): синтетичний підрядник uat-…-t1@example.test (роль — у profiles секретним ключем).
// Шаблони лише читаються секретним ключем (передумова «є шаблони»). Прибирання — test.afterAll (deleteUatUsers).
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-08); план: openspec/changes/impl-vendor/design.md («Шаблони»).
import { expect, test } from "@playwright/test";
import { adminClient, deleteUatUsers, randomPassword, uatEmail } from "./support/admin";
import { attachRuntimeErrors, given, signIn, thenStep, when } from "./support/uat";

type Account = { email: string; password: string; fullName: string; id: string };

const V: Omit<Account, "id" | "password"> = { email: uatEmail("t1"), fullName: "Uat Templates One" };
let vendor: Account;

test.beforeAll(async () => {
  const supabase = adminClient();
  const password = randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email: V.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: V.fullName },
  });
  if (error) throw error;
  // Роль задає адміністратор (service_role), як npm run users:demo; тригер створив профіль з роллю за замовчуванням.
  const { error: roleError } = await supabase.from("profiles").update({ role: "vendor" }).eq("id", data.user.id);
  if (roleError) throw roleError;
  vendor = { ...V, password, id: data.user.id };
});

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test.afterAll(async () => {
  await deleteUatUsers(V.email);
});

/** Назви поточних версій усіх шаблонів (секретний ключ, лише читання): саме їх V не має побачити. */
async function currentTemplateNames() {
  const admin = adminClient();
  const { data: templates, error } = await admin.from("templates").select("id, current_version").not("current_version", "is", null);
  expect(error).toBeNull();
  const { data: versions, error: versionsError } = await admin
    .from("template_versions")
    .select("template_id, number, name")
    .in(
      "template_id",
      (templates ?? []).map((t) => t.id),
    );
  expect(versionsError).toBeNull();
  const current = new Map((templates ?? []).map((t) => [t.id as string, t.current_version as number]));
  return (versions ?? []).filter((v) => current.get(v.template_id as string) === v.number).map((v) => v.name as string);
}

test(
  "AC-VENDOR-08: підрядник V відкриває список шаблонів за прямим посиланням — бачить «Not enough rights» і жодного шаблону",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-08" } },
  async ({ page }) => {
    let names: string[] = [];
    await given("підрядник V увійшов; у агенції є збережені шаблони (зокрема «Tenant move-in»)", async () => {
      const { data: profile } = await adminClient().from("profiles").select("role").eq("id", vendor.id).single();
      expect(profile?.role).toBe("vendor");
      // Передумова: без шаблонів «жодного шаблону» пройшло б і на порожньому списку.
      names = await currentTemplateNames();
      expect(names).toContain("Tenant move-in");
      await signIn(page, vendor.email, vendor.password);
    });

    await when("V відкриває список шаблонів за прямим посиланням /templates", async () => {
      await page.goto("/templates");
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "Not enough rights" and no template.',
        visible: ["повідомлення «Not enough rights»", `немає жодного шаблону: ${names.map((n) => `«${n}»`).join(", ")}`],
        hidden: ["жодного елемента table на сторінці", "посилання «Back to runs» веде на /runs (план impl-vendor)"],
      },
      async () => {
        const main = page.getByRole("main");
        await expect(main.getByRole("alert")).toHaveText("Not enough rights");
        await expect(main.getByRole("link", { name: "Back to runs" })).toHaveAttribute("href", "/runs");
        for (const name of names) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
        await expect(page.getByRole("table")).toHaveCount(0);
      },
    );
  },
);
