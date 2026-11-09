// Сторінка запуску підрядника (зріз 3): компонент VendorRunDetail — лише задачі підрядника групами за секціями (назва,
// «required» / «optional», статус), «Your tasks: N of K done»; без email, панелі «Details», прогресу всього запуску,
// шаблону й версії. Які рядки run_tasks підрядник отримує — правило бази: tests/db/vendor-own-tasks-db.test.ts.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-04, AC-VENDOR-05); план: openspec/changes/impl-vendor/design.md.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VendorRunDetail } from "@/app/(app)/runs/[id]/_components/vendor-run-detail";
import { formatVendorProgress } from "@/lib/runs/progress";

const run = { id: "run-12", case_name: "Apartment 12, move-in", status: "in_progress" };

const vendorTask = (
  id: string,
  name: string,
  section_name: string,
  section_position: number,
  position: number,
  required: boolean,
  status: string,
) => ({ id, name, section_name, section_position, position, required, status });

/** Рядки run_tasks, які база віддає підряднику V у «Apartment 12, move-in»: задачі 3 і 4 (з 5). */
const vendorTasks = (task3Status = "to_do", task4Status = "to_do") => [
  vendorTask("t3", "Order cleaning", "Before move-in", 1, 3, false, task3Status),
  vendorTask("t4", "Hand over the keys", "Move-in day", 2, 1, true, task4Status),
];

const render = (tasks: ReturnType<typeof vendorTasks>) =>
  renderToStaticMarkup(<VendorRunDetail run={run} tasks={tasks} lastRequiredTaskId={null} completeTask={async () => {}} />);

/** Видимий текст розмітки: без тегів, пробіли згорнуто. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** Рядки задач — елементи з data-testid="run-task" (як на сторінці запуску менеджера). */
const taskRows = (html: string) => html.split('data-testid="run-task"').slice(1).map(text);

describe("Сторінка запуску підрядника", () => {
  it("AC-VENDOR-04: V відкриває «Apartment 12, move-in» — рівно задачі 3 і 4, кожна з назвою, секцією, «required»/«optional» і статусом", () => {
    const html = render(vendorTasks());
    const rows = taskRows(html);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Order cleaning");
    expect(rows[0]).toContain("optional");
    expect(rows[0]).toContain("to do");
    expect(rows[1]).toContain("Hand over the keys");
    expect(rows[1]).toContain("required");
    expect(rows[1]).toContain("to do");

    // Секція кожної задачі — заголовок групи перед її задачею: «Before move-in» → задача 3, «Move-in day» → задача 4.
    const page = text(html);
    const at = (s: string) => page.indexOf(s);
    expect(at("Before move-in")).toBeGreaterThanOrEqual(0);
    expect(at("Before move-in")).toBeLessThan(at("Order cleaning"));
    expect(at("Order cleaning")).toBeLessThan(at("Move-in day"));
    expect(at("Move-in day")).toBeLessThan(at("Hand over the keys"));
  });

  it("AC-VENDOR-04: на сторінці V немає email інших користувачів, панелі «Details», шаблону й версії та прогресу всього запуску «N of M done»", () => {
    const html = render(vendorTasks());
    const page = text(html);

    expect(html).not.toContain("@");
    for (const hidden of ["Details", "Run manager", "Assignees", "Template", "Version"]) expect(page).not.toContain(hidden);
    expect(html).not.toContain('data-testid="run-progress"');
    // Єдиний запис прогресу — «Your tasks: N of K done»; без нього жодного «N of M done» не лишається.
    expect(page).toContain("Your tasks: 0 of 2 done");
    expect(page.replace(/Your tasks: \d+ of \d+ done/g, "")).not.toMatch(/\d+ of \d+ done/);
  });

  it("AC-VENDOR-05: задача 3 V «to do» — у її рядку є «Mark as done»", () => {
    const rows = taskRows(render(vendorTasks()));
    expect(rows[0]).toContain("Order cleaning");
    expect(rows[0]).toContain("Mark as done");
  });

  it("AC-VENDOR-05: після позначки задача 3 має статус «done», і V бачить «Your tasks: 1 of 2 done»", () => {
    const html = render(vendorTasks("done", "to_do"));
    const rows = taskRows(html);

    expect(text(html)).toContain("Your tasks: 1 of 2 done");
    const task3 = rows[0].replace("Mark as done", "");
    expect(task3).toContain("Order cleaning");
    expect(task3).toMatch(/\bdone\b/);
    expect(task3).not.toContain("to do");
    expect(rows[1]).toContain("Hand over the keys");
    expect(rows[1]).toContain("to do");
  });

  it("AC-VENDOR-05: formatVendorProgress(1, 2) — «Your tasks: 1 of 2 done»", () => {
    expect(formatVendorProgress(1, 2)).toBe("Your tasks: 1 of 2 done");
    expect(formatVendorProgress(0, 2)).toBe("Your tasks: 0 of 2 done");
  });
});
