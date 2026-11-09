// AC-VENDOR-01 — менеджер призначає підрядника виконавцем задач під час запуску. Правило живе в SQL
// (private.launch_run: виконавцем можна призначити manager, admin або vendor), тож перевірка — на справжньому
// Postgres (PGlite) з усіма міграціями, від імені менеджера (asUser), без моків rpc.
// Специфікація: openspec/specs/run-launch/spec.md (AC-VENDOR-01); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

type TaskRow = { template_task_id: string; assignee_id: string };

const tasksOf = (userId: string, runId: string) =>
  t.asUser<TaskRow>(
    userId,
    "select template_task_id, assignee_id from public.run_tasks where run_id = $1 order by section_position, position",
    [runId],
  );

describe("База: підрядник — виконавець задач запуску", () => {
  it("AC-VENDOR-01: A запускає «Tenant move-in» для «Apartment 12, move-in» і призначає V задачі 3 і 4 — задачі 3 і 4 на V, задачі 1, 2 і 5 на A", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac01@example.test", "vendor");
    const [task1, task2, task3, task4, task5] = TENANT_MOVE_IN.taskIds;

    const runId = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });

    const assigneeOf = Object.fromEntries((await tasksOf(MANAGER_A, runId)).map((x) => [x.template_task_id, x.assignee_id]));
    expect(assigneeOf).toEqual({
      [task1]: MANAGER_A,
      [task2]: MANAGER_A,
      [task3]: VENDOR_V,
      [task4]: VENDOR_V,
      [task5]: MANAGER_A,
    });
  });
});
