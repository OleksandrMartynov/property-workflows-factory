// AC-VENDOR-05 — підрядник позначає свою задачу виконаною. Правило живе в SQL (private.complete_task: роль vendor
// допущено лише до задачі, де він виконавець; run_progress для підрядника рахує лише його задачі), тож перевірка — на
// справжньому Postgres (PGlite) з усіма міграціями, rpc public.complete_task від імені підрядника (asUser), без моків.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-05); план: openspec/changes/impl-vendor/design.md.
import { beforeAll, describe, expect, it } from "vitest";
import { formatVendorProgress } from "@/lib/runs/progress";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let MANAGER_A: string;

beforeAll(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

type Task = { id: string; template_task_id: string; required: boolean; status: string; done_by: string | null };

const [, , task3, task4] = TENANT_MOVE_IN.taskIds;

const tasksOf = (runId: string) =>
  t.asService<Task>(
    "select id, template_task_id, required, status, done_by from public.run_tasks where run_id = $1 order by section_position, position",
    [runId],
  );
const complete = (userId: string, taskId: string) =>
  t.asUser<{ task_status: string; run_status: string }>(userId, "select * from public.complete_task($1, $2)", [taskId, false]);
const vendorProgress = (userId: string, runId: string) =>
  t.asUser<{ done: number; total: number }>(userId, "select done, total from public.run_progress where run_id = $1", [runId]);

describe("База: підрядник позначає свою задачу виконаною", () => {
  it("AC-VENDOR-05: V позначає свою задачу 3 «to do» (не остання обов'язкова) у «Apartment 12, move-in» — задача 3 «done», V бачить «Your tasks: 1 of 2 done»", async () => {
    const VENDOR_V = await addUser(t, "vendor.v.ac05@example.test", "vendor");
    const runId = await launch(t, MANAGER_A, "Apartment 12, move-in", { [task3]: VENDOR_V, [task4]: VENDOR_V });
    const before = await tasksOf(runId);
    const third = before.find((x) => x.template_task_id === task3)!;
    // Дано: задача 3 «to do» і не остання обов'язкова — у запуску лишаються інші обов'язкові задачі «to do».
    expect(third.status).toBe("to_do");
    expect(before.filter((x) => x.required && x.status === "to_do" && x.id !== third.id).length).toBeGreaterThan(0);

    expect(await complete(VENDOR_V, third.id)).toEqual([{ task_status: "done", run_status: "in_progress" }]);

    const after = await tasksOf(runId);
    const thirdAfter = after.find((x) => x.id === third.id)!;
    expect(thirdAfter.status).toBe("done");
    expect(thirdAfter.done_by).toBe(VENDOR_V);
    // Решта задач не змінились.
    expect(after.filter((x) => x.id !== third.id).map((x) => x.status)).toEqual(["to_do", "to_do", "to_do", "to_do"]);

    const [progress] = await vendorProgress(VENDOR_V, runId);
    expect(progress).toEqual({ done: 1, total: 2 });
    expect(formatVendorProgress(progress.done, progress.total)).toBe("Your tasks: 1 of 2 done");
  });
});
