// AC-VENDOR-03 — підрядник бачить у списку лише запуски зі своїми задачами, зі статусом і «Your tasks: N of K done».
// Правило живе в базі: runs_select_visible підрядника не пускає (рядок runs містить назву шаблону й версію, а RLS не
// ховає колонок; матриця прав «See which template version a run follows» — «—» для vendor), а свої запуски він отримує
// функцією public.vendor_runs(p_run_id) — обгортка security invoker над private.vendor_runs (security definer,
// set search_path = ''): id, case_name, status, created_at, done і total (N і K лише його задач), від новіших.
// Перевірка — на справжньому Postgres (PGlite) з усіма міграціями, від імені підрядника (asUser), без моків.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-03); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { formatVendorProgress } from "@/lib/runs/progress";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

type VendorRun = { id: string; case_name: string; status: string; done: number; total: number };

const [, , task3, task4] = TENANT_MOVE_IN.taskIds;

/** Дано: V — виконавець задач 3 і 4 у «Apartment 12, move-in» і жодної задачі в «Apartment 14, repair» (обидва — запуски A). */
async function vendorWithTwoRuns(vendorEmail: string) {
  const VENDOR_V = await addUser(t, vendorEmail, "vendor");
  const apartment12 = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });
  const apartment14 = await launch(t, MANAGER_A, "Apartment 14, repair");
  const ofV = await t.asService<{ run_id: string; n: number }>(
    "select run_id, count(*)::int as n from public.run_tasks where assignee_id = $1 group by run_id",
    [VENDOR_V],
  );
  expect(ofV).toEqual([{ run_id: apartment12, n: 2 }]);
  return { VENDOR_V, apartment12, apartment14 };
}

describe("База: список запусків підрядника (public.vendor_runs)", () => {
  it("AC-VENDOR-03: V (2 задачі в «Apartment 12, move-in», жодної в «Apartment 14, repair») відкриває список запусків — лише «Apartment 12, move-in» зі статусом запуску й «Your tasks: 0 of 2 done»; «Apartment 14, repair» немає", async () => {
    const { VENDOR_V, apartment12, apartment14 } = await vendorWithTwoRuns("vendor.v.ac03@example.test");

    const rows = await t.asUser<VendorRun>(
      VENDOR_V,
      "select id, case_name, status, done, total from public.vendor_runs(null)",
    );

    expect(rows).toEqual([{ id: apartment12, case_name: "Apartment 12, move-in", status: "in_progress", done: 0, total: 2 }]);
    expect(rows.map((r) => r.id)).not.toContain(apartment14);
    expect(rows.map((r) => r.case_name)).not.toContain("Apartment 14, repair");
    expect(formatVendorProgress(rows[0].done, rows[0].total)).toBe("Your tasks: 0 of 2 done");
  });

  it("AC-VENDOR-03: рядок vendor_runs має рівно колонки id, case_name, status, created_at, done, total — без назви шаблону, версії й менеджера запуску", async () => {
    const { VENDOR_V } = await vendorWithTwoRuns("vendor.v.ac03-columns@example.test");

    const [row] = await t.asUser<Record<string, unknown>>(VENDOR_V, "select * from public.vendor_runs(null)");

    expect(Object.keys(row).sort()).toEqual(["case_name", "created_at", "done", "id", "status", "total"]);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it("AC-VENDOR-03: прямий select runs від імені V — 0 рядків, навіть запуску «Apartment 12, move-in», де він виконавець (назву шаблону й версію V не отримує)", async () => {
    const { VENDOR_V, apartment12 } = await vendorWithTwoRuns("vendor.v.ac03-direct@example.test");

    expect(await t.asUser(VENDOR_V, "select * from public.runs")).toEqual([]);
    expect(await t.asUser(VENDOR_V, "select id, template_name from public.runs where id = $1", [apartment12])).toEqual([]);

    // Обмеження — лише для підрядника: менеджер A і далі читає свій запуск з runs, як раніше.
    const ofA = await t.asUser<{ id: string; case_name: string }>(MANAGER_A, "select id, case_name from public.runs where id = $1", [apartment12]);
    expect(ofA).toEqual([{ id: apartment12, case_name: "Apartment 12, move-in" }]);
  });

  it("AC-VENDOR-03: N і K — лише задачі V: після позначки задачі 3 — «Your tasks: 1 of 2 done», запуски від новіших", async () => {
    const { VENDOR_V, apartment12 } = await vendorWithTwoRuns("vendor.v.ac03-progress@example.test");
    const [own3] = await t.asService<{ id: string }>(
      "select id from public.run_tasks where run_id = $1 and template_task_id = $2",
      [apartment12, task3],
    );
    await t.asUser(VENDOR_V, "select public.complete_task($1)", [own3.id]);
    const newer = await launch(t, MANAGER_A, "Apartment 15, move-in", { [task4]: VENDOR_V });

    const rows = await t.asUser<VendorRun>(VENDOR_V, "select id, case_name, status, done, total from public.vendor_runs(null)");

    expect(rows).toEqual([
      { id: newer, case_name: "Apartment 15, move-in", status: "in_progress", done: 0, total: 1 },
      { id: apartment12, case_name: "Apartment 12, move-in", status: "in_progress", done: 1, total: 2 },
    ]);
    expect(formatVendorProgress(rows[1].done, rows[1].total)).toBe("Your tasks: 1 of 2 done");
  });

  it("AC-VENDOR-03: vendor_runs без входу (anon) — permission denied; public.vendor_runs — security invoker, private.vendor_runs — security definer з search_path = ''", async () => {
    await expect(t.asAnon("select * from public.vendor_runs(null)")).rejects.toThrow("permission denied");

    const fns = await t.asService<{ schema: string; definer: boolean; config: string[] | null }>(
      `select n.nspname as schema, p.prosecdef as definer, p.proconfig as config
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where p.proname = 'vendor_runs' order by n.nspname`,
    );
    expect(fns.map(({ schema, definer }) => ({ schema, definer }))).toEqual([
      { schema: "private", definer: true },
      { schema: "public", definer: false },
    ]);
    // Так само записано set search_path = '' у наявних функціях private (напр. private.can_see_run).
    const [canSeeRun] = await t.asService<{ config: string[] }>("select proconfig as config from pg_proc where proname = 'can_see_run'");
    expect(fns[0].config).toEqual(canSeeRun.config);
  });
});
