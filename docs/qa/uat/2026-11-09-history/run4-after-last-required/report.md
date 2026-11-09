# Звіт UAT — 09.11.2026

- **Застосунок:** https://2026-quitcode-09-software-factory-h.vercel.app (/api/health: коміт `a56e1dd`)
- **Код тестів:** `tests-first/vendor-last-required` @ `d73ce69`
- **Прогін:** 09.11.2026, 21:43 (Київ), Playwright 147.1 с; AC: 10 — PASS 9, FAIL 1, NEEDS-HUMAN 0
- **Рецензент:** `claude-haiku-5-5`; суперечки → `claude-sonnet-5-5`. Разом за розбір: $0.6483 (ціни API; за підпискою — у межах ліміту плану)
- **Прибирання:** синтетичних uat-*@example.test видалено 12, лишилось 0, їхніх рядків, що лишились: 0
- **Відео й траси:** не в git — `test-results/` локально або артефакт CI; трасу відкриває `npx playwright show-trace <trace.zip>`

| AC | Перевірки | Агент | Підсумок | Чому | Playwright | Розбір |
|---|---|---|---|---|---|---|
| AC-VENDOR-01 | пройшли | Haiku: NEEDS-HUMAN, Sonnet: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 19.0 с | $0.1011, 22.2 с |
| AC-VENDOR-02 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 13.5 с | $0.0794, 12.7 с |
| AC-VENDOR-03 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 9.7 с | $0.0593, 10.9 с |
| AC-VENDOR-04 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 9.1 с | $0.0724, 16.4 с |
| AC-VENDOR-05 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 9.9 с | $0.0547, 8.5 с |
| AC-VENDOR-06 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 8.0 с | $0.0591, 11.2 с |
| AC-VENDOR-07 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 12.7 с | $0.0550, 9.0 с |
| AC-VENDOR-08 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 8.2 с | $0.0539, 9.0 с |
| AC-VENDOR-09 | впали | Haiku: NEEDS-HUMAN | **FAIL** | R1: перевірка впала — FAIL завжди, агент не перекриває | 10.3 с | $0.0518, 8.4 с |
| AC-VENDOR-10 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 6.6 с | $0.0617, 12.6 с |

## AC-VENDOR-01 — PASS

**Тест:** AC-VENDOR-01: менеджер A запускає «Tenant move-in» для «Apartment 12, move-in» і призначає підрядника V задачам 3 і 4 — задачі 3 і 4 на V, задачі 1, 2 і 5 на A

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-01: Given manager A, vendor V and the template "Tenant move-in" with 5 tasks. When A launches the template for the case "Apartment 12, move-in" and assigns V as the assignee of tasks 3 and 4. Then tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.

![Кадр «Тоді» 1](frames/AC-VENDOR-01-then-1.png)

**Кроки:** ✔ Дано: менеджер A, підрядник V і шаблон «Tenant move-in» з 5 задачами → ✔ Коли: A запускає шаблон для випадку «Apartment 12, move-in» і призначає V виконавцем задач 3 і 4 → ✔ Тоді: tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.

**Агент (claude-sonnet-5-5, PASS):** На сторінці запуску «Apartment 12, move-in» задачі «Hand over the keys» і «Record meter readings» (3 і 4) мають виконавця p4, а «Sign the lease agreement», «Inspect the apartment» і «Order cleaning» (1, 2, 5) мають виконавця p1. Менеджер запуску — p1. Це відповідає критерію.

Haiku сказав NEEDS-HUMAN, тож розбір повторив Sonnet; рішення агента — за Sonnet.

**Цитати агента, звірені зі сторінкою (aria):**
- «Apartment 12, move-in» — є на сторінці
- «Hand over the keys» — є на сторінці
- «uat-261109194345-p4@example.test» — є на сторінці
- «Record meter readings» — є на сторінці
- «uat-261109194345-p4@example.test» — є на сторінці
- «Sign the lease agreement» — є на сторінці
- «uat-261109194345-p1@example.test» — є на сторінці
- «Inspect the apartment» — є на сторінці
- «uat-261109194345-p1@example.test» — є на сторінці
- «Order cleaning» — є на сторінці
- «uat-261109194345-p1@example.test» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assign-AC-VENDOR-01-fbf7e--4-на-V-задачі-1-2-і-5-на-A-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-AC-VENDOR-01-fbf7e--4-на-V-задачі-1-2-і-5-на-A-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-01 — …») · @login: ____

## AC-VENDOR-02 — PASS

**Тест:** AC-VENDOR-02: менеджер A у виборі виконавця під час запуску бачить email менеджера B, адміністратора і підрядника V — без імен, ролей та інших даних профілю

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-02: Given managers A and B, an administrator and vendor V, and A launching a template. When A opens the assignee picker. Then A sees the emails of B, of the administrator and of V, and no names, roles or other profile data.

![Кадр «Тоді» 1](frames/AC-VENDOR-02-then-1.png)
![Кадр «Тоді» 2](frames/AC-VENDOR-02-then-2.png)
![Кадр «Тоді» 3](frames/AC-VENDOR-02-then-3.png)

**Кроки:** ✔ Дано: менеджери A і B, адміністратор і підрядник V, і A запускає шаблон → ✔ Коли: A відкриває вибір виконавця → ✔ Тоді: A sees the emails of B, of the administrator and of V, and no names, roles or other profile data. → ✔ Тоді: A sees the emails of B, of the administrator and of V, and no names, roles or other profile data. → ✔ Тоді: A sees the emails of B, of the administrator and of V, and no names, roles or other profile data.

**Агент (claude-haiku-5-5, PASS):** На всіх трьох кадрах видно той самий стан: відкрито список вибору виконавця на сторінці запуску шаблону, і в ньому повні email uat-261109194345-p2, -p3 і -p4 без трикрапки. Кадри однакові між собою, тож кожна частина «Тоді» підтверджена одним і тим самим екраном. Перевірки «Не з кадрів» (видимість у viewport, відсутність імен і слів ролей) не оцінював.

**Цитати агента, звірені зі сторінкою (aria):**
- «uat-261109194345-p2@example.test» — є на сторінці
- «uat-261109194345-p3@example.test» — є на сторінці
- «uat-261109194345-p4@example.test» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assign-AC-VENDOR-02-5832e-олей-та-інших-даних-профілю-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-AC-VENDOR-02-5832e-олей-та-інших-даних-профілю-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-02 — …») · @login: ____

## AC-VENDOR-03 — PASS

**Тест:** AC-VENDOR-03: підрядник V (2 задачі в «Apartment 12, move-in», жодної в «Apartment 14, repair») відкриває список запусків — бачить лише «Apartment 12, move-in» зі статусом запуску й «Your tasks: 0 of 2 done»; «Apartment 14, repair» не бачить

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-03: Given vendor V who is the assignee of 2 tasks in the run "Apartment 12, move-in" and of no task in the run "Apartment 14, repair". When V opens the list of runs. Then V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".

![Кадр «Тоді» 1](frames/AC-VENDOR-03-then-1.png)

**Кроки:** ✔ Дано: підрядник V — виконавець 2 задач у запуску «Apartment 12, move-in» і жодної задачі в запуску «Apartment 14, repair» → ✔ Коли: V відкриває список запусків → ✔ Тоді: V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки /runs видно єдиний рядок запуску «Apartment 12, move-in» зі статусом «in progress» і написом «Your tasks: 0 of 2 done». Жодного рядка з «Apartment 14, repair» на кадрі немає, кадр повний, не обрізаний. Для частини «немає» цитати немає, бо оцінюється відсутність тексту.

**Цитати агента, звірені зі сторінкою (aria):**
- «Apartment 12, move-in» — є на сторінці
- «in progress» — є на сторінці
- «Your tasks: 0 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-AC-VENDOR-03-п-f814a-rtment-14-repair»-не-бачить-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-AC-VENDOR-03-п-f814a-rtment-14-repair»-не-бачить-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-03 — …») · @login: ____

## AC-VENDOR-04 — PASS

**Тест:** AC-VENDOR-04: підрядник V (виконавець задач 3 і 4 запуску «Apartment 12, move-in» з 5 задачами) відкриває запуск — бачить рівно задачі 3 і 4 з назвою, секцією, «required»/«optional» і статусом; не бачить задач 1, 2 і 5, email інших користувачів і прогресу всього запуску

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-04: Given vendor V who is the assignee of tasks 3 and 4 in the run "Apartment 12, move-in" (5 tasks). When V opens this run. Then V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run.

![Кадр «Тоді» 1](frames/AC-VENDOR-04-then-1.png)

**Кроки:** ✔ Дано: підрядник V — виконавець задач 3 і 4 у запуску «Apartment 12, move-in» з 5 задачами → ✔ Коли: V відкриває цей запуск → ✔ Тоді: V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run.

**Агент (claude-haiku-5-5, PASS):** На кадрі видно рівно дві задачі «Hand over the keys» і «Record meter readings» із секцією «Move-in day», міткою «required»/«optional» і статусом «to do». Задач 1, 2, 5 немає, панелі «Details» немає, email q1 не показано (у сайдбарі лише власний email q2), лічильник «Your tasks: 0 of 2 done» без «of 5». Бейдж «in progress» біля заголовка — статус запуску, а не лічильник «N of M», тож його не вважаю порушенням; за бажанням можна уточнити людиною.

**Цитати агента, звірені зі сторінкою (aria):**
- «Hand over the keys» — є на сторінці
- «Move-in day» — є на сторінці
- «required» — є на сторінці
- «to do» — є на сторінці
- «Record meter readings» — є на сторінці
- «Move-in day» — є на сторінці
- «optional» — є на сторінці
- «to do» — є на сторінці
- «Your tasks: 0 of 2 done» — є на сторінці
- «Hand over the keys» — є на сторінці
- «Record meter readings» — є на сторінці
- «uat-261109194345-q2@example.test» — є на сторінці
- «Your tasks: 0 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-tasks-AC-VENDOR-04--3609b-в-і-прогресу-всього-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-tasks-AC-VENDOR-04--3609b-в-і-прогресу-всього-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-04 — …») · @login: ____

## AC-VENDOR-05 — PASS

**Тест:** AC-VENDOR-05: підрядник V позначає свою задачу 3 «to do» (не остання обов'язкова) у «Apartment 12, move-in» — задача 3 має статус «done», V бачить «Your tasks: 1 of 2 done»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-05: Given vendor V who is the assignee of task 3 with status "to do", which is not the last required task of the run "Apartment 12, move-in". When V marks task 3 as done. Then task 3 has status "done", and V sees "Your tasks: 1 of 2 done".

![Кадр «Тоді» 1](frames/AC-VENDOR-05-then-1.png)

**Кроки:** ✔ Дано: підрядник V — виконавець задачі 3 «to do», яка не є останньою обов'язковою задачею запуску «Apartment 12, move-in» → ✔ Коли: V позначає задачу 3 виконаною → ✔ Тоді: task 3 has status "done", and V sees "Your tasks: 1 of 2 done".

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png у рядку «Hand over the keys» (позначка required) стоїть статус «done», а над списком написано «Your tasks: 1 of 2 done». Обидві видимі частини «Тоді» збігаються з критерієм посимвольно. Частина про базу не з кадрів, тому не оцінювалась.

**Цитати агента, звірені зі сторінкою (aria):**
- «Hand over the keys» — є на сторінці
- «done» — є на сторінці
- «Your tasks: 1 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-tasks-AC-VENDOR-05--5135a-ть-«Your-tasks-1-of-2-done»-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-tasks-AC-VENDOR-05--5135a-ть-«Your-tasks-1-of-2-done»-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-05 — …») · @login: ____

## AC-VENDOR-06 — PASS

**Тест:** AC-VENDOR-06: запуск «Apartment 14, repair», у якому підрядник V не має задач; V відкриває сторінку цього запуску за прямим посиланням — бачить «Run not found» і жодної задачі запуску

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-06: Given the run "Apartment 14, repair" in which vendor V has no task. When V opens the page of this run by a direct link. Then V sees the message "Run not found" and none of the tasks of the run.

![Кадр «Тоді» 1](frames/AC-VENDOR-06-then-1.png)

**Кроки:** ✔ Дано: запуск «Apartment 14, repair», у якому підрядник V не має задач → ✔ Коли: V відкриває сторінку цього запуску за прямим посиланням → ✔ Тоді: V sees the message "Run not found" and none of the tasks of the run.

**Агент (claude-haiku-5-5, PASS):** На кадрі видно повідомлення «Run not found» з кнопкою «Back to runs» у головній області сторінки. Жодної з п'яти назв задач («Sign the lease agreement», «Inspect the apartment» тощо) на кадрі немає, основна область містить лише це повідомлення. Частину «немає задач» підтверджено відсутністю тексту, тому цитата в quoted_text — той самий заголовок «Run not found».

**Цитати агента, звірені зі сторінкою (aria):**
- «Run not found» — є на сторінці
- «Run not found» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-AC-VENDOR-06-з-49a9c-nd»-і-жодної-задачі-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-AC-VENDOR-06-з-49a9c-nd»-і-жодної-задачі-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-06 — …») · @login: ____

## AC-VENDOR-07 — PASS

**Тест:** AC-VENDOR-07: у «Apartment 12, move-in» задача 1 — на менеджері A, задачі 3 і 4 — на підряднику V; V напряму, оминаючи сторінки, позначає задачу 1 виконаною — задача 1 лишається «to do»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-07: Given the run "Apartment 12, move-in" in which task 1 is assigned to manager A and tasks 3 and 4 to vendor V. When V tries to mark task 1 as done directly, bypassing the pages of the application. Then task 1 stays "to do".

![Кадр «Тоді» 1](frames/AC-VENDOR-07-then-1.png)

**Кроки:** ✔ Дано: запуск «Apartment 12, move-in», у якому задача 1 призначена менеджеру A, а задачі 3 і 4 — підряднику V → ✔ Коли: V намагається позначити задачу 1 виконаною напряму, оминаючи сторінки застосунку (rpc complete_task від імені V) → ✔ Тоді: task 1 stays "to do".

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінка запуску «Apartment 12, move-in» (in progress) з задачею «Sign the lease agreement» (required) у блоці «Before move-in», її статус — «to do», а лічильник «0 of 5 done». Користувач у нижньому лівому куті — uat-261109194345-q1@example.test, він же «Run manager», тож кадр відповідає сторінці менеджера A. Частини про NOT_ALLOWED та стан у базі не з кадрів, не оцінювались.

**Цитати агента, звірені зі сторінкою (aria):**
- «Sign the lease agreement» — є на сторінці
- «to do» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-tasks-AC-VENDOR-07--00e20--задача-1-лишається-«to-do»-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-tasks-AC-VENDOR-07--00e20--задача-1-лишається-«to-do»-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-07 — …») · @login: ____

## AC-VENDOR-08 — PASS

**Тест:** AC-VENDOR-08: підрядник V відкриває список шаблонів за прямим посиланням — бачить «Not enough rights» і жодного шаблону

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-08: Given vendor V signed in. When V opens the list of templates by a direct link. Then V sees the message "Not enough rights" and no template.

![Кадр «Тоді» 1](frames/AC-VENDOR-08-then-1.png)

**Кроки:** ✔ Дано: підрядник V увійшов; у агенції є збережені шаблони (зокрема «Tenant move-in») → ✔ Коли: V відкриває список шаблонів за прямим посиланням /templates → ✔ Тоді: V sees the message "Not enough rights" and no template.

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки /templates видно червоне повідомлення «Not enough rights» і кнопку «Back to runs», а заголовок «Templates» без жодного списку. Назв шаблонів «Apartment repair» і «Tenant move-in» на кадрі немає. Для другої частини цитата — це видимі написи сторінки, бо сам факт відсутності шаблонів підтверджується їхньою відсутністю на екрані.

**Цитати агента, звірені зі сторінкою (aria):**
- «Not enough rights» — є на сторінці
- «Templates» — є на сторінці
- «Not enough rights» — є на сторінці
- «Back to runs» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-templates-AC-VENDOR-1b4c6-h-rights»-і-жодного-шаблону-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-templates-AC-VENDOR-1b4c6-h-rights»-і-жодного-шаблону-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-08 — …») · @login: ____

## AC-VENDOR-09 — FAIL

**Тест:** AC-VENDOR-09: підрядник V напряму, оминаючи сторінки, запускає «Tenant move-in» — запуск не створено, список запусків не змінився

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-09: Given vendor V signed in and the template "Tenant move-in" with current version 1. When V tries to launch this template directly, bypassing the pages of the application. Then no run is created, and the list of runs does not change.

![Кадр «Тоді» 1](frames/AC-VENDOR-09-then-1.png)

**Кроки:** ✔ Дано: підрядник V увійшов і шаблон «Tenant move-in» має поточну версію → ✔ Коли: V намагається запустити цей шаблон напряму, оминаючи сторінки застосунку (rpc launch_run від імені V) → ✘ Тоді: no run is created, and the list of runs does not change.

**Перевірка впала:**

```
Error: expect(received).toBe(expected) // Object.is equality

- Expected  - 2
+ Received  + 1

  - main:
-   - heading "Runs" [level=1]
-   - paragraph: No tasks assigned to you yet.
```

**Агент (claude-haiku-5-5, NEEDS-HUMAN):** На кадрі frame-then-1.png сторінка Runs ще в стані завантаження: видно лише сірі плейсхолдери таблиці з шести рядків, без текстів. Назви запусків, зокрема «Apartment 12, move-in», не відображені, тож підтвердити, що список не змінився, неможливо; потрібен новий кадр після завершення завантаження.

**Агент бачить вади:**
- Кадр frame-then-1.png зроблено під час завантаження: сторінка /runs показує лише сірі скелетони рядків без назв запусків, тому відсутність «Apartment 12, move-in» перевірити не можна.

**Правило:** R1: перевірка впала — FAIL завжди, агент не перекриває

**Відео:** `test-results/artifacts/vendor-assign-AC-VENDOR-09-9d99c-список-запусків-не-змінився-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-AC-VENDOR-09-9d99c-список-запусків-не-змінився-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-09 — …») · @login: ____

## AC-VENDOR-10 — PASS

**Тест:** AC-VENDOR-10: підрядник V без жодної задачі відкриває список запусків — бачить «No tasks assigned to you yet.» і не бачить порожньої таблиці

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-10: Given vendor V to whom no task is assigned. When V opens the list of runs. Then V sees the message "No tasks assigned to you yet." and no empty table.

![Кадр «Тоді» 1](frames/AC-VENDOR-10-then-1.png)

**Кроки:** ✔ Дано: підрядник V, якому не призначено жодної задачі → ✔ Коли: V відкриває список запусків → ✔ Тоді: V sees the message "No tasks assigned to you yet." and no empty table.

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки «Runs» видно точний текст «No tasks assigned to you yet.» у пунктирній області порожнього стану. Табличних заголовків і рядків немає, тож порожньої таблиці не видно. Частина «немає порожньої таблиці» оцінена за відсутністю таблиці на кадрі; цитата тут — текст, що її замінює.

**Цитати агента, звірені зі сторінкою (aria):**
- «No tasks assigned to you yet.» — є на сторінці
- «No tasks assigned to you yet.» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-AC-VENDOR-10-п-45a93-не-бачить-порожньої-таблиці-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-AC-VENDOR-10-п-45a93-не-бачить-порожньої-таблиці-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-10 — …») · @login: ____

## Як читати підсумок

- **PASS** — автоматичні перевірки пройшли, агент-рецензент погодився з кадром, а кожну його цитату знайдено на сторінці.
- **FAIL** — впала автоматична перевірка. Агент цього не перекриває: невидимі вади (буфер обміну, база) він на кадрі не побачить.
- **NEEDS-HUMAN** — перевірки зелені, але агент не погодився або його цитати немає на сторінці. Часто це слабкий тест або розбіжність між текстом AC і тестом — питання до PM, а не обов'язково вада продукту.

Правила: R1: перевірка впала — FAIL завжди, агент не перекриває; R2: немає вердикту агента або кадру; R3: перевірки пройшли, агент не погоджується — вирішує людина; R4: цитати агента немає на сторінці (aria) — не підтверджено; R5: помилка сторінки або 5xx під час сценарію; R6: перевірки, агент і цитати збігаються.
