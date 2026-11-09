// AC-VENDOR-04 — підрядник бачить у запуску лише свої задачі. Правило живе в базі (RLS run_tasks_select_visible:
// підрядник отримує лише рядки, де assignee_id = auth.uid(); view run_progress — security_invoker над run_tasks, тож
// і прогрес лише з його задач), тож перевірка — на справжньому Postgres (PGlite) з усіма міграціями, прямим select від
// імені підрядника (asUser), без моків.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-04); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

type TaskRow = { template_task_id: string; name: string; section_name: string; required: boolean; status: string };

const [task1, task2, task3, task4, task5] = TENANT_MOVE_IN.taskIds;

/** Дано: запуск «Apartment 12, move-in» менеджера A з 5 задачами, задачі 3 і 4 — на підряднику V. */
async function runWithVendorTasks(vendorEmail: string) {
  const VENDOR_V = await addUser(t, vendorEmail, "vendor");
  const runId = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });
  const all = await t.asService<{ id: string }>("select id from public.run_tasks where run_id = $1", [runId]);
  expect(all).toHaveLength(5);
  return { VENDOR_V, runId };
}

describe("База: підрядник бачить лише свої задачі запуску", () => {
  it("AC-VENDOR-04: V (виконавець задач 3 і 4 запуску «Apartment 12, move-in» з 5 задачами) читає задачі запуску напряму — рівно задачі 3 і 4 з назвою, секцією, «required»/«optional» і статусом; задач 1, 2 і 5 немає", async () => {
    const { VENDOR_V, runId } = await runWithVendorTasks("vendor.v.ac04@example.test");

    const visible = await t.asUser<TaskRow>(
      VENDOR_V,
      "select template_task_id, name, section_name, required, status from public.run_tasks where run_id = $1 order by section_position, position",
      [runId],
    );

    expect(visible).toEqual([
      { template_task_id: task3, name: "Order cleaning", section_name: "Before move-in", required: false, status: "to_do" },
      { template_task_id: task4, name: "Hand over the keys", section_name: "Move-in day", required: true, status: "to_do" },
    ]);
    const ids = visible.map((x) => x.template_task_id);
    for (const hidden of [task1, task2, task5]) expect(ids).not.toContain(hidden);
  });

  it("AC-VENDOR-04: V без фільтра за запуском теж не отримує задач 1, 2 і 5 — лише рядки, де він виконавець", async () => {
    const { VENDOR_V } = await runWithVendorTasks("vendor.v.ac04-all@example.test");

    const rows = await t.asUser<{ template_task_id: string; assignee_id: string }>(
      VENDOR_V,
      "select template_task_id, assignee_id from public.run_tasks order by section_position, position",
    );

    expect(rows.map((x) => x.template_task_id)).toEqual([task3, task4]);
    expect(rows.every((x) => x.assignee_id === VENDOR_V)).toBe(true);
  });

  it("AC-VENDOR-04: прогресу всього запуску V не отримує — run_progress для V рахує лише його 2 задачі, не 5", async () => {
    const { VENDOR_V, runId } = await runWithVendorTasks("vendor.v.ac04-progress@example.test");

    const progress = await t.asUser<{ run_id: string; done: number; total: number }>(
      VENDOR_V,
      "select run_id, done, total from public.run_progress where run_id = $1",
      [runId],
    );

    expect(progress).toEqual([{ run_id: runId, done: 0, total: 2 }]);
  });

  it("AC-VENDOR-04: email інших користувачів V не отримує — ні з profiles, ні зі списку виконавців; менеджер A і далі бачить усі 5 задач", async () => {
    const vendorEmail = "vendor.v.ac04-emails@example.test";
    const { VENDOR_V, runId } = await runWithVendorTasks(vendorEmail);

    const emails = await t.asUser<{ email: string }>(VENDOR_V, "select email from public.profiles");
    expect(emails).toEqual([{ email: vendorEmail }]);
    expect(await t.asUser(VENDOR_V, "select * from public.list_assignable_users()")).toEqual([]);

    // Обмеження — лише для підрядника: менеджер запуску бачить увесь запуск.
    const ofA = await t.asUser<{ template_task_id: string }>(
      MANAGER_A,
      "select template_task_id from public.run_tasks where run_id = $1 order by section_position, position",
      [runId],
    );
    expect(ofA.map((x) => x.template_task_id)).toEqual([task1, task2, task3, task4, task5]);
    // А V у тому самому запуску — рівно 2 рядки (без email A ні в профілях, ні в задачах інших).
    const ofV = await t.asUser(VENDOR_V, "select id from public.run_tasks where run_id = $1", [runId]);
    expect(ofV).toHaveLength(2);
  });
});
