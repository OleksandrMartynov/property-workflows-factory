-- impl-vendor-runs (AC-VENDOR-03, AC-VENDOR-06, AC-VENDOR-10): підрядник не читає рядки runs (вони містять назву шаблону
-- й версію, а RLS не ховає колонок); свої запуски він отримує з public.vendor_runs.

-- Менеджер і адміністратор — як і раніше; підрядник рядків runs не бачить.
alter policy runs_select_visible on public.runs
  using (
    (select auth.uid()) is not null
    and (select private.current_app_role()) is distinct from 'vendor'
    and private.can_see_run(id)
  );

-- Запуски, де викликач — виконавець хоча б однієї задачі; done і total — лише за його задачами.
-- p_run_id null — усі такі запуски, інакше лише цей. Запуск без його задач дає 0 рядків.
create function private.vendor_runs(p_run_id uuid default null)
returns table (id uuid, case_name text, status text, created_at timestamptz, done integer, total integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_role text;
begin
  select p.role into v_role from public.profiles as p where p.id = v_uid;
  if v_uid is null or v_role is null then
    return;
  end if;

  return query
  select r.id, r.case_name, r.status, r.created_at,
         (count(*) filter (where t.status = 'done'))::integer,
         count(*)::integer
  from public.runs as r
  join public.run_tasks as t on t.run_id = r.id and t.assignee_id = v_uid
  where p_run_id is null or r.id = p_run_id
  group by r.id, r.case_name, r.status, r.created_at
  order by r.created_at desc, r.id;
end;
$$;

revoke execute on function private.vendor_runs(uuid) from public, anon;
grant execute on function private.vendor_runs(uuid) to authenticated;

create function public.vendor_runs(p_run_id uuid default null)
returns table (id uuid, case_name text, status text, created_at timestamptz, done integer, total integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.id, v.case_name, v.status, v.created_at, v.done, v.total from private.vendor_runs(p_run_id) as v;
$$;

revoke execute on function public.vendor_runs(uuid) from public, anon;
grant execute on function public.vendor_runs(uuid) to authenticated;
