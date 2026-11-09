// AC-VENDOR-04: сторінка запуску показує підряднику лише його задачі — гілку підрядника вмикає роль з profiles.
// Контракт (openspec/changes/impl-vendor/design.md, «Роль у застосунку»): AppRole має "vendor", хелпер isVendor(role).
// Тест додано після прогону фабрики run-20261109173709-7b2fe3: ворота mutation показали, що «===» → «!==» в isVendor
// не ловить жоден видимий тест — роль, що вмикає сторінку підрядника, нічим не закріплена.
import { describe, expect, it } from "vitest";
import { isVendor } from "@/lib/supabase/viewer";

describe("Роль підрядника в застосунку", () => {
  it("AC-VENDOR-04: isVendor — так лише для ролі vendor, менеджер і адміністратор бачать запуск як раніше", () => {
    expect(isVendor("vendor")).toBe(true);
    expect(isVendor("manager")).toBe(false);
    expect(isVendor("admin")).toBe(false);
  });
});
