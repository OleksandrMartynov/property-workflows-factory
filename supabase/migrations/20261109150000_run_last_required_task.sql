-- impl-vendor-last-required (AC-VENDOR-05): «остання обов'язкова задача» рахується за всіма задачами запуску, а не лише
-- за задачами підрядника (RLS ховає решту). Функція віддає лише id, тож нічого зайвого підрядник не бачить.

create function private.run_last_required_task(p_run_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_role text;
  v_id   uuid;
  v_open integer;
  v_assignee uuid;
begin
  if v_uid is null or not private.can_see_run(p_run_id) then
    return null;
  end if;

  select count(*), (array_agg(t.id))[1], (array_agg(t.assignee_id))[1]
    into v_open, v_id, v_assignee
  from public.run_tasks as t
  where t.run_id = p_run_id and t.required and t.status <> 'done';

  if v_open <> 1 then
    return null;
  end if;

  select p.role into v_role from public.profiles as p where p.id = v_uid;
  if v_role = 'vendor' and v_assignee is distinct from v_uid then
    return null;
  end if;

  return v_id;
end;
$$;

revoke execute on function private.run_last_required_task(uuid) from public, anon;
grant execute on function private.run_last_required_task(uuid) to authenticated;

create function public.run_last_required_task(p_run_id uuid)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select private.run_last_required_task(p_run_id);
$$;

revoke execute on function public.run_last_required_task(uuid) from public, anon;
grant execute on function public.run_last_required_task(uuid) to authenticated;
