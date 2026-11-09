// Прогрес запуску (глосарій PM, «Progress»): «N of M done», де N — задачі зі статусом «done»,
// а M — усі задачі запуску, обов'язкові чи ні (AC-TASK-05, AC-TASK-08, AC-TASK-09).
// У списку запусків done і total рахує база (view run_progress), тут — лише формат і підрахунок для сторінки запуску.

export interface TaskLike {
  status: string;
}

export function countProgress(tasks: readonly TaskLike[]) {
  return { done: tasks.filter((t) => t.status === "done").length, total: tasks.length };
}

/** AC-VENDOR-05: прогрес підрядника — лише його задачі. */
export const formatVendorProgress = (done: number, total: number) => `Your tasks: ${done} of ${total} done`;

export const formatProgress =({ done, total }: { done: number; total: number }) => `${done} of ${total} done`;
