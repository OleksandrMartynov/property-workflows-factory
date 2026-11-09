// AC-VENDOR-10 — підрядник без жодної задачі: список запусків порожній («No tasks assigned to you yet.» без таблиці —
// tests/runs/vendor-runs-list.test.tsx). Тут — правило бази на справжньому Postgres (PGlite), від імені підрядника
// (asUser), без моків: public.vendor_runs(null) не віддає жодного запуску, хоча запуски агенції є.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-10); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("База: підрядник без задач", () => {
  it("AC-VENDOR-10: V без жодної задачі (у базі є запуски менеджера A) — vendor_runs(null) від імені V дає 0 рядків, прямий select runs — теж 0", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac10@example.test", "vendor");
    await launch(t, MANAGER_A, "Apartment 12, move-in");
    await launch(t, MANAGER_A, "Apartment 14, repair");
    const [{ runs }] = await t.asService<{ runs: number }>("select count(*)::int as runs from public.runs");
    expect(runs).toBeGreaterThanOrEqual(2);
    expect(await t.asService("select id from public.run_tasks where assignee_id = $1", [VENDOR_V])).toEqual([]);

    expect(await t.asUser(VENDOR_V, "select * from public.vendor_runs(null)")).toEqual([]);
    expect(await t.asUser(VENDOR_V, "select id from public.runs")).toEqual([]);
  });
});
