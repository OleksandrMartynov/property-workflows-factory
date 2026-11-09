import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { NO_VENDOR_TASKS, runStatusLabel, runStatusTone } from "@/lib/runs/labels";
import { formatVendorProgress } from "@/lib/runs/progress";

export interface VendorRunRow {
  id: string;
  case_name: string;
  status: string;
  created_at: string;
  done: number;
  total: number;
}

/** Список запусків підрядника (AC-VENDOR-03, AC-VENDOR-10): назва, статус запуску й «Your tasks: N of K done». */
export function VendorRunsList({ runs }: { runs: VendorRunRow[] }) {
  if (!runs.length) return <EmptyState title={NO_VENDOR_TASKS} />;

  return (
    <Card>
      <ul className="flex flex-col divide-y divide-border">
        {runs.map((run) => (
          <li key={run.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5" data-testid="run-row">
            <Link href={`/runs/${run.id}`} className="min-w-0 flex-1 text-heading hover:underline">
              {run.case_name}
            </Link>
            <StatusBadge status={runStatusTone(run.status)}>{runStatusLabel(run.status)}</StatusBadge>
            <span className="tabular text-muted-foreground">{formatVendorProgress(run.done, run.total)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
