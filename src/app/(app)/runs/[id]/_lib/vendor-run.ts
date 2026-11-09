import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Запуск підрядника (AC-VENDOR-04, AC-VENDOR-06): рядок запуску з public.vendor_runs (таблиця runs не читається), задачі —
 * з run_tasks (RLS віддає лише його). Запуск без його задач — null.
 */
export async function loadVendorRun(supabase: Supabase, runId: string) {
  const { data: rows, error } = await supabase.rpc("vendor_runs", { p_run_id: runId });
  if (error) throw error;
  const row = rows?.[0];
  if (!row) return null;

  const { data: tasks, error: tasksError } = await supabase
    .from("run_tasks")
    .select("id, name, section_name, section_position, position, required, status")
    .eq("run_id", runId)
    .order("section_position")
    .order("position");
  if (tasksError) throw tasksError;

  return { run: { id: row.id, case_name: row.case_name, status: row.status }, tasks: tasks ?? [] };
}
