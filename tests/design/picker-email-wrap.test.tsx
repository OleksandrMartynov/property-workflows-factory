// Вибір виконавця у формі запуску (AC-VENDOR-02): email у варіанті списку видно повністю — без трикрапки, довге слово
// без пробілів переноситься. Правило дизайн-системи: DESIGN.md, «Відгук на дію й видимість тексту» і Do / Don't
// («truncate для email — ніколи»; «довге слово без пробілів — wrap-anywhere»).
// Рядок варіанта малює OptionRow (src/components/ui/listbox-parts.tsx) усередині ListboxSurface — та сама поверхня,
// яку Combobox показує у відкритому Popover. Popover без DOM не відкрити, тож рендеримо ListboxSurface напряму з
// варіантами, зібраними toItem так само, як personOptions у src/app/(app)/templates/[id]/launch/_components/launch-form.tsx
// (label і avatar — email, trailing «run manager» — у самого A).
// Специфікація: openspec/specs/run-launch/spec.md (AC-VENDOR-02).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListboxSurface, toItem, type PickerOption } from "@/components/ui/listbox-parts";

const A = "uat-261109190437-p1@example.test";
const B = "uat-261109190437-p2@example.test";
// Довше за будь-яку ширину списку і без жодного пробілу: його можна показати повністю лише переносом посеред «слова».
const V = "uat-261109190437-p4-synthetic-vendor-address-without-any-spaces-0123456789@subdomain.example.test";
const DESCRIPTION = "uat-261109190437-p3-synthetic-description-without-any-spaces-0123456789@example.test";

const options: PickerOption[] = [
  { value: "a", label: A, avatar: A, trailing: <span className="text-meta text-muted-foreground">run manager</span> },
  { value: "b", label: B, avatar: B },
  { value: "v", label: V, avatar: V },
  { value: "admin", label: "uat-261109190437-p3@example.test", avatar: "uat-261109190437-p3@example.test", description: DESCRIPTION },
];

const render = () =>
  renderToStaticMarkup(
    <ListboxSurface
      listId="assignees"
      items={options.map(toItem)}
      activeIndex={0}
      isSelected={(value) => value === "a"}
      optionId={(index) => `assignees-${index}`}
      onHover={() => {}}
      onPick={() => {}}
      aria-label="Assignee of Sign the lease agreement"
    />,
  );

/** Розмітка одного варіанта (`role="option"`) з даним id: від його тегу до тегу наступного варіанта. */
const optionMarkup = (html: string, id: string) => {
  const tags = [...html.matchAll(/<div[^>]*\srole="option"[^>]*>/g)];
  const at = tags.findIndex((t) => t[0].includes(` id="${id}"`));
  expect(at, `варіант ${id} є в розмітці`).toBeGreaterThanOrEqual(0);
  return html.slice(tags[at].index, tags[at + 1]?.index ?? html.length);
};

const VOID = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

/**
 * Класи елемента, що безпосередньо містить текст `needle`, і всіх його предків у межах розмітки варіанта
 * (від найближчого до найдальшого). `undefined` — такого текстового вузла немає (текст розірвано чи обрізано).
 */
function classChainOf(markup: string, needle: string): string[][] | undefined {
  const stack: { tag: string; classes: string[] }[] = [];
  for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g)) {
    const [, closing, tag, attrs, selfClosing, text] = m;
    if (text !== undefined) {
      if (decode(text) === needle) return stack.map((el) => el.classes).reverse();
      continue;
    }
    if (closing) {
      const at = stack.map((el) => el.tag).lastIndexOf(tag);
      if (at >= 0) stack.length = at;
      continue;
    }
    if (selfClosing || VOID.has(tag.toLowerCase())) continue;
    const cls = /\sclass="([^"]*)"/.exec(attrs)?.[1] ?? "";
    stack.push({ tag, classes: cls.split(/\s+/).filter(Boolean) });
  }
  return undefined;
}

const CLIPPING = /^(truncate|text-ellipsis|text-clip|line-clamp-\d+)$/;
const WRAPPING = /^(wrap-anywhere|break-words)$/;

/** Текст показано повністю: ні сам елемент, ні предки не обрізають його, а найближчий має перенос довгого слова. */
function expectShownInFull(markup: string, needle: string) {
  const chain = classChainOf(markup, needle);
  expect(chain, `текст «${needle}» є в розмітці варіанта одним текстовим вузлом`).toBeDefined();
  const own = chain![0];
  const all = chain!.flat();
  expect(all.filter((c) => CLIPPING.test(c)), `«${needle}»: класи обрізання на підписі чи предках`).toEqual([]);
  expect(own.includes("overflow-hidden") && own.includes("whitespace-nowrap"), `«${needle}»: overflow-hidden + whitespace-nowrap`).toBe(false);
  expect(own.some((c) => WRAPPING.test(c)), `«${needle}»: елемент з текстом має wrap-anywhere або break-words (класи: ${own.join(" ")})`).toBe(true);
}

describe("Email у списку вибору виконавця не обрізається", () => {
  it("AC-VENDOR-02: email кожного варіанта (і довгий без пробілів) — повністю в одному елементі з переносом довгого слова, без truncate", () => {
    const html = render();

    expect(html.match(/role="option"/g)).toHaveLength(options.length);
    for (const [index, email] of [A, B, V].entries()) expectShownInFull(optionMarkup(html, `assignees-${index}`), email);
  });

  it("AC-VENDOR-02: опис варіанта (description) теж без truncate і з переносом довгого слова", () => {
    const html = render();

    expectShownInFull(optionMarkup(html, "assignees-3"), DESCRIPTION);
    expectShownInFull(optionMarkup(html, "assignees-3"), "uat-261109190437-p3@example.test");
  });
});
