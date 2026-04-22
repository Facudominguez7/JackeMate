-- Secure vote read model + incremental RLS rollout for
-- `public.votos_no_existe` and `public.votos_reparado`.
--
-- Goals for this batch:
-- 1. Keep aggregate vote counts readable without exposing voter identity.
-- 2. Restrict row reads to the authenticated voter who owns the row.
-- 3. Allow authenticated users to insert only their own vote.
-- 4. Prevent duplicate votes per user/report pair.

begin;

create schema if not exists private;

create table if not exists public.reportes_vote_summary (
  reporte_id bigint primary key references public.reportes(id) on delete cascade,
  votos_no_existe_count integer not null default 0,
  votos_reparado_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.reportes_vote_summary is
  'Aggregate-only vote read model for report detail surfaces. Keeps counts readable without exposing voter identities.';

create unique index if not exists idx_votos_no_existe_unique_vote
  on public.votos_no_existe (reporte_id, usuario_id);

create unique index if not exists idx_votos_reparado_unique_vote
  on public.votos_reparado (reporte_id, usuario_id);

insert into public.reportes_vote_summary (
  reporte_id,
  votos_no_existe_count,
  votos_reparado_count
)
select
  reportes.id as reporte_id,
  coalesce(votos_no_existe.count, 0)::integer as votos_no_existe_count,
  coalesce(votos_reparado.count, 0)::integer as votos_reparado_count
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

create or replace function private.sync_report_vote_summary()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.reportes_vote_summary (
      reporte_id,
      votos_no_existe_count,
      votos_reparado_count,
      updated_at
    )
    values (
      new.reporte_id,
      case when tg_table_name = 'votos_no_existe' then 1 else 0 end,
      case when tg_table_name = 'votos_reparado' then 1 else 0 end,
      timezone('utc'::text, now())
    )
    on conflict (reporte_id) do update
    set
      votos_no_existe_count = public.reportes_vote_summary.votos_no_existe_count
        + case when tg_table_name = 'votos_no_existe' then 1 else 0 end,
      votos_reparado_count = public.reportes_vote_summary.votos_reparado_count
        + case when tg_table_name = 'votos_reparado' then 1 else 0 end,
      updated_at = timezone('utc'::text, now());

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.reportes_vote_summary
    set
      votos_no_existe_count = greatest(
        0,
        votos_no_existe_count - case when tg_table_name = 'votos_no_existe' then 1 else 0 end
      ),
      votos_reparado_count = greatest(
        0,
        votos_reparado_count - case when tg_table_name = 'votos_reparado' then 1 else 0 end
      ),
      updated_at = timezone('utc'::text, now())
    where reporte_id = old.reporte_id;

    return old;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.sync_report_vote_summary() from public, anon, authenticated;

drop trigger if exists sync_reportes_vote_summary_on_votos_no_existe on public.votos_no_existe;
create trigger sync_reportes_vote_summary_on_votos_no_existe
after insert or delete on public.votos_no_existe
for each row
execute function private.sync_report_vote_summary();

drop trigger if exists sync_reportes_vote_summary_on_votos_reparado on public.votos_reparado;
create trigger sync_reportes_vote_summary_on_votos_reparado
after insert or delete on public.votos_reparado
for each row
execute function private.sync_report_vote_summary();

grant select on table public.reportes_vote_summary to anon, authenticated;

alter table public.reportes_vote_summary enable row level security;
alter table public.votos_no_existe enable row level security;
alter table public.votos_reparado enable row level security;

drop policy if exists "reportes_vote_summary_visible_read" on public.reportes_vote_summary;
drop policy if exists "votos_no_existe_owner_read" on public.votos_no_existe;
drop policy if exists "votos_no_existe_owner_insert" on public.votos_no_existe;
drop policy if exists "votos_reparado_owner_read" on public.votos_reparado;
drop policy if exists "votos_reparado_owner_insert" on public.votos_reparado;

create policy "reportes_vote_summary_visible_read"
on public.reportes_vote_summary
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.reportes
    where reportes.id = reportes_vote_summary.reporte_id
      and reportes.deleted_at is null
  )
);

create policy "votos_no_existe_owner_read"
on public.votos_no_existe
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = usuario_id
);

create policy "votos_no_existe_owner_insert"
on public.votos_no_existe
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = usuario_id
);

create policy "votos_reparado_owner_read"
on public.votos_reparado
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = usuario_id
);

create policy "votos_reparado_owner_insert"
on public.votos_reparado
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = usuario_id
);

commit;
