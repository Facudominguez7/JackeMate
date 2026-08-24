-- Alta del rol OPERADOR (id 4) en el catálogo `public.roles`.
begin;

insert into public.roles (id, nombre)
values (4, 'operador')
on conflict (id) do nothing;

-- Resincroniza la secuencia porque el insert con id explícito no la avanza.
do $$
declare
  v_secuencia text := pg_get_serial_sequence('public.roles', 'id');
begin
  if v_secuencia is not null then
    perform setval(v_secuencia, greatest(coalesce((select max(id) from public.roles), 1), 1), true);
  end if;
end;
$$;

comment on table public.roles is
  'Catálogo de roles de la aplicación. 1=admin, 2=ciudadano, 3=interesado, 4=operador municipal.';

commit;
