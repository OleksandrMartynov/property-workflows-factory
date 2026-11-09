// AC-VENDOR-05 — підрядник позначає свою задачу 3, яка НЕ є останньою обов'язковою задачею запуску: позначка без вікна
// підтвердження. Вада (UAT на проді, R1): сторінка підрядника рахувала «останню обов'язкову» лише з його задач (RLS
// ховає решту), тож для задачі 3 вмикала ConfirmDialog «This cannot be undone», хоча задачі 1 і 2 (обов'язкові, «to do»,
// менеджера) ще не виконано. Правило (AC-TASK-04, AC-TASK-16): підтвердження — лише для останньої обов'язкової задачі
// ЗАПУСКУ. Тому id цієї задачі рахує база з усього запуску: public.run_last_required_task(p_run_id uuid) returns uuid
// (обгортка security invoker над private.run_last_required_task, security definer, set search_path = ''; execute — лише
// authenticated). Повертає id єдиної обов'язкової задачі «to do», коли решта обов'язкових задач запуску вже «done», лише
// якщо запуск видно викликачу; підряднику — лише коли ця задача його; інакше null.
// Перевірка — на справжньому Postgres (PGlite) з усіма міграціями, від імені користувачів (asUser), без моків.
//
// Форма шаблону: AC PM (scripts/tenant-move-in-to-ac.mjs) — «Before move-in»: 1 Sign the lease agreement (required),
// 2 Inspect the apartment (required); «Move-in day»: 3 Hand over the keys (required), 4 Record meter readings (optional),
// 5 Order cleaning (optional). Сид зрізу 1 має ті самі задачі з тією самою обов'язковістю, лише «Order cleaning» стоїть
// у першій секції. Набір обов'язкових задач (1, 2, 3) однаковий, а правило рахує лише обов'язковість і статус, тож тут
// задачі взято за template_task_id, а не за позицією, і форму запуску не змінюємо — «Дано» перевірено першим expect.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-05), openspec/specs/run-progress/spec.md (AC-TASK-04, 16);
// план: openspec/changes/impl-vendor/design.md («Підтвердження останньої обов'язкової задачі»).
import { beforeAll, describe, expect, it } from "vitest";
import { formatVendorProgress } from "@/lib/runs/progress";
import { addUser, createTestDb, launch, TENANT_MOVE_IN, type TestDb } from "./supabase-pglite";

let t: TestDb;
let ADMIN: string, MANAGER_A: string, MANAGER_B: string;

beforeAll(async () => {
  t = await createTestDb();
  ADMIN = t.users["admin@example.test"];
  MANAGER_A = t.users["manager.a@example.test"];
  MANAGER_B = t.users["manager.b@example.test"];
}, 60_000);

// Задачі шаблону за назвою (номер — як у формі з AC PM).
const [SIGN_LEASE, INSPECT, ORDER_CLEANING, HAND_OVER_KEYS, METER_READINGS] = TENANT_MOVE_IN.taskIds;

type Task = { id: string; template_task_id: string; required: boolean; status: string; assignee_id: string };

const tasksOf = (runId: string) =>
  t.asService<Task>(
    "select id, template_task_id, required, status, assignee_id from public.run_tasks where run_id = $1 order by section_position, position",
    [runId],
  );

/** id задачі запуску за задачею шаблону. */
const taskId = async (runId: string, templateTaskId: string) =>
  (await tasksOf(runId)).find((x) => x.template_task_id === templateTaskId)!.id;

/** Так сторінка запуску питатиме базу: rpc run_last_required_task від імені користувача. */
const lastRequired = async (userId: string, runId: string) => {
  const [row] = await t.asUser<{ id: string | null }>(userId, "select public.run_last_required_task($1) as id", [runId]);
  return row.id;
};

const complete = (userId: string, id: string, confirmed = false) =>
  t.asUser<{ task_status: string; run_status: string }>(userId, "select * from public.complete_task($1, $2)", [id, confirmed]);

const vendorProgress = async (userId: string, runId: string) => {
  const [row] = await t.asUser<{ done: number; total: number }>(userId, "select done, total from public.run_progress where run_id = $1", [
    runId,
  ]);
  return row;
};

/** «Apartment 12, move-in»: задачі 3 і 4 — на підряднику V, решта — на менеджері A (launch_run від імені A). */
async function apartment12(vendorEmail: string) {
  const VENDOR_V = await addUser(t, vendorEmail, "vendor");
  const runId = await launch(t, MANAGER_A, "Apartment 12, move-in", { [HAND_OVER_KEYS]: VENDOR_V, [METER_READINGS]: VENDOR_V });
  const tasks = await tasksOf(runId);
  const byTemplate = (id: string) => tasks.find((x) => x.template_task_id === id)!;
  // Дано: обов'язкові — 1, 2, 3; 4 і 5 — необов'язкові; 3 і 4 — на V, 1, 2, 5 — на A; усе «to do».
  expect(
    [SIGN_LEASE, INSPECT, HAND_OVER_KEYS, METER_READINGS, ORDER_CLEANING].map((id) => [byTemplate(id).required, byTemplate(id).assignee_id]),
  ).toEqual([
    [true, MANAGER_A],
    [true, MANAGER_A],
    [true, VENDOR_V],
    [false, VENDOR_V],
    [false, MANAGER_A],
  ]);
  expect(tasks.map((x) => x.status)).toEqual(["to_do", "to_do", "to_do", "to_do", "to_do"]);
  return { VENDOR_V, runId, task3: byTemplate(HAND_OVER_KEYS).id };
}

describe("База: остання обов'язкова задача запуску для сторінки підрядника (run_last_required_task)", () => {
  it("AC-VENDOR-05: задачі 1 і 2 (обов'язкові, «to do», менеджера A) не виконано — run_last_required_task від імені V дає null (задача 3 не остання обов'язкова, без підтвердження); V позначає задачу 3 без підтвердження — «done», «Your tasks: 1 of 2 done»", async () => {
    const { VENDOR_V, runId, task3 } = await apartment12("vendor.v.last1@example.test");

    // Сторінка підрядника не вмикає ConfirmDialog для задачі 3: база не називає її останньою обов'язковою.
    expect(await lastRequired(VENDOR_V, runId)).toBeNull();

    expect(await complete(VENDOR_V, task3, false)).toEqual([{ task_status: "done", run_status: "in_progress" }]);
    const after = (await tasksOf(runId)).find((x) => x.id === task3)!;
    expect(after.status).toBe("done");
    const progress = await vendorProgress(VENDOR_V, runId);
    expect(progress).toEqual({ done: 1, total: 2 });
    expect(formatVendorProgress(progress.done, progress.total)).toBe("Your tasks: 1 of 2 done");
  });

  it("AC-VENDOR-05: менеджер A виконав задачі 1 і 2 — run_last_required_task від імені V дає id задачі 3; та сама задача, для якої complete_task вимагає підтвердження", async () => {
    const { VENDOR_V, runId, task3 } = await apartment12("vendor.v.last2@example.test");
    await complete(MANAGER_A, await taskId(runId, SIGN_LEASE));
    await complete(MANAGER_A, await taskId(runId, INSPECT));

    expect(await lastRequired(VENDOR_V, runId)).toBe(task3);

    // Узгоджено із сервером: без підтвердження база відмовляє саме для цієї задачі, з підтвердженням — запуск завершено.
    await expect(complete(VENDOR_V, task3, false)).rejects.toThrow("CONFIRMATION_REQUIRED");
    expect(await complete(VENDOR_V, task3, true)).toEqual([{ task_status: "done", run_status: "completed" }]);
    expect(await lastRequired(VENDOR_V, runId)).toBeNull();
  });

  it("AC-VENDOR-05: остання обов'язкова задача «to do» — задача 2 менеджера A, а не V — run_last_required_task від імені V дає null, від імені A — id задачі 2", async () => {
    const { VENDOR_V, runId, task3 } = await apartment12("vendor.v.last3@example.test");
    // V виконав задачу 3 (ще не остання), A — задачу 1: лишається обов'язкова задача 2, вона на A.
    await complete(VENDOR_V, task3);
    await complete(MANAGER_A, await taskId(runId, SIGN_LEASE));
    const task2 = await taskId(runId, INSPECT);

    expect(await lastRequired(VENDOR_V, runId)).toBeNull();
    expect(await lastRequired(MANAGER_A, runId)).toBe(task2);
  });

  it("AC-VENDOR-05: менеджер запуску A і адміністратор — остання обов'язкова рахується з усього запуску: null, доки «to do» більше однієї обов'язкової; id задачі 3 (задача V), коли 1 і 2 виконано; null, коли обов'язкових «to do» немає", async () => {
    const { VENDOR_V, runId, task3 } = await apartment12("vendor.v.last4@example.test");

    expect(await lastRequired(MANAGER_A, runId)).toBeNull();
    expect(await lastRequired(ADMIN, runId)).toBeNull();

    await complete(MANAGER_A, await taskId(runId, SIGN_LEASE));
    expect(await lastRequired(MANAGER_A, runId)).toBeNull();

    await complete(MANAGER_A, await taskId(runId, INSPECT));
    expect(await lastRequired(MANAGER_A, runId)).toBe(task3);
    expect(await lastRequired(ADMIN, runId)).toBe(task3);

    await complete(VENDOR_V, task3, true);
    expect(await lastRequired(MANAGER_A, runId)).toBeNull();
    expect(await lastRequired(ADMIN, runId)).toBeNull();
  });

  it("AC-VENDOR-05: чужий запуск — null для підрядника W без задач у ньому, для менеджера B, якому запуск не видно, і для неіснуючого id; без входу (anon) — permission denied", async () => {
    const { runId, task3 } = await apartment12("vendor.v.last5@example.test");
    const VENDOR_W = await addUser(t, "vendor.w.last5@example.test", "vendor");
    await complete(MANAGER_A, await taskId(runId, SIGN_LEASE));
    await complete(MANAGER_A, await taskId(runId, INSPECT));
    // Контроль: остання обов'язкова задача є, і менеджер запуску її бачить.
    expect(await lastRequired(MANAGER_A, runId)).toBe(task3);

    expect(await lastRequired(VENDOR_W, runId)).toBeNull();
    expect(await lastRequired(MANAGER_B, runId)).toBeNull();
    expect(await lastRequired(MANAGER_A, "00000000-0000-0000-0000-00000000dead")).toBeNull();
    await expect(t.asAnon("select public.run_last_required_task($1)", [runId])).rejects.toThrow("permission denied");
  });
});
