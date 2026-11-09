// Звідки сторінки підрядника беруть дані (зріз 3): runs_select_visible підрядника не пускає (рядок runs містить назву
// шаблону й версію, а RLS не ховає колонок), тож і список /runs, і сторінка /runs/[id] беруть запуски підрядника з
// public.vendor_runs(p_run_id), а не з runs чи run_progress. Завантажувачі отримують клієнт Supabase параметром, тож тут
// їм передано власноруч написаний фейк (не vi.mock): він записує виклики (метод, аргументи) і віддає заготовлені
// відповіді. Що саме база віддає підряднику — tests/db/vendor-runs-db.test.ts, tests/db/vendor-run-not-found-db.test.ts.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-03, 04, 06, 10); план: openspec/changes/impl-vendor/design.md.
import { describe, expect, it } from "vitest";
import { loadVendorRuns } from "@/app/(app)/runs/_lib/vendor-runs";
import { loadVendorRun } from "@/app/(app)/runs/[id]/_lib/vendor-run";

type Call = { method: string; args: unknown[] };
type Reply = { data: unknown; error: Error | null };

/** Помилка як у supabase-js: PostgrestError — підклас Error з code, details, hint. */
const postgrestError = (message: string) => Object.assign(new Error(message), { code: "XX000", details: "", hint: "" });

/**
 * Фейковий клієнт Supabase: rpc(name, args) і from(table) повертають ланцюжок запиту (select, eq, order, in, limit,
 * maybeSingle, single, …), який можна дочекатися (await) — як PostgrestBuilder у supabase-js. Кожен виклик записано
 * в calls; відповідь — заготовлена для rpc за назвою функції, для from — за назвою таблиці.
 */
function fakeSupabase(replies: { rpc?: Record<string, Reply>; from?: Record<string, Reply> }) {
  const calls: Call[] = [];
  const builder = (reply: Reply) => {
    let mode: "many" | "maybeSingle" | "single" = "many";
    const resolve = () => {
      if (reply.error || mode === "many") return reply;
      const rows = (reply.data ?? []) as unknown[];
      return { data: rows[0] ?? null, error: null };
    };
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "neq", "in", "is", "order", "limit", "range", "filter", "match"]) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args });
        return chain;
      };
    }
    chain.maybeSingle = () => {
      calls.push({ method: "maybeSingle", args: [] });
      mode = "maybeSingle";
      return chain;
    };
    chain.single = () => {
      calls.push({ method: "single", args: [] });
      mode = "single";
      return chain;
    };
    chain.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected);
    return chain;
  };
  const client = {
    rpc: (name: string, args?: unknown) => {
      calls.push({ method: "rpc", args: args === undefined ? [name] : [name, args] });
      return builder(replies.rpc?.[name] ?? { data: null, error: postgrestError(`unexpected rpc ${name}`) });
    },
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return builder(replies.from?.[table] ?? { data: null, error: postgrestError(`unexpected table ${table}`) });
    },
  };
  return { client, calls };
}

const tablesRead = (calls: Call[]) => calls.filter((c) => c.method === "from").map((c) => c.args[0]);
const rpcCalls = (calls: Call[]) => calls.filter((c) => c.method === "rpc").map((c) => c.args);

/** Рядок public.vendor_runs (колонки — tests/db/vendor-runs-db.test.ts). */
const apartment12 = {
  id: "run-12",
  case_name: "Apartment 12, move-in",
  status: "in_progress",
  created_at: "2026-11-09T10:00:00+00:00",
  done: 0,
  total: 2,
};

/** Рядки run_tasks, які RLS віддає підряднику V у «Apartment 12, move-in»: задачі 3 і 4 (з 5). */
const ownTasks = [
  { id: "t3", name: "Order cleaning", section_name: "Before move-in", section_position: 1, position: 3, required: false, status: "to_do" },
  { id: "t4", name: "Hand over the keys", section_name: "Move-in day", section_position: 2, position: 1, required: true, status: "to_do" },
];

/** Колонки run_tasks, які потрібні VendorRunDetail (VendorTaskRow). */
const VENDOR_TASK_COLUMNS = ["id", "name", "section_name", "section_position", "position", "required", "status"];

describe("Список запусків підрядника: loadVendorRuns", () => {
  it("AC-VENDOR-03: список V — rpc vendor_runs з p_run_id = null, рядки як є («Apartment 12, move-in», 0 of 2); runs і run_progress не читаються", async () => {
    const { client, calls } = fakeSupabase({ rpc: { vendor_runs: { data: [apartment12], error: null } } });

    const runs = await loadVendorRuns(client as unknown as Parameters<typeof loadVendorRuns>[0]);

    expect(runs).toEqual([apartment12]);
    expect(rpcCalls(calls)).toEqual([["vendor_runs", { p_run_id: null }]]);
    expect(tablesRead(calls)).not.toContain("runs");
    expect(tablesRead(calls)).not.toContain("run_progress");
  });

  it("AC-VENDOR-03: помилка rpc vendor_runs — loadVendorRuns кидає помилку з її повідомленням", async () => {
    const { client } = fakeSupabase({ rpc: { vendor_runs: { data: null, error: postgrestError("vendor_runs failed") } } });

    await expect(loadVendorRuns(client as unknown as Parameters<typeof loadVendorRuns>[0])).rejects.toThrow("vendor_runs failed");
  });

  it("AC-VENDOR-10: V без задач — rpc vendor_runs дає 0 рядків, loadVendorRuns повертає []", async () => {
    const { client, calls } = fakeSupabase({ rpc: { vendor_runs: { data: [], error: null } } });

    const runs = await loadVendorRuns(client as unknown as Parameters<typeof loadVendorRuns>[0]);

    expect(runs).toEqual([]);
    expect(rpcCalls(calls)).toEqual([["vendor_runs", { p_run_id: null }]]);
    expect(tablesRead(calls)).not.toContain("runs");
  });
});

describe("Сторінка запуску підрядника: loadVendorRun", () => {
  it("AC-VENDOR-06: свій запуск — рядок з rpc vendor_runs(p_run_id = id), задачі з run_tasks цього запуску з колонками VendorRunDetail; runs не читається", async () => {
    const { client, calls } = fakeSupabase({
      rpc: { vendor_runs: { data: [apartment12], error: null } },
      from: { run_tasks: { data: ownTasks, error: null } },
    });

    const result = await loadVendorRun(client as unknown as Parameters<typeof loadVendorRun>[0], "run-12");

    expect(result).toEqual({ run: { id: "run-12", case_name: "Apartment 12, move-in", status: "in_progress" }, tasks: ownTasks });
    expect(rpcCalls(calls)).toEqual([["vendor_runs", { p_run_id: "run-12" }]]);
    expect(tablesRead(calls)).toEqual(["run_tasks"]);
    expect(calls).toContainEqual({ method: "eq", args: ["run_id", "run-12"] });
    const selected = calls.filter((c) => c.method === "select").flatMap((c) => String(c.args[0]).split(",").map((s) => s.trim()));
    expect(selected).toEqual(expect.arrayContaining(VENDOR_TASK_COLUMNS));
  });

  it("AC-VENDOR-06: чужий запуск — rpc vendor_runs(p_run_id = id) дає 0 рядків, loadVendorRun повертає null (сторінка — notFound і «Run not found»); runs не читається", async () => {
    const { client, calls } = fakeSupabase({
      rpc: { vendor_runs: { data: [], error: null } },
      from: { run_tasks: { data: [], error: null } },
    });

    const result = await loadVendorRun(client as unknown as Parameters<typeof loadVendorRun>[0], "run-14");

    expect(result).toBeNull();
    expect(rpcCalls(calls)).toEqual([["vendor_runs", { p_run_id: "run-14" }]]);
    expect(tablesRead(calls)).not.toContain("runs");
  });
});
