# Звіт UAT — 09.11.2026

- **Застосунок:** https://2026-quitcode-09-software-factory-h.vercel.app (/api/health: коміт `a56e1dd`)
- **Код тестів:** `docs/uat-and-comparison` @ `cf98a78` + незакомічені зміни
- **Прогін:** 09.11.2026, 21:48 (Київ), Playwright 135.6 с; AC: 10 — PASS 10, FAIL 0, NEEDS-HUMAN 0
- **Рецензент:** `claude-haiku-5-5`; суперечки → `claude-sonnet-5-5`. Разом за розбір: $0.6730 (ціни API; за підпискою — у межах ліміту плану)
- **Прибирання:** синтетичних uat-*@example.test видалено 12, лишилось 0, їхніх рядків, що лишились: 0
- **Відео й траси:** не в git — `test-results/` локально або артефакт CI; трасу відкриває `npx playwright show-trace <trace.zip>`

| AC | Перевірки | Агент | Підсумок | Чому | Playwright | Розбір |
|---|---|---|---|---|---|---|
| AC-VENDOR-01 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 16.5 с | $0.0653, 13.3 с |
| AC-VENDOR-02 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 11.6 с | $0.0741, 10.2 с |
| AC-VENDOR-03 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 7.8 с | $0.0548, 9.1 с |
| AC-VENDOR-04 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 8.4 с | $0.0671, 13.0 с |
| AC-VENDOR-05 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 12.5 с | $0.0546, 8.8 с |
| AC-VENDOR-06 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 7.6 с | $0.0580, 10.6 с |
| AC-VENDOR-07 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 13.1 с | $0.0588, 10.4 с |
| AC-VENDOR-08 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 6.3 с | $0.0595, 11.6 с |
| AC-VENDOR-09 | пройшли | Haiku: NEEDS-HUMAN, Sonnet: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 8.5 с | $0.0938, 22.2 с |
| AC-VENDOR-10 | пройшли | Haiku: NEEDS-HUMAN, Sonnet: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 7.9 с | $0.0871, 18.6 с |

## AC-VENDOR-01 — PASS

**Тест:** AC-VENDOR-01: менеджер A запускає «Tenant move-in» для «Apartment 12, move-in» і призначає підрядника V задачам 3 і 4 — задачі 3 і 4 на V, задачі 1, 2 і 5 на A

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-01: Given manager A, vendor V and the template "Tenant move-in" with 5 tasks. When A launches the template for the case "Apartment 12, move-in" and assigns V as the assignee of tasks 3 and 4. Then tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.

![Кадр «Тоді» 1](frames/AC-VENDOR-01-then-1.png)

**Кроки:** ✔ Дано: менеджер A, підрядник V і шаблон «Tenant move-in» з 5 задачами → ✔ Коли: A запускає шаблон для випадку «Apartment 12, move-in» і призначає V виконавцем задач 3 і 4 → ✔ Тоді: tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінка запуску «Apartment 12, move-in» з банером «Run launched.» і п'ятьма задачами. Задачі «Hand over the keys» і «Record meter readings» (третя і четверта за порядком) мають виконавця uat-261109194829-p4@example.test, а «Sign the lease agreement», «Inspect the apartment» і «Order cleaning» — uat-261109194829-p1@example.test. Номери задач на кадрі не відображено, тому відповідність «3 і 4» виведено з позиції рядків у списку; базову перевірку id виконавців залишено автоматичним перевіркам.

**Цитати агента, звірені зі сторінкою (aria):**
- «Hand over the keys» — є на сторінці
- «uat-261109194829-p4@example.test» — є на сторінці
- «Record meter readings» — є на сторінці
- «uat-261109194829-p4@example.test» — є на сторінці
- «Sign the lease agreement» — є на сторінці
- «uat-261109194829-p1@example.test» — є на сторінці
- «Inspect the apartment» — є на сторінці
- «uat-261109194829-p1@example.test» — є на сторінці
- «Order cleaning» — є на сторінці
- «uat-261109194829-p1@example.test» — є на сторінці

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

**Агент (claude-haiku-5-5, PASS):** На всіх трьох кадрах відкритий список вибору виконавця показує повні email uat-261109194829-p2, p3 і p4 без трикрапки, і кожен із них відповідає відповідній частині «Тоді». Кадри майже однакові, тому вони підтверджують одну й ту саму видиму область списку. Імена та ролі в критерії перевіряються не з кадрів, тому їх не оцінюю.

**Цитати агента, звірені зі сторінкою (aria):**
- «uat-261109194829-p2@example.test» — є на сторінці
- «uat-261109194829-p3@example.test» — є на сторінці
- «uat-261109194829-p4@example.test» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assign-AC-VENDOR-02-5832e-олей-та-інших-даних-профілю-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-AC-VENDOR-02-5832e-олей-та-інших-даних-профілю-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-02 — …») · @login: ____

## AC-VENDOR-03 — PASS

**Тест:** AC-VENDOR-03: підрядник V (2 задачі в «Apartment 12, move-in», жодної в «Apartment 14, repair») відкриває список запусків — бачить лише «Apartment 12, move-in» зі статусом запуску й «Your tasks: 0 of 2 done»; «Apartment 14, repair» не бачить

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-03: Given vendor V who is the assignee of 2 tasks in the run "Apartment 12, move-in" and of no task in the run "Apartment 14, repair". When V opens the list of runs. Then V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".

![Кадр «Тоді» 1](frames/AC-VENDOR-03-then-1.png)

**Кроки:** ✔ Дано: підрядник V — виконавець 2 задач у запуску «Apartment 12, move-in» і жодної задачі в запуску «Apartment 14, repair» → ✔ Коли: V відкриває список запусків → ✔ Тоді: V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки Runs видно один рядок запуску «Apartment 12, move-in» зі статусом «in progress» і написом «Your tasks: 0 of 2 done». Запуску «Apartment 14, repair» на екрані немає, список порожній окрім цього рядка. Частина «немає «Apartment 14, repair»» оцінена як met, бо на кадрі цей текст відсутній; quoted_text порожній, як того вимагає правило для відсутнього тексту — але за схемою для цієї частини статус "met" без цитати, тож рецензент має перевірити, чи такий формат прийнятний.

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

**Агент (claude-haiku-5-5, PASS):** На кадрі видно сторінку «Apartment 12, move-in» з двома задачами в секції «Move-in day»: «Hand over the keys» (required, to do) і «Record meter readings» (optional, to do), а також «Your tasks: 0 of 2 done». Задач «Sign the lease agreement», «Inspect the apartment», «Order cleaning», панелі «Details», email q1 і прогресу «N of 5 done» на кадрі немає. У лівому нижньому куті видно обліковий запис uat-261109194829-q2@example.test; AC забороняє лише email q1, тож q2 вважаю власним обліковим записом переглядача, але сам кадр не підтверджує, що це саме V.

**Цитати агента, звірені зі сторінкою (aria):**
- «Move-in day» — є на сторінці
- «Hand over the keys» — є на сторінці
- «required» — є на сторінці
- «to do» — є на сторінці
- «Move-in day» — є на сторінці
- «Record meter readings» — є на сторінці
- «optional» — є на сторінці
- «to do» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-tasks-AC-VENDOR-04--3609b-в-і-прогресу-всього-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-tasks-AC-VENDOR-04--3609b-в-і-прогресу-всього-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-04 — …») · @login: ____

## AC-VENDOR-05 — PASS

**Тест:** AC-VENDOR-05: підрядник V позначає свою задачу 3 «to do» (не остання обов'язкова) у «Apartment 12, move-in» — задача 3 має статус «done», V бачить «Your tasks: 1 of 2 done»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-05: Given vendor V who is the assignee of task 3 with status "to do", which is not the last required task of the run "Apartment 12, move-in". When V marks task 3 as done. Then task 3 has status "done", and V sees "Your tasks: 1 of 2 done".

![Кадр «Тоді» 1](frames/AC-VENDOR-05-then-1.png)

**Кроки:** ✔ Дано: підрядник V — виконавець задачі 3 «to do», яка не є останньою обов'язковою задачею запуску «Apartment 12, move-in» → ✔ Коли: V позначає задачу 3 виконаною → ✔ Тоді: task 3 has status "done", and V sees "Your tasks: 1 of 2 done".

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png у рядку «Hand over the keys» (позначка required) видно статус «done» із зеленою позначкою. Над списком написано «Your tasks: 1 of 2 done», текст збігається з критерієм посимвольно. Частину про базу (done_by = V) не оцінював, бо вона з розділу «Не з кадрів».

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

**Агент (claude-haiku-5-5, PASS):** На кадрі в основній області видно картку «Run not found» з кнопкою «Back to runs», жодної з п'яти задач (Sign the lease agreement, Inspect the apartment, Hand over the keys, Record meter readings, Order cleaning) немає. Відсутність задач підтверджується тим, що текстів задач на кадрі не видно; для цієї частини цитата — лише видимий текст сторінки, бо самої задачі процитувати неможливо.

**Цитати агента, звірені зі сторінкою (aria):**
- «Run not found» — є на сторінці
- «Run not found» — є на сторінці
- «Back to runs» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-AC-VENDOR-06-з-49a9c-nd»-і-жодної-задачі-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-AC-VENDOR-06-з-49a9c-nd»-і-жодної-задачі-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-06 — …») · @login: ____

## AC-VENDOR-07 — PASS

**Тест:** AC-VENDOR-07: у «Apartment 12, move-in» задача 1 — на менеджері A, задачі 3 і 4 — на підряднику V; V напряму, оминаючи сторінки, позначає задачу 1 виконаною — задача 1 лишається «to do»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-07: Given the run "Apartment 12, move-in" in which task 1 is assigned to manager A and tasks 3 and 4 to vendor V. When V tries to mark task 1 as done directly, bypassing the pages of the application. Then task 1 stays "to do".

![Кадр «Тоді» 1](frames/AC-VENDOR-07-then-1.png)

**Кроки:** ✔ Дано: запуск «Apartment 12, move-in», у якому задача 1 призначена менеджеру A, а задачі 3 і 4 — підряднику V → ✔ Коли: V намагається позначити задачу 1 виконаною напряму, оминаючи сторінки застосунку (rpc complete_task від імені V) → ✔ Тоді: task 1 stays "to do".

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінка «Apartment 12, move-in» із сесією uat-261109194829-q1@example.test, у якій задача «Sign the lease agreement» має статус «to do» і кнопку «Mark as done». Лічильник «0 of 5 done» і «0/2» у блоці «Before move-in» узгоджуються з тим, що задача 1 не виконана. Ідентичність менеджера A з кадру напряму не підписана, але run manager і виконавець задачі 1 — той самий q1-акаунт, тому відповідність тлумачу як менеджер A.

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

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки /templates видно заголовок «Templates», червоне повідомлення «Not enough rights» і кнопку «Back to runs». Назв шаблонів «Apartment repair» і «Tenant move-in» на кадрі немає, тож частина про відсутність шаблонів виконана. Для цієї частини цитата порожня, бо перевіряється відсутність тексту, а не його наявність.

**Цитати агента, звірені зі сторінкою (aria):**
- «Not enough rights» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-templates-AC-VENDOR-1b4c6-h-rights»-і-жодного-шаблону-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-templates-AC-VENDOR-1b4c6-h-rights»-і-жодного-шаблону-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-08 — …») · @login: ____

## AC-VENDOR-09 — PASS

**Тест:** AC-VENDOR-09: підрядник V напряму, оминаючи сторінки, запускає «Tenant move-in» — запуск не створено, список запусків не змінився

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-09: Given vendor V signed in and the template "Tenant move-in" with current version 1. When V tries to launch this template directly, bypassing the pages of the application. Then no run is created, and the list of runs does not change.

![Кадр «Тоді» 1](frames/AC-VENDOR-09-then-1.png)

**Кроки:** ✔ Дано: підрядник V увійшов і шаблон «Tenant move-in» має поточну версію → ✔ Коли: V намагається запустити цей шаблон напряму, оминаючи сторінки застосунку (rpc launch_run від імені V) → ✔ Тоді: no run is created, and the list of runs does not change.

**Агент (claude-sonnet-5-5, PASS):** На сторінці Runs під користувачем uat-261109194829-p5@example.test список порожній, є напис «No tasks assigned to you yet.»; запуску «Apartment 12, move-in» немає. Кадра «до» немає, тому порівняння з попереднім станом спирається лише на відсутність цього запуску.

Haiku сказав NEEDS-HUMAN, тож розбір повторив Sonnet; рішення агента — за Sonnet.

**Цитати агента, звірені зі сторінкою (aria):**
- «Runs» — є на сторінці
- «No tasks assigned to you yet.» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assign-AC-VENDOR-09-9d99c-список-запусків-не-змінився-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-AC-VENDOR-09-9d99c-список-запусків-не-змінився-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-09 — …») · @login: ____

## AC-VENDOR-10 — PASS

**Тест:** AC-VENDOR-10: підрядник V без жодної задачі відкриває список запусків — бачить «No tasks assigned to you yet.» і не бачить порожньої таблиці

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-10: Given vendor V to whom no task is assigned. When V opens the list of runs. Then V sees the message "No tasks assigned to you yet." and no empty table.

![Кадр «Тоді» 1](frames/AC-VENDOR-10-then-1.png)

**Кроки:** ✔ Дано: підрядник V, якому не призначено жодної задачі → ✔ Коли: V відкриває список запусків → ✔ Тоді: V sees the message "No tasks assigned to you yet." and no empty table.

**Агент (claude-sonnet-5-5, PASS):** На сторінці Runs видно пунктирний блок із текстом «No tasks assigned to you yet.» точно як у критерії. Таблиці, заголовків стовпців чи порожніх рядків на кадрі немає.

Haiku сказав NEEDS-HUMAN, тож розбір повторив Sonnet; рішення агента — за Sonnet.

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
