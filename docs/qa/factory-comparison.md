# Звіт порівняння зрізу 3: звичайно проти фабрики

- Зріз 3: менеджер призначає підрядника виконавцем задач під час запуску, а підрядник входить, бачить лише свої запуски
  й задачі, позначає свої задачі виконаними і нічого іншого агенції не бачить і не змінює — ні на сторінках, ні прямим
  запитом.
- AC зрізу 3: AC-VENDOR-01, AC-VENDOR-02, AC-VENDOR-03, AC-VENDOR-04, AC-VENDOR-05, AC-VENDOR-06, AC-VENDOR-07,
  AC-VENDOR-08, AC-VENDOR-09, AC-VENDOR-10 (вимога PM
  [solomchaak/property-workflows-spec#39](https://github.com/solomchaak/property-workflows-spec/issues/39)).
- Звичайно: https://github.com/OleksandrMartynov/property-workflows, `main` = `51a0b42e3e423bccf6e90189d85b916cf9410d4a`,
  прод https://property-workflows-rho.vercel.app.
- Фабрика: https://github.com/OleksandrMartynov/property-workflows-factory, `main` = `a56e1dd0cfeeb42bad8681eef68db90541b51f16`
  (код зрізу 3 — останній PR фабрики), прод https://2026-quitcode-09-software-factory-h.vercel.app
  ([`/api/health`](https://2026-quitcode-09-software-factory-h.vercel.app/api/health) — `sha` злиття, `db: ok`).
- База двійника: тег [`ws9-base`](https://github.com/OleksandrMartynov/property-workflows/tree/ws9-base) основного репо
  (`9524bf1`, до першого коду зрізу 3) + інфраструктура UAT
  ([#1](https://github.com/OleksandrMartynov/property-workflows-factory/pull/1)) і README
  ([#2](https://github.com/OleksandrMartynov/property-workflows-factory/pull/2)) — людськими PR.
- Фабрика й імпортер: курс-редакція [`koldovsky/2026-quitcode-09-factory`](https://github.com/koldovsky/2026-quitcode-09-factory)
  (`1280bc6`), fork [`OleksandrMartynov/2026-quitcode-09-factory`](https://github.com/OleksandrMartynov/2026-quitcode-09-factory),
  гілка `team/property-workflows`, коміт адаптера `c35fc80` (`tools/ac-to-task.mjs`: префікс заголовка «Requirement:»
  + тест на знімку вимоги PM у `tests/ws9.test.mjs`). Формат AC PM — рядки `- AC-VENDOR-NN: Given … When … Then …`
  (`--format lines`, парсер без змін).
- Моделі фабрики: планувальник, виконавець і рецензент — `claude-sonnet-5-5` (`factory.json`, «Cost and provenance»
  пакетів доказів). UAT-рецензент обох репо — `claude-haiku-5-5`, суперечки — `claude-sonnet-5-5`.

## Прогони фабрики

Wall-час — від першої до останньої події `events.jsonl` прогону до `released` / `needs-human` (включно з очікуванням
схвалення плану людиною — окремо в дужках).

| Run id | Задача і AC | Стан | Спроби | Вартість | Wall-час | Дайджест пакета доказів | PR |
|---|---|---|---|---|---|---|---|
| `run-20261109170435-f64016` | vendor-db: AC-VENDOR-01, 02, 09 | needs-human (планувальник: «Not logged in» — CLI без входу в чистому оточенні фабрики) | 0/3 | $0.0000 | 11 с | — | — |
| `run-20261109171206-969078` | vendor-db: AC-VENDOR-01, 02, 09 | released | 1/3 | $0.4639 | 260 с (137 с — схвалення плану) | `575a832a41d58d1e4a189983ef9e6a4ea9841efd5bcbf0bc714c0b48e0329ad1` | [#3](https://github.com/OleksandrMartynov/property-workflows-factory/pull/3) |
| `run-20261109173709-7b2fe3` | vendor-tasks: AC-VENDOR-04, 05, 07 | needs-human (спроби вичерпано: maintainability, mutation, mutation) | 3/3 | $0.6997 | 531 с (274 с — схвалення плану) | — | — |
| `run-20261109175104-a3083c` | vendor-tasks: AC-VENDOR-04, 05, 07 | released | 1/3 | $0.6413 | 337 с (145 с — схвалення плану) | `fdbe029adac41120f397706d7de1876683a129e5cf470c78eb8ec176734b0eda` | [#4](https://github.com/OleksandrMartynov/property-workflows-factory/pull/4) |
| `run-20261109181518-708621` | vendor-runs: AC-VENDOR-03, 06, 10 | released | 1/3 | $0.7246 | 271 с (87 с — схвалення плану) | `9de95fb4ec4e145c7317f6050c080837c44be3394b80f43f8b6c35ecd68097f2` | [#5](https://github.com/OleksandrMartynov/property-workflows-factory/pull/5) |
| `run-20261109185757-05d653` | vendor-templates: AC-VENDOR-08 | released | 1/3 | $0.2104 | 87 с | `8ea42bfebc0555666e59da90010b3c227f8631efe1bc50ba7e09aa06f4ee6713` | [#6](https://github.com/OleksandrMartynov/property-workflows-factory/pull/6) |
| `run-20261109191512-de86a1` | vendor-picker-email: AC-VENDOR-02 (вада з UAT) | released | 1/3 | $0.1661 | 66 с | `e506ad78b0087f8658745baa971693c6afe6b8e2702d691c9e8d4a29da980a67` | [#7](https://github.com/OleksandrMartynov/property-workflows-factory/pull/7) |
| `run-20261109193717-11437f` | vendor-last-required: AC-VENDOR-05 (вада з e2e і UAT) | released | 1/3 | $0.1814 | 85 с | `66172268a763772f1eacba64740d926de74112e621e4a652a4b5331fe0819194` | [#8](https://github.com/OleksandrMartynov/property-workflows-factory/pull/8) |

Пакети доказів лежать у репо двійника в `docs/factory/<run-id>.md` (фабрика кладе їх у PR) і в описах PR.
`db-deploy` двійника після кожного злиття: [#3](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42663777423),
[#4](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42670135006),
[#5](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42675928949),
[#6](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42679436752),
[#7](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42682526156),
[#8](https://github.com/OleksandrMartynov/property-workflows-factory/actions/runs/42686021777).

## За AC

Звичайно — тести й UAT основного репо на SHA `51a0b42` (рядки
[`docs/conformance.md`](https://github.com/OleksandrMartynov/property-workflows/blob/51a0b42e3e423bccf6e90189d85b916cf9410d4a/docs/conformance.md),
UAT [`docs/qa/uat/2026-11-09/report.md`](https://github.com/OleksandrMartynov/property-workflows/blob/51a0b42e3e423bccf6e90189d85b916cf9410d4a/docs/qa/uat/2026-11-09/report.md),
13/13 PASS з негативним контролем). Фабрика — `verifiedBy` задачі, видимі тести гілок «тести спершу» (теги
`ws9-red-*`) і приховані сценарії; UAT — [`docs/qa/uat/2026-11-09/report.md`](uat/2026-11-09/report.md) двійника.

Прогони UAT двійника (кадри, `manifest.json`, звіти):

| Прогін | Коміт проду | Шаблон | Результат | Звіт |
|---|---|---|---|---|
| 1 | `6eeb080` (4 задачі) | seed | 9 PASS, AC-VENDOR-02 NEEDS-HUMAN (R3) | [run1-before-email-fix](uat/2026-11-09-history/run1-before-email-fix/report.md) |
| 2 | `cf98a78` (+ vendor-picker-email) | seed | 10/10 PASS | [run2-after-email-fix](uat/2026-11-09-history/run2-after-email-fix/report.md) |
| 3 | `cf98a78` | форма з AC (`template:ac`) | AC-VENDOR-05 FAIL (R1) — зайвий діалог | [run3-ac05-before-fix](uat/2026-11-09-history/run3-ac05-before-fix/report.md) |
| 4 | `a56e1dd` (+ vendor-last-required) | форма з AC | 9 PASS, AC-VENDOR-09 FAIL (R1) — знімок скелета `/runs` у тесті | [run4-after-last-required](uat/2026-11-09-history/run4-after-last-required/report.md) |
| 5 (фінальний) | `a56e1dd` | форма з AC | **10/10 PASS** (тест AC-VENDOR-09 чекає, поки `/runs` домалюється) | [2026-11-09](uat/2026-11-09/report.md) |

| AC | Звичайно: тест і доказ | Звичайно: UAT | Фабрика: `verifiedBy` і доказ у пакеті | Фабрика: UAT на проді двійника | Різниця в поведінці |
|---|---|---|---|---|---|
| AC-VENDOR-01 | `tests/db/vendor-db.test.ts` (PGlite) | PASS (R6) | `visible:AC-VENDOR-01` ✓ (`tests/db/vendor-assign-db.test.ts`), holdout vendor-db (11/11 на набір) | PASS | немає |
| AC-VENDOR-02 | `tests/db/vendor-db.test.ts`; email не обрізається — `listbox-parts.tsx` (#87) | PASS (після #86 і #87) | `visible:AC-VENDOR-02` ✓, holdout vendor-db; після UAT — `tests/design/picker-email-wrap.test.tsx`, holdout vendor-picker-email 3/3 | спершу NEEDS-HUMAN (email обрізано, кадр не показав B/адміністратора/V), після run `…de86a1` — PASS | та сама вада в обох (`truncate` у варіанті списку); в обох знайшов UAT, виправлено так само (`wrap-anywhere`) |
| AC-VENDOR-03 | `tests/db/vendor-db.test.ts` (`vendor_runs`), `tests/runs/…` | PASS | `visible:AC-VENDOR-03` ✓ (`tests/db/vendor-runs-db.test.ts`, `tests/runs/vendor-runs-list.test.tsx`, `tests/runs/vendor-run-loaders.test.ts`), holdout vendor-runs 11/11 | PASS | немає |
| AC-VENDOR-04 | `tests/db/vendor-db.test.ts`, компонент сторінки | PASS | `visible:AC-VENDOR-04` ✓ (`tests/db/vendor-own-tasks-db.test.ts`, `tests/runs/vendor-run-detail.test.tsx`, `tests/runs/vendor-role.test.ts`), holdout vendor-tasks 12/12 | PASS | немає |
| AC-VENDOR-05 | `tests/db/vendor-db.test.ts`; `run_last_required_task` | PASS | `visible:AC-VENDOR-05` ✓, holdout vendor-tasks; після e2e/UAT — `tests/db/vendor-last-required-db.test.ts`, loader-тест, holdout vendor-last-required 4/4 | на даних seed — PASS; на шаблоні у формі AC (`npm run template:ac`) — FAIL R1 (зайвий діалог «This cannot be undone»); після run `…11437f` — PASS | фабрика спершу рахувала «останню обов'язкову» за задачами підрядника (рецензент фабрики назвав це неблокуючою приміткою); звичайна реалізація одразу мала функцію бази з `design.md` |
| AC-VENDOR-06 | `tests/db/vendor-db.test.ts` | PASS | `visible:AC-VENDOR-06` ✓ (`tests/db/vendor-run-not-found-db.test.ts`, loader-тест), holdout vendor-runs | PASS | немає |
| AC-VENDOR-07 | `tests/db/vendor-db.test.ts`, SQL-мутант V07 KILLED | PASS | pass-to-pass `visible:AC-VENDOR-07` ✓ (зелений до зміни — сторож), holdout vendor-tasks (HT07a–d) | PASS | немає |
| AC-VENDOR-08 | сторінки шаблонів, мутанти V08 / V08t KILLED | PASS | `visible:AC-VENDOR-08` ✓ (`tests/templates/vendor-templates-forbidden.test.tsx`), holdout vendor-templates 5/5 | PASS | немає |
| AC-VENDOR-09 | `tests/db/vendor-db.test.ts`, мутант V09 KILLED | PASS | `visible:AC-VENDOR-09` ✓ (`tests/db/vendor-launch-refused-db.test.ts`), holdout vendor-db | PASS (після виправлення знімка UAT — див. «Вади від UAT») | немає |
| AC-VENDOR-10 | компонент списку, `vendor_runs` | PASS | `visible:AC-VENDOR-10` ✓ (`tests/db/vendor-no-tasks-db.test.ts`, `tests/runs/vendor-runs-list.test.tsx`), holdout vendor-runs | PASS | немає |

Перевірка самих тестів фабрики: видимі тести гілок «тести спершу» і всі шість наборів прихованих сценаріїв окремо прогнано
на реалізації основного репо (`51a0b42`) — зелені (крім сигнатури `formatVendorProgress`, яку контракт двійника зафіксував
інакше). Тобто вони перевіряють правило, а не помилку підготовки.

## Метрики

| Метрика | Звичайно | Фабрика | Джерело |
|---|---|---|---|
| Час (календарний) | 30.10 12:47Z (PR «Специфікація» [#46](https://github.com/OleksandrMartynov/property-workflows/pull/46)) → 09.11 14:12Z (злиття [#88](https://github.com/OleksandrMartynov/property-workflows/pull/88)); основний код — #49 13:19Z → #50 14:40Z 30.10 (≈ 1 год 21 хв) | коміт тестів-спершу (тег [`ws9-red`](https://github.com/OleksandrMartynov/property-workflows-factory/tree/ws9-red), 09.11 16:54Z) → злиття [#6](https://github.com/OleksandrMartynov/property-workflows-factory/pull/6) 19:02Z (усі 10 AC) ≈ 2 год 8 хв; з двома задачами з UAT — до [#8](https://github.com/OleksandrMartynov/property-workflows-factory/pull/8) 19:43Z ≈ 2 год 49 хв | часи PR (GitHub), теги |
| Хвилини людини | не виміряно | не виміряно (журнал хвилин не вели) | — |
| Вартість | не виміряно (Claude Code за підпискою) | $3.0874 за 8 прогонів (з невдалими: $0 + $0.6997); UAT двійника — окремо, ≈ $1.2 за повний прогін (рядки звітів UAT) | «Cost and provenance» пакетів, `run.json` |
| Токени | не виміряно | виконавець+планувальник+рецензент, усі прогони: вхідних 288, вихідних 92 173, з кешу 2 239 637, у кеш 429 292 | `store/runs/<run-id>/agent-*-summary.json` |
| Спроби | червоні прогони CI до злиття: #49 — 1 з 11, #85 — 1 з 16, #86 — 1 з 12, #87 — 3 з 20, решта PR зрізу — 0 | 8 прогонів, 10 спроб виконавця: 6 прогонів з першої спроби; 1 — 3/3 → needs-human; 1 — 0/3 (вхід CLI) | `gh run list`, `events.jsonl` |
| Що зловили ворота | CodeRabbit: 28 зауважень у PR зрізу ([#46](https://github.com/OleksandrMartynov/property-workflows/pull/46) 2, #47 3, #49 3, #50 2, #83 3, #85 7, #86 1, #87 3, #88 4); CI: червоні e2e/app на #49, #85–#87 | maintainability FAIL (дубль 13 рядків `RunDetail` у `VendorRunDetail`); mutation FAIL ×2 (`===` → `!==` в `isVendor` не ловив жоден тест); хук політики відхилив 13 викликів інструментів; допуск — 0 відмов; рецензент — 1 неблокуюча примітка (зайвий діалог підтвердження) | пакети доказів, `run.json` |
| Втручання людини | — | 12 схвалень, 5 `resume`, 0 `answer`, 7 ручних комітів «тести спершу» + 1 доданий тест — див. нижче | `store/approvals.jsonl`, коміти двійника |
| Вади від UAT | 2: AC-VENDOR-02 — кадр не доводив «Тоді» (#86) і email обрізано (#87) | 3: AC-VENDOR-02 NEEDS-HUMAN (email обрізано — та сама вада), AC-VENDOR-05 FAIL R1 (зайвий діалог; спершу знайшов e2e у CI на #4–#7), AC-VENDOR-09 FAIL R1 (знімок скелета сторінки — вада тесту UAT, не продукту) | звіти UAT обох репо |
| Вади від PM | не надходило (issues «Відхилення від вимог» — 0 на момент звіту) | не надходило (PM двійник не приймав) | репо PM |
| Мутації | SQL-мутанти V03, V04, V06, V07, V08, V09 і TS V08t — усі KILLED ([#84](https://github.com/OleksandrMartynov/property-workflows/pull/84)) | ворота mutation: PASS 1/1 (vendor-tasks після доданого тесту), n/a в решті (SQL ворота не мутують; у змінених рядках `src/**` немає операторів або «no source files changed») | пакети доказів |
| Розмір diff | код зрізу 3 (`src`, `supabase`): #49 + #50 + #87 — 26 файлів, +602 / −41 | `git diff --shortstat 131527b a56e1dd -- src supabase`: 23 файли, +570 / −19; тести — 24 файли, +2202 / −6 | git |
| Якість коду | fallow у CI зелений; знахідки CodeRabbit виправлено до злиття | fallow (дорадчий) зелений на всіх PR фабрики; maintainability PASS після 1-ї спроби vendor-tasks; на сторінках `src/app/**` і `src/components/ui/**` ворота maintainability/mutation кілька разів «n/a: no source files changed» — профіль їх не міряє | пакети доказів, CI |

## Втручання людини у фабриці

Схвалення (`store/approvals.jsonl`), усі — `OleksandrMartynov`:

- `approve config` ×2 — друге після заміни `agent.executable` на обгортку `control/bin/claude-macos` (нижче).
- `approve intent` ×6 — vendor-db, vendor-tasks, vendor-runs, vendor-templates, vendor-picker-email, vendor-last-required.
- `approve plan` ×4 — `run-20261109171206-969078`, `run-20261109173709-7b2fe3`, `run-20261109175104-a3083c`,
  `run-20261109181518-708621` (задачі `medium`; `small` — без плану).
- `resume` ×5 — після схвалення кожного плану (для першого — двічі); `answer` — 0.

Ручні дії й коміти в двійнику:

- Вхід Claude Code CLI і обгортка агента: фабрика запускає агента з очищеним оточенням без `USER`, а Claude Code на
  macOS шукає вхід у Keychain за `USER` → `run-20261109170435-f64016` упав з «Not logged in». Код фабрики не змінено:
  у теці контролю додано обгортку `bin/claude-macos` (відновлює `USER` з `id -un`), `agent.executable` у `factory.json`.
- Коміти «тести спершу» (окремі сесії з тексту AC, не з основного репо): теги
  [`ws9-red`](https://github.com/OleksandrMartynov/property-workflows-factory/tree/ws9-red) /
  `ws9-red-vendor-db`, `ws9-red-vendor-tasks`, `ws9-red-vendor-tasks-2`, `ws9-red-vendor-runs`,
  `ws9-red-vendor-templates`, `ws9-red-vendor-picker-email`, `ws9-red-vendor-last-required`.
- `ws9-red-vendor-tasks-2` — доданий тест `tests/runs/vendor-role.test.ts` після `needs-human` на воротах mutation
  (`isVendor` не закріплено тестом); нова спроба — `run-20261109175104-a3083c`.
- Контракт в `intent` і п'ять `nonFunctionals` кожної задачі — людина (агент-оркестратор за F11), фабрика їх не пише.
- Поставка: `F deliver` (push, PR з пакетом доказів, `gh pr merge --auto --squash`) — для всіх шести PR; злиття —
  GitHub після обов'язкових перевірок. На [#5](https://github.com/OleksandrMartynov/property-workflows-factory/pull/5)
  GitHub Actions не створив частину jobs — людина перезапустила прогони (`gh run rerun`), коду не змінювала.
- Дані проду двійника: `npm run template:ac` — шаблон «Tenant move-in» у формі з AC PM (як у CI і на основному проді).
- Звіти UAT і цей звіт — людським PR; виправлення знімка в UAT AC-VENDOR-09 — там само (лише тест).
- Фабрика записала інцидент `inc-20261109194659-0cfe9b` після FAIL AC-VENDOR-09 і понизила класи docs / code /
  migration (`store/autonomy.json`): наступні зміни чекали б людину. Причиною була вада тесту UAT, а не коду — це ціна
  нестабільного тесту для автономії.

## Що не перевірено

- Ізоляція виконавця фабрики — лише політикою (хук) в одному обліковому записі macOS, не пісочницею
  (`docs/uk/limits.md` курс-редакції; «Not verified» пакетів).
- SQL-правила фабрики ворота mutation не мутують (n/a); силу тестів бази тут доводять лише приховані сценарії і прогін
  видимих тестів на реалізації основного репо.
- Бічна панель і ⌘K підрядника (design.md: лише Runs) — поза AC і поза задачами фабрики; підрядник бачить пункт
  «Templates», а сторінка показує «Not enough rights».
- `src/lib/supabase/database.types.ts` фабрика доповнювала вручну; `db-check` на #5 повідомив, що типи зі схеми
  відрізняються від закомічених (notice, не помилка). Перегенерувати — окремим людським PR.
- Один тест фабрики (`[P5.2]` у `tests/ws9.test.mjs` курс-редакції) падає на macOS через `node_modules/` у фікстурі
  `.gitignore` (symlink не ігнорується); двійник використовує `/node_modules` — перевірено, що ігнорується.
- Приймання PM на проді двійника не було.

## Частковий прогін

—

## Висновок

1. Де фабрика краща: кожна зміна доведена червоними тестами, прихованими сценаріями й рецензентом до злиття, а ворота mutation самі знайшли незакріплену тестом гілку ролі; від червоних тестів до 10/10 AC — ≈ 2 год і $3.09.
2. Де фабрика гірша: якість — це якість контракту й тестів людини; вади поза тестами (обрізаний email, «остання обов'язкова» за неповними даними) пройшли всі ворота і впали лише на e2e/UAT, а нестабільний тест UAT знизив автономію.
3. Що візьмемо у звичайний процес: окремі приховані сценарії з AC, перевірені на іншій реалізації; ворота мутацій на змінених рядках; контракт задачі з дослівними назвами й колонками до коду; UAT на даних у формі AC (`template:ac`) ще до злиття.
