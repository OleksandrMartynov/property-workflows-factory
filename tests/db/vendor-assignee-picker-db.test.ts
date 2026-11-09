// AC-VENDOR-02 — вибір виконавця під час запуску показує менеджеру email підрядника поруч з іншими, без імен і ролей.
// Правило живе в SQL (private.list_assignable_users: менеджеру й адміністратору — manager, admin і vendor; лише id і
// email), тож перевірка — на справжньому Postgres (PGlite) від імені менеджера A (asUser), без моків rpc.
// Специфікація: openspec/specs/run-launch/spec.md (AC-VENDOR-02); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

const MANAGER_B_EMAIL = "manager.b@example.test";
const ADMIN_EMAIL = "admin@example.test";

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("База: email підрядника у виборі виконавця", () => {
  it("AC-VENDOR-02: A відкриває вибір виконавця — бачить email B, адміністратора і V, без імен, ролей та інших даних профілю", async () => {
    const vendorEmail = "vendor.v.ac02@example.test";
    const VENDOR_V = await addUser(t, vendorEmail, "vendor");

    const assignable = await t.asUser<Record<string, unknown>>(MANAGER_A, "select * from public.list_assignable_users()");

    expect(assignable.map((x) => x.email)).toEqual(expect.arrayContaining([MANAGER_B_EMAIL, ADMIN_EMAIL, vendorEmail]));
    expect(assignable.find((x) => x.email === vendorEmail)).toEqual({ id: VENDOR_V, email: vendorEmail });
    // Жодних імен, ролей чи інших полів профілю — у кожному рядку лише id і email.
    for (const row of assignable) expect(Object.keys(row).sort()).toEqual(["email", "id"]);
  });

  it("AC-VENDOR-02: A напряму не читає профіль V (ім'я, роль) — 0 рядків", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac02-profile@example.test", "vendor");

    const profiles = await t.asUser<{ id: string }>(MANAGER_A, "select id, full_name, role from public.profiles where id = $1", [VENDOR_V]);

    expect(profiles).toEqual([]);
  });
});
