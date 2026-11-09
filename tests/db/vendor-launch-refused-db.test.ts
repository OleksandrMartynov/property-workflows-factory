// AC-VENDOR-09 — підрядник не запускає шаблон напряму (rpc public.launch_run, оминаючи сторінки). Правило живе в SQL
// (private.launch_run: запускає лише manager або admin; підрядник — LAUNCH_NOT_ALLOWED, запуску немає), тож перевірка —
// на справжньому Postgres (PGlite) від імені підрядника (asUser), без моків rpc. Кожна відмова перевіряє і відмову, і
// незмінний список запусків (asService — в обхід RLS).
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-09); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
  // Список запусків не порожній: інакше «не змінився» пройшло б і на базі, де запусків немає взагалі.
  await launch(t, MANAGER_A, "Apartment 14, repair");
}, 60_000);

const allRuns = async () =>
  (await t.asService<{ id: string }>("select id from public.runs order by id")).map((x) => x.id);
const currentVersion = async () =>
  (await t.asService<{ n: number }>("select current_version as n from public.templates where id = $1", [TENANT_MOVE_IN.id]))[0].n;
const launchError = (userId: string, assignees: Record<string, string> = {}) =>
  launch(t, userId, "Apartment 12, move-in", assignees).then(
    () => "",
    (e: Error) => e.message,
  );

describe("База: підрядник не запускає шаблон напряму", () => {
  it("AC-VENDOR-09: V викликає launch_run для «Tenant move-in» (поточна версія 1) — LAUNCH_NOT_ALLOWED, запуск не створено, список запусків не змінився", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac09@example.test", "vendor");
    expect(await currentVersion()).toBe(1);
    const before = await allRuns();
    expect(before.length).toBeGreaterThan(0);

    expect(await launchError(VENDOR_V)).toContain("LAUNCH_NOT_ALLOWED");

    expect(await allRuns()).toEqual(before);
    // Запуску, де V — менеджер запуску, немає.
    expect(await t.asService("select id from public.runs where run_manager_id = $1", [VENDOR_V])).toEqual([]);
  });

  it("AC-VENDOR-09: V викликає launch_run, призначивши собі всі задачі — LAUNCH_NOT_ALLOWED, список запусків не змінився", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac09-assign@example.test", "vendor");
    const before = await allRuns();

    const toSelf = Object.fromEntries(TENANT_MOVE_IN.taskIds.map((id) => [id, VENDOR_V]));
    expect(await launchError(VENDOR_V, toSelf)).toContain("LAUNCH_NOT_ALLOWED");

    expect(await allRuns()).toEqual(before);
    expect(await t.asService("select id from public.run_tasks where assignee_id = $1", [VENDOR_V])).toEqual([]);
  });
});
