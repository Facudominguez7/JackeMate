-- Permite al server action de login distinguir "credenciales inválidas" de "email sin confirmar"
-- después de que signInWithPassword falle. Solo ejecutable por service_role para evitar
-- enumeración de cuentas desde el cliente.

begin;

create or replace function public.estado_confirmacion_email(email_input text)
returns table(existe boolean, email_confirmado boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select
    true,
    (email_confirmed_at is not null)
  from auth.users
  where lower(email) = lower(email_input)
  limit 1;

  if not found then
    return query select false, false;
  end if;
end;
$$;

revoke all on function public.estado_confirmacion_email(text) from public, anon, authenticated;
grant execute on function public.estado_confirmacion_email(text) to service_role;

commit;
