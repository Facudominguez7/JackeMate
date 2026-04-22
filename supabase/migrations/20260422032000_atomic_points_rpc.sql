-- Atomic points adjustment helper for `project-hygiene-supabase-boundaries`.
--
-- Why this exists:
-- - `database/queries/puntos.ts` previously used a read-modify-write cycle.
-- - Concurrent votes/comments/status changes could overwrite each other's totals.
-- - This function keeps the update atomic while remaining service-role only.

begin;

create or replace function public.adjust_profile_points_atomic(
  p_user_id uuid,
  p_delta integer,
  p_reason text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_total integer;
begin
  update public.profiles
  set puntos = greatest(coalesce(puntos, 0) + coalesce(p_delta, 0), 0)
  where id = p_user_id
  returning puntos into v_new_total;

  return v_new_total;
end;
$$;

comment on function public.adjust_profile_points_atomic(uuid, integer, text)
  is 'Adjusts profile points atomically for trusted server-side workflows; reserved p_reason supports future audit logging.';

revoke all on function public.adjust_profile_points_atomic(uuid, integer, text) from public;
revoke all on function public.adjust_profile_points_atomic(uuid, integer, text) from anon;
revoke all on function public.adjust_profile_points_atomic(uuid, integer, text) from authenticated;
grant execute on function public.adjust_profile_points_atomic(uuid, integer, text) to service_role;

commit;
