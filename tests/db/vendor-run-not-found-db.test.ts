// AC-VENDOR-06 — запуск без задач підрядника за прямим посиланням: «Run not found» і жодної задачі. Сторінка
// /runs/[id] підрядника бере рядок запуску з public.vendor_runs(p_run_id) і задачі з run_tasks під RLS; немає рядка —
// notFound() і «Run not found» (not-found.tsx). Тут — правило бази на справжньому Postgres (PGlite), від імені
// підрядника (asUser), без моків: ні функція, ні прямий select не віддають чужого запуску чи його задач.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-06); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

const [, , task3, task4] = TENANT_MOVE_IN.taskIds;

describe("База: чужий запуск підрядника за прямим посиланням", () => {
  it("AC-VENDOR-06: запуск «Apartment 14, repair» без задач V — vendor_runs(його id) від імені V дає 0 рядків, прямі select runs і run_tasks цього запуску — теж 0", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac06@example.test", "vendor");
    // V має задачі в іншому запуску — тож порожня відповідь означає саме «чужий запуск», а не «V нічого не бачить».
    const apartment12 = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });
    const apartment14 = await launch(t, MANAGER_A, "Apartment 14, repair");
    const tasks14 = await t.asService<{ assignee_id: string }>("select assignee_id from public.run_tasks where run_id = $1", [apartment14]);
    expect(tasks14).toHaveLength(5);
    expect(tasks14.map((x) => x.assignee_id)).not.toContain(VENDOR_V);

    // Так читає запуск сторінка /runs/[id] підрядника: немає рядка — notFound() і «Run not found».
    expect(await t.asUser(VENDOR_V, "select * from public.vendor_runs($1)", [apartment14])).toEqual([]);
    expect(await t.asUser(VENDOR_V, "select id from public.runs where id = $1", [apartment14])).toEqual([]);
    expect(await t.asUser(VENDOR_V, "select id from public.run_tasks where run_id = $1", [apartment14])).toEqual([]);

    // Контроль: свій запуск за тим самим p_run_id V отримує — рівно один рядок.
    const own = await t.asUser<{ id: string; case_name: string }>(VENDOR_V, "select id, case_name from public.vendor_runs($1)", [apartment12]);
    expect(own).toEqual([{ id: apartment12, case_name: "Apartment 12, move-in" }]);
  });
});
