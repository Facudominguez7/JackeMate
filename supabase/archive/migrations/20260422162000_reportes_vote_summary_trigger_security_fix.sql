-- Correct trigger execution security for `public.reportes_vote_summary` maintenance.
--
-- Root cause:
-- The trigger functions live in the non-exposed `private` schema, but they were
-- created as SECURITY INVOKER. When `service_role` / `authenticated` writes fired
-- the triggers, the inner function call to `private.refresh_report_vote_summary_row`
-- resolved with caller privileges and failed with:
--   permission denied for schema private
--
-- Fix:
-- - keep the functions in `private`
-- - switch them to SECURITY DEFINER
-- - pin a safe search_path
-- - keep execute revoked from anon/authenticated/public
-- - re-sync the read model after the function replacement

begin;

create schema if not exists private;

create or replace function private.refresh_report_vote_summary_row(target_reporte_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.reportes
    where id = target_reporte_id
      and deleted_at is null
  ) then
    insert into public.reportes_vote_summary (
      reporte_id,
      votos_no_existe_count,
      votos_reparado_count,
      updated_at
    )
    select
      reportes.id,
      coalesce(votos_no_existe.count, 0)::integer,
      coalesce(votos_reparado.count, 0)::integer,
      timezone('utc'::text, now())
    from public.reportes
    left join (
      select
        reporte_id,
        count(*) as count
      from public.votos_no_existe
      group by reporte_id
    ) as votos_no_existe
      on votos_no_existe.reporte_id = reportes.id
    left join (
      select
        reporte_id,
        count(*) as count
      from public.votos_reparado
      group by reporte_id
    ) as votos_reparado
      on votos_reparado.reporte_id = reportes.id
    where reportes.id = target_reporte_id
      and reportes.deleted_at is null
    on conflict (reporte_id) do update
    set
      votos_no_existe_count = excluded.votos_no_existe_count,
      votos_reparado_count = excluded.votos_reparado_count,
      updated_at = timezone('utc'::text, now());
  else
    delete from public.reportes_vote_summary
    where reporte_id = target_reporte_id;
  end if;
end;
$$;

revoke all on function private.refresh_report_vote_summary_row(bigint) from public, anon, authenticated;

create or replace function private.sync_report_vote_summary()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform private.refresh_report_vote_summary_row(coalesce(new.reporte_id, old.reporte_id));
  return coalesce(new, old);
end;
$$;

revoke all on function private.sync_report_vote_summary() from public, anon, authenticated;

create or replace function private.sync_report_vote_summary_from_reportes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform private.refresh_report_vote_summary_row(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

revoke all on function private.sync_report_vote_summary_from_reportes() from public, anon, authenticated;

insert into public.reportes_vote_summary (
  reporte_id,
  votos_no_existe_count,
  votos_reparado_count,
  updated_at
)
select
  reportes.id as reporte_id,
  coalesce(votos_no_existe.count, 0)::integer as votos_no_existe_count,
  coalesce(votos_reparado.count, 0)::integer as votos_reparado_count,
  timezone('utc'::text, now())
from public.reportes
left join (
  select
    reporte_id,
    count(*) as count
  from public.votos_no_existe
  group by reporte_id
) as votos_no_existe
  on votos_no_existe.reporte_id = reportes.id
left join (
  select
    reporte_id,
    count(*) as count
  from public.votos_reparado
  group by reporte_id
) as votos_reparado
  on votos_reparado.reporte_id = reportes.id
where reportes.deleted_at is null
on conflict (reporte_id) do update
set
  votos_no_existe_count = excluded.votos_no_existe_count,
  votos_reparado_count = excluded.votos_reparado_count,
  updated_at = timezone('utc'::text, now());

delete from public.reportes_vote_summary
where not exists (
  select 1
  from public.reportes
  where reportes.id = reportes_vote_summary.reporte_id
    and reportes.deleted_at is null
);

commit;
