import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requiredLabel, taskStatusLabel } from "@/lib/runs/labels";
import { countProgress, formatVendorProgress } from "@/lib/runs/progress";
import { groupBySection } from "@/lib/runs/sections";
import { MarkDoneForm } from "../mark-done-form";

export interface VendorRunInfo {
  id: string;
  case_name: string;
  status: string;
}

export interface VendorTaskRow {
  id: string;
  name: string;
  section_name: string;
  section_position: number;
  position: number;
  required: boolean;
  status: string;
}

/**
 * Тіло сторінки запуску для підрядника (AC-VENDOR-04, AC-VENDOR-05): лише його задачі за секціями й «Your tasks: N of K
 * done». Без email, «Details», менеджера запуску, шаблону й прогресу всього запуску. Рядки фільтрує RLS, тут лише вигляд.
 */
export function VendorRunDetail({
  run,
  tasks,
  lastRequiredTaskId,
  completeTask,
}: {
  run: VendorRunInfo;
  tasks: VendorTaskRow[];
  lastRequiredTaskId: string | null;
  completeTask: (formData: FormData) => Promise<void>;
}) {
  const sections = groupBySection(tasks);
  const { done, total } = countProgress(tasks);

  return (
    <div className="flex flex-col gap-6">
      <p className="tabular text-heading">{formatVendorProgress(done, total)}</p>
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2" aria-labelledby={`s-${section.key}`}>
          <h2 id={`s-${section.key}`} className="px-1 text-heading">
            {section.name}
          </h2>
          <Card>
            <ul className="flex flex-col divide-y divide-border">
              {section.tasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
                    data-testid="run-task"
                  >
                    <span className={isDone ? "min-w-0 flex-1 text-muted-foreground" : "min-w-0 flex-1"}>
                      {task.name}
                      <Badge variant="outline" className="ml-2 align-middle" data-testid="task-required">
                        {requiredLabel(task.required)}
                      </Badge>
                    </span>
                    <StatusBadge status={isDone ? "done" : "todo"}>{taskStatusLabel(task.status)}</StatusBadge>
                    {task.status === "to_do" ? (
                      <MarkDoneForm
                        action={completeTask}
                        runId={run.id}
                        taskId={task.id}
                        taskName={task.name}
                        needsConfirmation={task.id === lastRequiredTaskId}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
