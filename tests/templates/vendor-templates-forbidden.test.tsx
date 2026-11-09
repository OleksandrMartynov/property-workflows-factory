// AC-VENDOR-08: підрядник за прямим посиланням на шаблони — «Not enough rights» і «Back to runs» (не «Back to templates»:
// там та сама відмова), жодного шаблону й жодного запиту до таблиць чи функцій шаблонів (план impl-vendor, design.md, «Шаблони»).
// Справжні сторінки й requireViewer(); заглушки — лише зовнішні залежності: клієнт Supabase (записує, до чого звернулась
// сторінка), next/navigation і next/cache. Клієнт навмисно віддає шаблони з початкових даних («Tenant move-in»,
// «Apartment repair»): якби сторінка їх читала, назви з'явились би в розмітці — перевірка не спирається лише на RLS.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TENANT = "10000000-0000-0000-0000-000000000001";
const REPAIR = "10000000-0000-0000-0000-000000000002";
const VENDOR = "c0000000-0000-0000-0000-000000000001";
const TEMPLATE_NAMES = ["Tenant move-in", "Apartment repair"];
const TASK_NAMES = ["Sign the lease agreement", "Inspect the apartment", "Order cleaning", "Hand over the keys", "Record meter readings"];
const touched: string[] = [];

const versionTask = (n: number, section: string, sectionPosition: number, name: string, required: boolean) => ({
  version_id: "v1",
  template_task_id: `t${n}`,
  section_name: section,
  section_position: sectionPosition,
  position: n,
  name,
  required,
});

/** Рядки, які сторінка отримала б, якби читала дані шаблонів. */
function rows(table: string): unknown {
  if (table === "profiles") return { email: "vendor.v@example.test", role: "vendor" };
  if (table === "templates")
    return [
      { id: TENANT, current_version: 1 },
      { id: REPAIR, current_version: 1 },
    ];
  if (table === "template_versions")
    return [
      { id: "v1", template_id: TENANT, number: 1, name: "Tenant move-in", saved_at: "2026-10-20T09:00:00Z", saved_by: null },
      { id: "v2", template_id: REPAIR, number: 1, name: "Apartment repair", saved_at: "2026-10-20T09:00:00Z", saved_by: null },
    ];
  if (table === "template_version_tasks")
    return [
      versionTask(1, "Before move-in", 1, "Sign the lease agreement", true),
      versionTask(2, "Before move-in", 1, "Inspect the apartment", true),
      versionTask(3, "Before move-in", 1, "Order cleaning", false),
      versionTask(4, "Move-in day", 2, "Hand over the keys", true),
      versionTask(5, "Move-in day", 2, "Record meter readings", false),
    ];
  if (table === "template_sections") return [{ id: "s1", name: "Before move-in", position: 1 }];
  if (table === "template_tasks") return [{ id: "t1", section_id: "s1", name: "Sign the lease agreement", required: true, position: 1 }];
  return [];
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: VENDOR, email: "vendor.v@example.test" } } }) },
    from: (table: string) => {
      touched.push(`from ${table}`);
      const chain: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "not", "order", "maybeSingle", "single"]) chain[m] = () => chain;
      chain.then = (resolve: (r: unknown) => unknown) => resolve({ data: rows(table), error: null });
      return chain;
    },
    rpc: async (fn: string) => {
      touched.push(`rpc ${fn}`);
      const data =
        fn === "list_template_drafts"
          ? [
              { id: TENANT, name: "Tenant move-in", current_version: 1, has_unpublished_changes: false },
              { id: REPAIR, name: "Apartment repair", current_version: 1, has_unpublished_changes: false },
            ]
          : [];
      return { data, error: null };
    },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { default: TemplatesPage } = await import("@/app/(app)/templates/page");
const { default: TemplatePage } = await import("@/app/(app)/templates/[id]/page");
const { default: LaunchTemplatePage } = await import("@/app/(app)/templates/[id]/launch/page");
const { default: NewTemplatePage } = await import("@/app/(app)/templates/new/page");
const { default: EditTemplatePage } = await import("@/app/(app)/templates/[id]/edit/page");
const { default: TemplateVersionsPage } = await import("@/app/(app)/templates/[id]/versions/page");

const params = { params: Promise.resolve({ id: TENANT }), searchParams: Promise.resolve({}) };

/** Відмова підрядника: дослівні тексти, жодного шаблону, жодного запиту до шаблонів — лише профіль у requireViewer(). */
function expectVendorForbidden(html: string) {
  expect(html).toContain("Not enough rights");
  expect(html).toMatch(/href="\/runs"[^>]*>Back to runs</);
  expect(html).not.toContain("Back to templates");
  expect(html).not.toMatch(/href="\/templates/);
  for (const name of [...TEMPLATE_NAMES, ...TASK_NAMES]) expect(html).not.toContain(name);
  expect(html).not.toContain("<table");
  expect(html).not.toContain("Version 1");
  expect(touched.filter((t) => /template/.test(t))).toEqual([]);
  expect(touched).toEqual(["from profiles"]);
}

beforeEach(() => {
  touched.length = 0;
});

describe("Шаблони для підрядника за прямим посиланням", () => {
  it("AC-VENDOR-08: підрядник V відкриває список шаблонів /templates — «Not enough rights» і «Back to runs», жодного шаблону, «Launch» чи запиту до шаблонів", async () => {
    const html = renderToStaticMarkup(await TemplatesPage());
    expectVendorForbidden(html);
    expect(html).not.toContain("Launch");
    expect(html).not.toContain("Create a template");
  });

  it("AC-VENDOR-08: підрядник V відкриває сторінку шаблону /templates/[id] — «Not enough rights» і «Back to runs», без назви, секцій і задач шаблону", async () => {
    const html = renderToStaticMarkup(await TemplatePage(params as unknown as Parameters<typeof TemplatePage>[0]));
    expectVendorForbidden(html);
    expect(html).not.toContain("Before move-in");
  });

  it("AC-VENDOR-08: підрядник V відкриває запуск шаблону /templates/[id]/launch — «Not enough rights» і «Back to runs», без форми запуску й списку виконавців", async () => {
    const html = renderToStaticMarkup(await LaunchTemplatePage(params as unknown as Parameters<typeof LaunchTemplatePage>[0]));
    expectVendorForbidden(html);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Case name");
  });

  it("AC-VENDOR-08: підрядник V відкриває новий шаблон /templates/new — «Not enough rights» і «Back to runs», без форми створення", async () => {
    const html = renderToStaticMarkup(await NewTemplatePage(params as unknown as Parameters<typeof NewTemplatePage>[0]));
    expectVendorForbidden(html);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Template name");
  });

  it("AC-VENDOR-08: підрядник V відкриває редактор /templates/[id]/edit — «Not enough rights» і «Back to runs», без вмісту редактора", async () => {
    const html = renderToStaticMarkup(await EditTemplatePage(params as unknown as Parameters<typeof EditTemplatePage>[0]));
    expectVendorForbidden(html);
    expect(html).not.toContain("Add task");
    expect(html).not.toContain("Add section");
  });

  it("AC-VENDOR-08: підрядник V відкриває версії /templates/[id]/versions — «Not enough rights» і «Back to runs», жодної версії", async () => {
    const html = renderToStaticMarkup(await TemplateVersionsPage(params as unknown as Parameters<typeof TemplateVersionsPage>[0]));
    expectVendorForbidden(html);
    expect(html).not.toMatch(/Version \d+/);
  });
});
