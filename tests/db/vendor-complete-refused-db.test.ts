// AC-VENDOR-07 — підрядник напряму (rpc, оминаючи сторінки) не позначає задачу, виконавець якої — не він. Правило живе
// в SQL (private.complete_task: vendor — лише задача, де assignee_id = auth.uid(); чужа — NOT_ALLOWED), тож перевірка —
// на справжньому Postgres (PGlite) від імені підрядника (asUser), без моків rpc. Кожна відмова перевіряє і відмову, і
// незмінні дані (asService — в обхід RLS): статус «to do», done_by і done_at порожні, запуск «in progress».
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-07); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

type Row = { assignee_id: string; status: string; done_by: string | null; done_at: string | null };

const [task1, , task3, task4] = TENANT_MOVE_IN.taskIds;

/** Дано: «Apartment 12, move-in» менеджера A; задача 1 — на A, задачі 3 і 4 — на підряднику V. */
async function given(vendorEmail: string) {
  const VENDOR_V = await addUser(t, vendorEmail, "vendor");
  const runId = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });
  const [{ id: task1Id }] = await t.asService<{ id: string }>(
    "select id from public.run_tasks where run_id = $1 and template_task_id = $2",
    [runId, task1],
  );
  expect(await taskRow(task1Id)).toEqual({ assignee_id: MANAGER_A, status: "to_do", done_by: null, done_at: null });
  return { VENDOR_V, runId, task1Id };
}

const taskRow = async (taskId: string) =>
  (await t.asService<Row>("select assignee_id, status, done_by, done_at from public.run_tasks where id = $1", [taskId]))[0];
const runStatus = async (runId: string) =>
  (await t.asService<{ status: string }>("select status from public.runs where id = $1", [runId]))[0].status;
const completeError = (userId: string, taskId: string, confirmed: boolean) =>
  t.asUser(userId, "select * from public.complete_task($1, $2)", [taskId, confirmed]).then(
    () => "",
    (e: Error) => e.message,
  );

describe("База: підрядник не позначає чужу задачу напряму", () => {
  it("AC-VENDOR-07: V викликає complete_task для задачі 1 менеджера A — NOT_ALLOWED, задача 1 лишається «to do», done_by порожній", async () => {
    const { VENDOR_V, runId, task1Id } = await given("vendor.v.ac07@example.test");

    expect(await completeError(VENDOR_V, task1Id, false)).toContain("NOT_ALLOWED");

    expect(await taskRow(task1Id)).toEqual({ assignee_id: MANAGER_A, status: "to_do", done_by: null, done_at: null });
    expect(await runStatus(runId)).toBe("in_progress");
  });

  it("AC-VENDOR-07: V викликає complete_task для задачі 1 з підтвердженням (p_confirmed = true) — NOT_ALLOWED, задача 1 лишається «to do»", async () => {
    const { VENDOR_V, runId, task1Id } = await given("vendor.v.ac07-confirmed@example.test");

    expect(await completeError(VENDOR_V, task1Id, true)).toContain("NOT_ALLOWED");

    expect(await taskRow(task1Id)).toEqual({ assignee_id: MANAGER_A, status: "to_do", done_by: null, done_at: null });
    expect(await runStatus(runId)).toBe("in_progress");
  });

  it("AC-VENDOR-07: V оновлює статус задачі 1 прямим update — заборонено, задача 1 лишається «to do»", async () => {
    const { VENDOR_V, task1Id } = await given("vendor.v.ac07-update@example.test");

    await expect(
      t.asUser(VENDOR_V, "update public.run_tasks set status = 'done', done_by = $2 where id = $1", [task1Id, VENDOR_V]),
    ).rejects.toThrow("permission denied");

    expect(await taskRow(task1Id)).toEqual({ assignee_id: MANAGER_A, status: "to_do", done_by: null, done_at: null });
  });
});
