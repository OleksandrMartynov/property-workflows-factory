// AC-VENDOR-05 — звідки сторінка запуску підрядника бере id останньої обов'язкової задачі (вмикає ConfirmDialog «This
// cannot be undone»). Підрядник бачить лише свої задачі (RLS), тож рахувати «останню обов'язкову» з них не можна: для
// задачі 3 сторінка вважала її останньою, хоча задачі 1 і 2 менеджера ще «to do» (вада UAT R1). Тому сторінка бере id з
// бази: loadLastRequiredTaskId(supabase, runId) з src/app/(app)/runs/[id]/_lib/vendor-run.ts робить рівно
// rpc("run_last_required_task", { p_run_id: runId }) і повертає рядок id або null; помилка rpc — кидає її.
// Клієнт Supabase — параметром, тож тут власноруч написаний фейк (не vi.mock): записує виклики й віддає заготовлену
// відповідь. Що саме рахує база — tests/db/vendor-last-required-db.test.ts.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-05); план: openspec/changes/impl-vendor/design.md.
import { describe, expect, it } from "vitest";
import { loadLastRequiredTaskId } from "@/app/(app)/runs/[id]/_lib/vendor-run";

type Call = { method: string; args: unknown[] };
type Reply = { data: unknown; error: Error | null };
type Client = Parameters<typeof loadLastRequiredTaskId>[0];

/** Помилка як у supabase-js: PostgrestError — підклас Error з code, details, hint. */
const postgrestError = (message: string) => Object.assign(new Error(message), { code: "XX000", details: "", hint: "" });

/**
 * Фейковий клієнт: rpc(name, args) повертає заготовлену відповідь для цієї функції (як PostgrestBuilder, який можна
 * дочекатися); будь-яка інша функція чи таблиця — помилка, тож зайвий запит видно в тесті.
 */
function fakeSupabase(replies: Record<string, Reply>) {
  const calls: Call[] = [];
  const client = {
    rpc: (name: string, args?: unknown) => {
      calls.push({ method: "rpc", args: args === undefined ? [name] : [name, args] });
      return Promise.resolve(replies[name] ?? { data: null, error: postgrestError(`unexpected rpc ${name}`) });
    },
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      throw postgrestError(`unexpected table ${table}`);
    },
  };
  return { client: client as unknown as Client, calls };
}

describe("Сторінка запуску підрядника: loadLastRequiredTaskId", () => {
  it("AC-VENDOR-05: задача 3 не остання обов'язкова — rpc run_last_required_task(p_run_id = id) дає null, loadLastRequiredTaskId повертає null (ConfirmDialog не вмикається); інших запитів немає", async () => {
    const { client, calls } = fakeSupabase({ run_last_required_task: { data: null, error: null } });

    const result = await loadLastRequiredTaskId(client, "run-12");

    expect(result).toBeNull();
    expect(calls).toEqual([{ method: "rpc", args: ["run_last_required_task", { p_run_id: "run-12" }] }]);
  });

  it("AC-VENDOR-05: остання обов'язкова задача запуску — задача V — rpc дає її id, loadLastRequiredTaskId повертає цей рядок", async () => {
    const { client, calls } = fakeSupabase({ run_last_required_task: { data: "task-3", error: null } });

    const result = await loadLastRequiredTaskId(client, "run-12");

    expect(result).toBe("task-3");
    expect(calls).toEqual([{ method: "rpc", args: ["run_last_required_task", { p_run_id: "run-12" }] }]);
  });

  it("AC-VENDOR-05: помилка rpc run_last_required_task — loadLastRequiredTaskId кидає помилку з її повідомленням", async () => {
    const { client } = fakeSupabase({ run_last_required_task: { data: null, error: postgrestError("run_last_required_task failed") } });

    await expect(loadLastRequiredTaskId(client, "run-12")).rejects.toThrow("run_last_required_task failed");
  });
});
