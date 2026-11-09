// Список запусків підрядника (зріз 3): /runs для vendor — компонент VendorRunsList над рядками public.vendor_runs:
// назва випадку (посилання на запуск), статус запуску (StatusBadge) і «Your tasks: N of K done»; без менеджера, назви
// шаблону, наступної задачі й email. Порожній стан — EmptyState «No tasks assigned to you yet.» без таблиці й без
// «Launch a template». Які запуски підрядник отримує — правило бази: tests/db/vendor-runs-db.test.ts,
// tests/db/vendor-no-tasks-db.test.ts.
// Специфікація: openspec/specs/vendor-access/spec.md (AC-VENDOR-03, AC-VENDOR-10); план: openspec/changes/impl-vendor/design.md.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VendorRunsList } from "@/app/(app)/runs/_components/vendor-runs-list";
import { NO_VENDOR_TASKS } from "@/lib/runs/labels";

/** Рядок public.vendor_runs, як його віддає база підряднику V (див. tests/db/vendor-runs-db.test.ts). */
const apartment12 = {
  id: "run-12",
  case_name: "Apartment 12, move-in",
  status: "in_progress",
  created_at: "2026-11-09T10:00:00+00:00",
  done: 0,
  total: 2,
};

/** Видимий текст розмітки: без тегів, пробіли згорнуто. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

describe("Список запусків підрядника", () => {
  it("AC-VENDOR-03: V бачить лише «Apartment 12, move-in» — посилання на запуск, статус запуску «in progress» і «Your tasks: 0 of 2 done»; «Apartment 14, repair» немає", () => {
    const html = renderToStaticMarkup(<VendorRunsList runs={[apartment12]} />);
    const page = text(html);

    expect(page).toContain("Apartment 12, move-in");
    expect(html).toContain('href="/runs/run-12"');
    expect(html.match(/href="\/runs\/[^"]+"/g)).toEqual(['href="/runs/run-12"']);
    // Статус запуску — StatusBadge (значок + слово), не лише колір.
    expect(page).toContain("in progress");
    expect(html).toContain("bg-status-progress");
    expect(page).toContain("Your tasks: 0 of 2 done");
    expect(page).not.toContain("Apartment 14, repair");
  });

  it("AC-VENDOR-03: у списку V немає менеджера запуску, назви шаблону, наступної задачі, email і прогресу всього запуску «N of M done»", () => {
    const html = renderToStaticMarkup(<VendorRunsList runs={[apartment12]} />);
    const page = text(html);

    expect(html).not.toContain("@");
    for (const hidden of ["Run manager", "Template", "Tenant move-in", "Next task", "Assignees"]) expect(page).not.toContain(hidden);
    expect(html).not.toContain('data-testid="run-progress"');
    expect(page.replace(/Your tasks: \d+ of \d+ done/g, "")).not.toMatch(/\d+ of \d+ done/);
  });

  it("AC-VENDOR-03: завершений запуск V — статус «completed» і «Your tasks: 2 of 2 done»", () => {
    const html = renderToStaticMarkup(<VendorRunsList runs={[{ ...apartment12, status: "completed", done: 2 }]} />);
    const page = text(html);

    expect(page).toContain("completed");
    expect(html).toContain("bg-status-done");
    expect(page).toContain("Your tasks: 2 of 2 done");
  });

  it("AC-VENDOR-10: V без задач — повідомлення «No tasks assigned to you yet.», без порожньої таблиці й без «Launch a template»", () => {
    const html = renderToStaticMarkup(<VendorRunsList runs={[]} />);
    const page = text(html);

    expect(NO_VENDOR_TASKS).toBe("No tasks assigned to you yet.");
    expect(page).toContain("No tasks assigned to you yet.");
    expect(html).not.toContain("<table");
    expect(page).not.toContain("Launch a template");
    expect(page).not.toContain("No runs yet.");
    expect(html).not.toContain('href="/templates"');
  });
});
