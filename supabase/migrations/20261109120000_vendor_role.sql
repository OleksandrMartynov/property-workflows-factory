-- Підрядник (Vendor), зріз 3, задача 1 (openspec/changes/impl-vendor, design.md): нова роль і призначення підрядника
-- виконавцем задач запуску.
-- AC: AC-VENDOR-01, AC-VENDOR-02, AC-VENDOR-09.
--
-- Застосованих міграцій не змінюємо: alter / create or replace. Запускає шаблон лише manager чи admin; підрядник
-- може бути лише виконавцем.

-- ── Роль vendor ───────────────────────────────────────────────────────────────────
-- Значення за замовчуванням колонки role (manager) лишається.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('manager', 'admin', 'vendor'));

-- ── Запуск: виконавцем може бути manager, admin або vendor (AC-VENDOR-01, AC-VENDOR-09) ──
create or replace function private.launch_run(p_template_id uuid, p_case_name text, p_assignees jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid          uuid := (select auth.uid());
  v_role         text;
  v_case_name    text;
  v_template     public.templates;
  v_version_id   uuid;
  v_version_name text;
  v_run_id       uuid;
  v_assignees    jsonb := coalesce(p_assignees, '{}'::jsonb);
  v_valid        jsonb := '{}'::jsonb;
  v_item         record;
begin
  select p.role into v_role from public.profiles as p where p.id = v_uid;
  -- Матриця прав «Launch a template»: лише manager і admin; підрядник запускати не може (AC-VENDOR-09).
  if v_uid is null or v_role is null or v_role not in ('manager', 'admin') then
    raise exception 'LAUNCH_NOT_ALLOWED';
  end if;

  -- AC-RUN-03, AC-RUN-07, AC-RUN-11: назва без пробілів на краях, 1–100 символів.
  v_case_name := regexp_replace(coalesce(p_case_name, ''), '^\s+|\s+$', '', 'g');
  if v_case_name = '' then
    raise exception 'CASE_NAME_REQUIRED';
  end if;
  if char_length(v_case_name) > 100 then
    raise exception 'CASE_NAME_TOO_LONG';
  end if;

  select * into v_template from public.templates as t where t.id = p_template_id for share;
  if v_template.id is null then
    raise exception 'TEMPLATE_NOT_FOUND';
  end if;
  -- Запуск ніколи не створюється з незбережених змін (глосарій PM; робоче припущення #21).
  if v_template.current_version is null then
    raise exception 'TEMPLATE_NOT_PUBLISHED';
  end if;

  select v.id, v.name into v_version_id, v_version_name
  from public.template_versions as v
  where v.template_id = p_template_id and v.number = v_template.current_version;
  if not exists (select 1 from public.template_version_tasks as vt where vt.version_id = v_version_id) then
    raise exception 'TEMPLATE_EMPTY';
  end if;

  -- AC-RUN-04, AC-VENDOR-01: виконавець задачі поточної версії — manager, admin або vendor; ключ не з цієї версії
  -- відкидаємо (PM #9).
  if jsonb_typeof(v_assignees) <> 'object' then
    raise exception 'INVALID_ASSIGNEE';
  end if;
  for v_item in select key, value from jsonb_each_text(v_assignees) loop
    if not exists (
      select 1 from public.template_version_tasks as vt
      where vt.version_id = v_version_id and vt.template_task_id::text = v_item.key
    ) then
      continue;
    end if;
    if not exists (
      select 1 from public.profiles as p
      where p.id::text = v_item.value and p.role in ('manager', 'admin', 'vendor')
    ) then
      raise exception 'INVALID_ASSIGNEE';
    end if;
    v_valid := v_valid || jsonb_build_object(v_item.key, v_item.value);
  end loop;

  -- AC-RUN-01, AC-RUN-05, AC-RUN-06, AC-EDITOR-06: один запуск «in progress» з номером поточної версії.
  insert into public.runs (template_id, template_name, template_version, case_name, run_manager_id)
  values (p_template_id, v_version_name, v_template.current_version, v_case_name, v_uid)
  returning id into v_run_id;

  -- AC-RUN-01, AC-RUN-02, AC-RUN-08, AC-RUN-09, AC-RUN-12: копія всіх задач і секцій версії «to do»; без перевіреного
  -- призначення — менеджер запуску.
  insert into public.run_tasks
    (run_id, template_task_id, section_name, section_position, position, name, required, assignee_id)
  select v_run_id, vt.template_task_id, vt.section_name, vt.section_position, vt.position, vt.name, vt.required,
         coalesce((v_valid ->> vt.template_task_id::text)::uuid, v_uid)
  from public.template_version_tasks as vt
  where vt.version_id = v_version_id;

  return v_run_id;
end;
$$;

revoke execute on function private.launch_run(uuid, text, jsonb) from public, anon;
grant execute on function private.launch_run(uuid, text, jsonb) to authenticated;

-- ── Кого можна призначити виконавцем (AC-VENDOR-02) ───────────────────────────────
-- Manager чи admin бачить id і email менеджерів, адміністраторів і підрядників; підрядник — нікого.
create or replace function private.list_assignable_users()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.email
  from public.profiles as p
  where (select private.current_app_role()) in ('manager', 'admin')
    and p.role in ('manager', 'admin', 'vendor')
  order by p.email;
$$;

revoke execute on function private.list_assignable_users() from public, anon;
grant execute on function private.list_assignable_users() to authenticated;
