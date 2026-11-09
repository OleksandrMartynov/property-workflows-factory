import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Запуски підрядника (AC-VENDOR-03, AC-VENDOR-10): лише з public.vendor_runs, таблиці runs і run_progress не читаються. */
export async function loadVendorRuns(supabase: Supabase) {
  const { data, error } = await supabase.rpc("vendor_runs", { p_run_id: null });
  if (error) throw error;
  return data ?? [];
}
