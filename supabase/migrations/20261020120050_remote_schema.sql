


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."refresh_report_vote_summary_row"("target_reporte_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "private"."refresh_report_vote_summary_row"("target_reporte_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sync_profile_from_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'private'
    AS $$
begin
  insert into public.profiles (id, email, rol_id)
  values (
    new.id,
    new.email,
    case when coalesce(new.is_anonymous, false) then 5 else 2 end
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    rol_id = case
      when public.profiles.rol_id = 5 and not coalesce(new.is_anonymous, false) then 2
      else public.profiles.rol_id
    end;

  return new;
end;
$$;


ALTER FUNCTION "private"."sync_profile_from_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sync_report_vote_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  perform private.refresh_report_vote_summary_row(coalesce(new.reporte_id, old.reporte_id));
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "private"."sync_report_vote_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sync_report_vote_summary_from_reportes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  perform private.refresh_report_vote_summary_row(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "private"."sync_report_vote_summary_from_reportes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_profile_points_atomic"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_new_total integer;
begin
  update public.profiles
  set puntos = greatest(coalesce(puntos, 0) + coalesce(p_delta, 0), 0)
  where id = p_user_id
    and rol_id is distinct from 5
  returning puntos into v_new_total;

  if not found then
    select coalesce(puntos, 0) into v_new_total
    from public.profiles
    where id = p_user_id;
  end if;

  return v_new_total;
end;
$$;


ALTER FUNCTION "public"."adjust_profile_points_atomic"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."adjust_profile_points_atomic"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text") IS 'Adjusts profile points atomically for trusted server-side workflows; reserved p_reason supports future audit logging.';



CREATE OR REPLACE FUNCTION "public"."claim_report_submission"("p_submission_id" "uuid", "p_actor_id" "uuid", "p_ip_hash" "text", "p_actor_window_seconds" integer, "p_actor_max" integer, "p_ip_window_seconds" integer, "p_ip_max" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('report_submission:ip:' || p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('report_submission:actor:' || p_actor_id::text, 0));

  if exists (
    select 1 from public.report_submission_attempts where submission_id = p_submission_id
  ) then
    return 'duplicate';
  end if;

  delete from public.report_submission_attempts
  where (actor_id = p_actor_id or ip_hash = p_ip_hash)
    and created_at < now() - interval '2 days';

  select count(*) into v_count
  from public.report_submission_attempts
  where actor_id = p_actor_id
    and created_at > now() - make_interval(secs => p_actor_window_seconds);

  if v_count >= p_actor_max then
    return 'actor_limited';
  end if;

  select count(*) into v_count
  from public.report_submission_attempts
  where ip_hash = p_ip_hash
    and created_at > now() - make_interval(secs => p_ip_window_seconds);

  if v_count >= p_ip_max then
    return 'ip_limited';
  end if;

  insert into public.report_submission_attempts (submission_id, actor_id, ip_hash)
  values (p_submission_id, p_actor_id, p_ip_hash);

  return 'ok';
end;
$$;


ALTER FUNCTION "public"."claim_report_submission"("p_submission_id" "uuid", "p_actor_id" "uuid", "p_ip_hash" "text", "p_actor_window_seconds" integer, "p_actor_max" integer, "p_ip_window_seconds" integer, "p_ip_max" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estado_confirmacion_email"("email_input" "text") RETURNS TABLE("existe" boolean, "email_confirmado" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
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


ALTER FUNCTION "public"."estado_confirmacion_email"("email_input" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."asignaciones_cuadrilla" (
    "id" bigint NOT NULL,
    "reporte_id" bigint NOT NULL,
    "cuadrilla_id" bigint NOT NULL,
    "asignada_por" "uuid",
    "estado_operativo" "text" DEFAULT 'en_progreso'::"text" NOT NULL,
    "motivo_cierre" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cerrada_at" timestamp with time zone,
    CONSTRAINT "chk_asignacion_cerrada_at_coherente" CHECK ((("estado_operativo" = 'cerrada'::"text") = ("cerrada_at" IS NOT NULL))),
    CONSTRAINT "chk_asignacion_cierre_coherente" CHECK ((("estado_operativo" = 'cerrada'::"text") = ("motivo_cierre" IS NOT NULL))),
    CONSTRAINT "chk_asignacion_estado_operativo" CHECK (("estado_operativo" = ANY (ARRAY['en_progreso'::"text", 'cerrada'::"text"]))),
    CONSTRAINT "chk_asignacion_motivo_cierre" CHECK ((("motivo_cierre" IS NULL) OR ("motivo_cierre" = ANY (ARRAY['cancelada'::"text", 'reasignada'::"text", 'reparado'::"text", 'rechazado'::"text"]))))
);


ALTER TABLE "public"."asignaciones_cuadrilla" OWNER TO "postgres";


COMMENT ON TABLE "public"."asignaciones_cuadrilla" IS 'Asignación de una cuadrilla a un reporte y su ciclo de vida operativo (asignada -> en_revision/en_progreso -> cerrada). A lo sumo una asignación abierta por reporte (ver idx_asignaciones_cuadrilla_activa_por_reporte).';



COMMENT ON COLUMN "public"."asignaciones_cuadrilla"."estado_operativo" IS 'Estado operativo de la intervencion: en_progreso (cuadrilla a cargo) o cerrada (termino). Es independiente de reportes.estado_id, que sigue siendo administrativo y solo lo cambia ADMIN. El indice idx_asignaciones_cuadrilla_activa_por_reporte usa <> cerrada, asi que sigue siendo estable frente a este cambio de dominio.';



COMMENT ON COLUMN "public"."asignaciones_cuadrilla"."motivo_cierre" IS 'Motivo de cierre de la asignacion. reparado y rechazado resuelven el reporte y propagan a reportes.estado_id (con puntos y correo al ciudadano); cancelada y reasignada cierran solo la intervencion y nunca tocan el estado del reporte.';



ALTER TABLE "public"."asignaciones_cuadrilla" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."asignaciones_cuadrilla_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorias_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categorias_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorias_id_seq" OWNED BY "public"."categorias"."id";



CREATE TABLE IF NOT EXISTS "public"."comentarios_reporte" (
    "id" bigint NOT NULL,
    "reporte_id" bigint NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "contenido" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."comentarios_reporte" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."comentarios_reporte_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."comentarios_reporte_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."comentarios_reporte_id_seq" OWNED BY "public"."comentarios_reporte"."id";



CREATE TABLE IF NOT EXISTS "public"."cuadrillas" (
    "id" bigint NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "telefono" "text",
    "activa" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_cuadrillas_descripcion" CHECK ((("descripcion" IS NULL) OR ("char_length"("descripcion") <= 500))),
    CONSTRAINT "chk_cuadrillas_nombre" CHECK ((("char_length"("btrim"("nombre")) >= 3) AND ("char_length"("btrim"("nombre")) <= 120))),
    CONSTRAINT "chk_cuadrillas_telefono" CHECK ((("telefono" IS NULL) OR (("char_length"("btrim"("telefono")) >= 1) AND ("char_length"("btrim"("telefono")) <= 40))))
);


ALTER TABLE "public"."cuadrillas" OWNER TO "postgres";


COMMENT ON TABLE "public"."cuadrillas" IS 'Catálogo de cuadrillas municipales que pueden ser asignadas a reportes para su intervención en campo.';



ALTER TABLE "public"."cuadrillas" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cuadrillas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."estados" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."estados" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."estados_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."estados_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."estados_id_seq" OWNED BY "public"."estados"."id";



CREATE TABLE IF NOT EXISTS "public"."fotos_reporte" (
    "id" bigint NOT NULL,
    "reporte_id" bigint,
    "url" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "bucket" "text",
    "path" "text",
    "thumbnail_url" "text",
    "thumbnail_bucket" "text",
    "thumbnail_path" "text"
);


ALTER TABLE "public"."fotos_reporte" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fotos_reporte"."bucket" IS 'Canonical Supabase Storage bucket for the report image. Legacy url reads remain during the transition.';



COMMENT ON COLUMN "public"."fotos_reporte"."path" IS 'Canonical Supabase Storage object path for the report image. Populated by upload dual-write and resumable backfill.';



COMMENT ON COLUMN "public"."fotos_reporte"."thumbnail_url" IS 'Backward-compatible public thumbnail URL for compact report cards while canonical storage references roll out.';



COMMENT ON COLUMN "public"."fotos_reporte"."thumbnail_bucket" IS 'Canonical Supabase Storage bucket for the compact report thumbnail.';



COMMENT ON COLUMN "public"."fotos_reporte"."thumbnail_path" IS 'Canonical Supabase Storage object path for the compact report thumbnail.';



CREATE SEQUENCE IF NOT EXISTS "public"."fotos_reporte_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fotos_reporte_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fotos_reporte_id_seq" OWNED BY "public"."fotos_reporte"."id";



CREATE TABLE IF NOT EXISTS "public"."historial_estados" (
    "id" bigint NOT NULL,
    "reporte_id" bigint NOT NULL,
    "estado_anterior_id" integer,
    "estado_nuevo_id" integer NOT NULL,
    "usuario_id" "uuid",
    "comentario" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historial_estados" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."historial_estados_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."historial_estados_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."historial_estados_id_seq" OWNED BY "public"."historial_estados"."id";



CREATE TABLE IF NOT EXISTS "public"."observaciones_cuadrilla" (
    "id" bigint NOT NULL,
    "asignacion_id" bigint NOT NULL,
    "autor_id" "uuid",
    "contenido" "text" NOT NULL,
    "observacion_publica" boolean DEFAULT false NOT NULL,
    "estado_operativo_resultante" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_observacion_contenido" CHECK ((("char_length"("btrim"("contenido")) >= 1) AND ("char_length"("btrim"("contenido")) <= 1000))),
    CONSTRAINT "chk_observacion_estado_resultante" CHECK ((("estado_operativo_resultante" IS NULL) OR ("estado_operativo_resultante" = ANY (ARRAY['en_progreso'::"text", 'cerrada'::"text"]))))
);


ALTER TABLE "public"."observaciones_cuadrilla" OWNER TO "postgres";


COMMENT ON TABLE "public"."observaciones_cuadrilla" IS 'Bitácora de observaciones de seguimiento sobre una asignación de cuadrilla, con visibilidad opcional al público.';



COMMENT ON COLUMN "public"."observaciones_cuadrilla"."observacion_publica" IS 'Indica si la observación es visible en la proyección pública de línea de tiempo operativa del reporte.';



ALTER TABLE "public"."observaciones_cuadrilla" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."observaciones_cuadrilla_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."prioridades" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."prioridades" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."prioridades_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."prioridades_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."prioridades_id_seq" OWNED BY "public"."prioridades"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "rol_id" integer DEFAULT 2,
    "puntos" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles" WITH ("security_invoker"='false') AS
 SELECT "id",
    "username",
    "rol_id",
    "puntos",
    "created_at",
    (NOT ("rol_id" IS DISTINCT FROM 5)) AS "es_invitado"
   FROM "public"."profiles";


ALTER VIEW "public"."public_profiles" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_profiles" IS 'Safe public profile projection for shared identity surfaces. Excludes private columns like email and remains readable for public ranking, comments, and report authors.';



CREATE TABLE IF NOT EXISTS "public"."report_submission_attempts" (
    "id" bigint NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "ip_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."report_submission_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."report_submission_attempts" IS 'Server-only ledger of report submissions used for rate limiting (actor + hashed IP) and duplicate prevention. No client access.';



ALTER TABLE "public"."report_submission_attempts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."report_submission_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."reportes" (
    "id" bigint NOT NULL,
    "usuario_id" "uuid",
    "titulo" "text" NOT NULL,
    "descripcion" "text",
    "categoria_id" integer,
    "prioridad_id" integer,
    "estado_id" integer DEFAULT 1,
    "lat" double precision NOT NULL,
    "lon" double precision NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."reportes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."reportes_estado_operativo_publico" WITH ("security_invoker"='false') AS
 SELECT "a"."reporte_id",
    "a"."estado_operativo",
    "c"."nombre" AS "cuadrilla_nombre",
    "a"."updated_at" AS "actualizado_at"
   FROM (("public"."asignaciones_cuadrilla" "a"
     JOIN "public"."cuadrillas" "c" ON (("c"."id" = "a"."cuadrilla_id")))
     JOIN "public"."reportes" "r" ON (("r"."id" = "a"."reporte_id")))
  WHERE (("a"."estado_operativo" <> 'cerrada'::"text") AND ("r"."deleted_at" IS NULL) AND ("r"."estado_id" = 1));


ALTER VIEW "public"."reportes_estado_operativo_publico" OWNER TO "postgres";


COMMENT ON VIEW "public"."reportes_estado_operativo_publico" IS 'Proyeccion publica segura del estado operativo vigente de un reporte: expone solo reporte_id, estado_operativo, cuadrilla_nombre y actualizado_at (allowlist de columnas), nunca las tablas base. security_invoker = false es obligatorio porque asignaciones_cuadrilla/cuadrillas son staff-only bajo RLS: con true esta vista devolveria cero filas para ciudadanos y visitantes anonimos. La seguridad viene de la allowlist de columnas y del filtro r.estado_id = 1, no del RLS del invocador. El filtro r.estado_id = 1 garantiza que un reporte ya cerrado administrativamente nunca muestre un chip operativo desactualizado.';



CREATE SEQUENCE IF NOT EXISTS "public"."reportes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reportes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reportes_id_seq" OWNED BY "public"."reportes"."id";



CREATE OR REPLACE VIEW "public"."reportes_linea_tiempo_operativa_publica" WITH ("security_invoker"='false') AS
 SELECT "a"."reporte_id",
    'asignacion'::"text" AS "tipo_evento",
    "a"."created_at" AS "ocurrido_at",
    "c"."nombre" AS "cuadrilla_nombre",
    "a"."estado_operativo",
    NULL::"text" AS "motivo_cierre",
    NULL::"text" AS "contenido"
   FROM (("public"."asignaciones_cuadrilla" "a"
     JOIN "public"."cuadrillas" "c" ON (("c"."id" = "a"."cuadrilla_id")))
     JOIN "public"."reportes" "r" ON (("r"."id" = "a"."reporte_id")))
  WHERE ("r"."deleted_at" IS NULL)
UNION ALL
 SELECT "a"."reporte_id",
    'cierre'::"text" AS "tipo_evento",
    "a"."cerrada_at" AS "ocurrido_at",
    "c"."nombre" AS "cuadrilla_nombre",
    "a"."estado_operativo",
    "a"."motivo_cierre",
    NULL::"text" AS "contenido"
   FROM (("public"."asignaciones_cuadrilla" "a"
     JOIN "public"."cuadrillas" "c" ON (("c"."id" = "a"."cuadrilla_id")))
     JOIN "public"."reportes" "r" ON (("r"."id" = "a"."reporte_id")))
  WHERE (("r"."deleted_at" IS NULL) AND ("a"."cerrada_at" IS NOT NULL))
UNION ALL
 SELECT "a"."reporte_id",
    'observacion'::"text" AS "tipo_evento",
    "o"."created_at" AS "ocurrido_at",
    "c"."nombre" AS "cuadrilla_nombre",
    COALESCE("o"."estado_operativo_resultante", "a"."estado_operativo") AS "estado_operativo",
    NULL::"text" AS "motivo_cierre",
    "o"."contenido"
   FROM ((("public"."observaciones_cuadrilla" "o"
     JOIN "public"."asignaciones_cuadrilla" "a" ON (("a"."id" = "o"."asignacion_id")))
     JOIN "public"."cuadrillas" "c" ON (("c"."id" = "a"."cuadrilla_id")))
     JOIN "public"."reportes" "r" ON (("r"."id" = "a"."reporte_id")))
  WHERE (("r"."deleted_at" IS NULL) AND "o"."observacion_publica");


ALTER VIEW "public"."reportes_linea_tiempo_operativa_publica" OWNER TO "postgres";


COMMENT ON VIEW "public"."reportes_linea_tiempo_operativa_publica" IS 'Proyeccion publica segura de la linea de tiempo operativa de un reporte (asignacion, cierre, observaciones publicas): expone solo reporte_id, tipo_evento, ocurrido_at, cuadrilla_nombre, estado_operativo, motivo_cierre y contenido (allowlist de columnas), nunca las tablas base. security_invoker = false es obligatorio porque las tablas base son staff-only bajo RLS. La seguridad viene de la allowlist de columnas y del filtro observacion_publica sobre observaciones, no del RLS del invocador.';



CREATE TABLE IF NOT EXISTS "public"."reportes_vote_summary" (
    "reporte_id" bigint NOT NULL,
    "votos_no_existe_count" integer DEFAULT 0 NOT NULL,
    "votos_reparado_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."reportes_vote_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."reportes_vote_summary" IS 'Aggregate-only vote read model for report detail surfaces. Keeps counts readable without exposing voter identities.';



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."roles" IS 'Catálogo de roles de la aplicación. 1=admin, 2=ciudadano, 3=interesado, 4=operador municipal.';



CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE TABLE IF NOT EXISTS "public"."votos_no_existe" (
    "id" bigint NOT NULL,
    "reporte_id" bigint,
    "usuario_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."votos_no_existe" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."votos_no_existe_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."votos_no_existe_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."votos_no_existe_id_seq" OWNED BY "public"."votos_no_existe"."id";



CREATE TABLE IF NOT EXISTS "public"."votos_reparado" (
    "id" bigint NOT NULL,
    "reporte_id" bigint NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votos_reparado" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."votos_reparado_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."votos_reparado_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."votos_reparado_id_seq" OWNED BY "public"."votos_reparado"."id";



ALTER TABLE ONLY "public"."categorias" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categorias_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."comentarios_reporte" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."comentarios_reporte_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."estados" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."estados_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fotos_reporte" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fotos_reporte_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."historial_estados" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."historial_estados_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."prioridades" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prioridades_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."reportes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reportes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."votos_no_existe" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."votos_no_existe_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."votos_reparado" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."votos_reparado_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."asignaciones_cuadrilla"
    ADD CONSTRAINT "asignaciones_cuadrilla_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comentarios_reporte"
    ADD CONSTRAINT "comentarios_reporte_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cuadrillas"
    ADD CONSTRAINT "cuadrillas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estados"
    ADD CONSTRAINT "estados_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."estados"
    ADD CONSTRAINT "estados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fotos_reporte"
    ADD CONSTRAINT "fotos_reporte_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historial_estados"
    ADD CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."observaciones_cuadrilla"
    ADD CONSTRAINT "observaciones_cuadrilla_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prioridades"
    ADD CONSTRAINT "prioridades_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."prioridades"
    ADD CONSTRAINT "prioridades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."report_submission_attempts"
    ADD CONSTRAINT "report_submission_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_submission_attempts"
    ADD CONSTRAINT "report_submission_attempts_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reportes_vote_summary"
    ADD CONSTRAINT "reportes_vote_summary_pkey" PRIMARY KEY ("reporte_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votos_no_existe"
    ADD CONSTRAINT "votos_no_existe_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votos_no_existe"
    ADD CONSTRAINT "votos_no_existe_reporte_id_usuario_id_key" UNIQUE ("reporte_id", "usuario_id");



ALTER TABLE ONLY "public"."votos_reparado"
    ADD CONSTRAINT "votos_reparado_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votos_reparado"
    ADD CONSTRAINT "votos_reparado_unique" UNIQUE ("reporte_id", "usuario_id");



CREATE UNIQUE INDEX "idx_asignaciones_cuadrilla_activa_por_reporte" ON "public"."asignaciones_cuadrilla" USING "btree" ("reporte_id") WHERE ("estado_operativo" <> 'cerrada'::"text");



CREATE INDEX "idx_asignaciones_cuadrilla_asignada_por" ON "public"."asignaciones_cuadrilla" USING "btree" ("asignada_por") WHERE ("asignada_por" IS NOT NULL);



CREATE INDEX "idx_asignaciones_cuadrilla_cuadrilla_id" ON "public"."asignaciones_cuadrilla" USING "btree" ("cuadrilla_id");



CREATE UNIQUE INDEX "idx_asignaciones_cuadrilla_ocupada" ON "public"."asignaciones_cuadrilla" USING "btree" ("cuadrilla_id") WHERE ("estado_operativo" <> 'cerrada'::"text");



COMMENT ON INDEX "public"."idx_asignaciones_cuadrilla_ocupada" IS 'A lo sumo una asignacion abierta por cuadrilla: una cuadrilla trabaja en un reporte a la vez. Espejo de idx_asignaciones_cuadrilla_activa_por_reporte, que impone lo mismo del lado del reporte.';



CREATE INDEX "idx_asignaciones_cuadrilla_reporte_id" ON "public"."asignaciones_cuadrilla" USING "btree" ("reporte_id");



CREATE INDEX "idx_comentarios_reporte_created_at" ON "public"."comentarios_reporte" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comentarios_reporte_deleted_at" ON "public"."comentarios_reporte" USING "btree" ("deleted_at");



CREATE INDEX "idx_comentarios_reporte_reporte_id" ON "public"."comentarios_reporte" USING "btree" ("reporte_id");



CREATE INDEX "idx_comentarios_reporte_usuario_id" ON "public"."comentarios_reporte" USING "btree" ("usuario_id");



CREATE INDEX "idx_cuadrillas_activas" ON "public"."cuadrillas" USING "btree" ("nombre") WHERE "activa";



CREATE UNIQUE INDEX "idx_cuadrillas_nombre_unico" ON "public"."cuadrillas" USING "btree" ("lower"("btrim"("nombre")));



CREATE INDEX "idx_fotos_reporte_bucket_path" ON "public"."fotos_reporte" USING "btree" ("bucket", "path") WHERE (("bucket" IS NOT NULL) AND ("path" IS NOT NULL));



CREATE INDEX "idx_fotos_reporte_reporte_id" ON "public"."fotos_reporte" USING "btree" ("reporte_id");



CREATE INDEX "idx_fotos_reporte_thumbnail_bucket_path" ON "public"."fotos_reporte" USING "btree" ("thumbnail_bucket", "thumbnail_path") WHERE (("thumbnail_bucket" IS NOT NULL) AND ("thumbnail_path" IS NOT NULL));



CREATE INDEX "idx_historial_estados_created_at" ON "public"."historial_estados" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_historial_estados_estado_anterior_id" ON "public"."historial_estados" USING "btree" ("estado_anterior_id");



CREATE INDEX "idx_historial_estados_estado_nuevo_id" ON "public"."historial_estados" USING "btree" ("estado_nuevo_id");



CREATE INDEX "idx_historial_estados_reporte_id" ON "public"."historial_estados" USING "btree" ("reporte_id");



CREATE INDEX "idx_historial_estados_usuario_id" ON "public"."historial_estados" USING "btree" ("usuario_id");



CREATE INDEX "idx_observaciones_cuadrilla_asignacion" ON "public"."observaciones_cuadrilla" USING "btree" ("asignacion_id", "created_at" DESC);



CREATE INDEX "idx_observaciones_cuadrilla_autor" ON "public"."observaciones_cuadrilla" USING "btree" ("autor_id") WHERE ("autor_id" IS NOT NULL);



CREATE INDEX "idx_observaciones_cuadrilla_publicas" ON "public"."observaciones_cuadrilla" USING "btree" ("asignacion_id", "created_at" DESC) WHERE "observacion_publica";



CREATE INDEX "idx_profiles_rol_id" ON "public"."profiles" USING "btree" ("rol_id") WHERE ("rol_id" IS NOT NULL);



CREATE INDEX "idx_reportes_categoria_id" ON "public"."reportes" USING "btree" ("categoria_id") WHERE ("categoria_id" IS NOT NULL);



CREATE INDEX "idx_reportes_estado_id" ON "public"."reportes" USING "btree" ("estado_id") WHERE ("estado_id" IS NOT NULL);



CREATE INDEX "idx_reportes_prioridad_id" ON "public"."reportes" USING "btree" ("prioridad_id") WHERE ("prioridad_id" IS NOT NULL);



CREATE INDEX "idx_reportes_usuario_id" ON "public"."reportes" USING "btree" ("usuario_id") WHERE ("usuario_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_votos_no_existe_unique_vote" ON "public"."votos_no_existe" USING "btree" ("reporte_id", "usuario_id");



CREATE INDEX "idx_votos_reparado_reporte_id" ON "public"."votos_reparado" USING "btree" ("reporte_id");



CREATE UNIQUE INDEX "idx_votos_reparado_unique_vote" ON "public"."votos_reparado" USING "btree" ("reporte_id", "usuario_id");



CREATE INDEX "idx_votos_reparado_usuario_id" ON "public"."votos_reparado" USING "btree" ("usuario_id");



CREATE INDEX "report_submission_attempts_actor_created_idx" ON "public"."report_submission_attempts" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "report_submission_attempts_ip_created_idx" ON "public"."report_submission_attempts" USING "btree" ("ip_hash", "created_at" DESC);



CREATE OR REPLACE TRIGGER "sync_reportes_vote_summary_on_reportes" AFTER INSERT OR UPDATE OF "deleted_at" ON "public"."reportes" FOR EACH ROW EXECUTE FUNCTION "private"."sync_report_vote_summary_from_reportes"();



CREATE OR REPLACE TRIGGER "sync_reportes_vote_summary_on_votos_no_existe" AFTER INSERT OR DELETE ON "public"."votos_no_existe" FOR EACH ROW EXECUTE FUNCTION "private"."sync_report_vote_summary"();



CREATE OR REPLACE TRIGGER "sync_reportes_vote_summary_on_votos_reparado" AFTER INSERT OR DELETE ON "public"."votos_reparado" FOR EACH ROW EXECUTE FUNCTION "private"."sync_report_vote_summary"();



ALTER TABLE ONLY "public"."asignaciones_cuadrilla"
    ADD CONSTRAINT "asignaciones_cuadrilla_asignada_por_fkey" FOREIGN KEY ("asignada_por") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaciones_cuadrilla"
    ADD CONSTRAINT "asignaciones_cuadrilla_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignaciones_cuadrilla"
    ADD CONSTRAINT "asignaciones_cuadrilla_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_reporte"
    ADD CONSTRAINT "comentarios_reporte_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_reporte"
    ADD CONSTRAINT "comentarios_reporte_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fotos_reporte"
    ADD CONSTRAINT "fotos_reporte_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historial_estados"
    ADD CONSTRAINT "historial_estados_estado_anterior_id_fkey" FOREIGN KEY ("estado_anterior_id") REFERENCES "public"."estados"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."historial_estados"
    ADD CONSTRAINT "historial_estados_estado_nuevo_id_fkey" FOREIGN KEY ("estado_nuevo_id") REFERENCES "public"."estados"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."historial_estados"
    ADD CONSTRAINT "historial_estados_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historial_estados"
    ADD CONSTRAINT "historial_estados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."observaciones_cuadrilla"
    ADD CONSTRAINT "observaciones_cuadrilla_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "public"."asignaciones_cuadrilla"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."observaciones_cuadrilla"
    ADD CONSTRAINT "observaciones_cuadrilla_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."report_submission_attempts"
    ADD CONSTRAINT "report_submission_attempts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estados"("id");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_prioridad_id_fkey" FOREIGN KEY ("prioridad_id") REFERENCES "public"."prioridades"("id");



ALTER TABLE ONLY "public"."reportes"
    ADD CONSTRAINT "reportes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reportes_vote_summary"
    ADD CONSTRAINT "reportes_vote_summary_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votos_no_existe"
    ADD CONSTRAINT "votos_no_existe_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votos_no_existe"
    ADD CONSTRAINT "votos_no_existe_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votos_reparado"
    ADD CONSTRAINT "votos_reparado_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votos_reparado"
    ADD CONSTRAINT "votos_reparado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."asignaciones_cuadrilla" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "asignaciones_cuadrilla_staff_read" ON "public"."asignaciones_cuadrilla" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."rol_id" = ANY (ARRAY[1, 4]))))));



ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_read_policy" ON "public"."categorias" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."comentarios_reporte" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comentarios_reporte_visible_read" ON "public"."comentarios_reporte" FOR SELECT TO "authenticated", "anon" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."reportes"
  WHERE (("reportes"."id" = "comentarios_reporte"."reporte_id") AND ("reportes"."deleted_at" IS NULL))))));



ALTER TABLE "public"."cuadrillas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cuadrillas_staff_read" ON "public"."cuadrillas" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."rol_id" = ANY (ARRAY[1, 4]))))));



ALTER TABLE "public"."estados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estados_public_read" ON "public"."estados" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."fotos_reporte" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fotos_reporte_owner_insert" ON "public"."fotos_reporte" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."reportes"
  WHERE (("reportes"."id" = "fotos_reporte"."reporte_id") AND ("reportes"."usuario_id" = "auth"."uid"()) AND ("reportes"."deleted_at" IS NULL)))));



CREATE POLICY "fotos_reporte_visible_read" ON "public"."fotos_reporte" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."reportes"
  WHERE (("reportes"."id" = "fotos_reporte"."reporte_id") AND ("reportes"."deleted_at" IS NULL)))));



ALTER TABLE "public"."historial_estados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historial_estados_visible_read" ON "public"."historial_estados" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."reportes"
  WHERE (("reportes"."id" = "historial_estados"."reporte_id") AND ("reportes"."deleted_at" IS NULL)))));



ALTER TABLE "public"."observaciones_cuadrilla" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "observaciones_cuadrilla_staff_read" ON "public"."observaciones_cuadrilla" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."rol_id" = ANY (ARRAY[1, 4]))))));



ALTER TABLE "public"."prioridades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prioridades_read_policy" ON "public"."prioridades" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_owner_read" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "id")));



ALTER TABLE "public"."report_submission_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reportes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reportes_public_read" ON "public"."reportes" FOR SELECT TO "authenticated", "anon" USING (("deleted_at" IS NULL));



ALTER TABLE "public"."reportes_vote_summary" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reportes_vote_summary_visible_read" ON "public"."reportes_vote_summary" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."reportes"
  WHERE (("reportes"."id" = "reportes_vote_summary"."reporte_id") AND ("reportes"."deleted_at" IS NULL)))));



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_public_read" ON "public"."roles" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."votos_no_existe" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "votos_no_existe_owner_insert" ON "public"."votos_no_existe" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "usuario_id")));



CREATE POLICY "votos_no_existe_owner_read" ON "public"."votos_no_existe" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "usuario_id")));



CREATE POLICY "votos_no_existe_permanent_users_only" ON "public"."votos_no_existe" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT (("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean AS "bool") IS FALSE));



ALTER TABLE "public"."votos_reparado" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "votos_reparado_owner_insert" ON "public"."votos_reparado" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "usuario_id")));



CREATE POLICY "votos_reparado_owner_read" ON "public"."votos_reparado" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "usuario_id")));



CREATE POLICY "votos_reparado_permanent_users_only" ON "public"."votos_reparado" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT (("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean AS "bool") IS FALSE));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "private"."refresh_report_vote_summary_row"("target_reporte_id" bigint) FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."sync_profile_from_auth_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."sync_report_vote_summary"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."sync_report_vote_summary_from_reportes"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."adjust_profile_points_atomic"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."adjust_profile_points_atomic"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_report_submission"("p_submission_id" "uuid", "p_actor_id" "uuid", "p_ip_hash" "text", "p_actor_window_seconds" integer, "p_actor_max" integer, "p_ip_window_seconds" integer, "p_ip_max" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_report_submission"("p_submission_id" "uuid", "p_actor_id" "uuid", "p_ip_hash" "text", "p_actor_window_seconds" integer, "p_actor_max" integer, "p_ip_window_seconds" integer, "p_ip_max" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."estado_confirmacion_email"("email_input" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."estado_confirmacion_email"("email_input" "text") TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT SELECT,MAINTAIN ON TABLE "public"."asignaciones_cuadrilla" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."asignaciones_cuadrilla" TO "authenticated";
GRANT ALL ON TABLE "public"."asignaciones_cuadrilla" TO "service_role";



GRANT ALL ON SEQUENCE "public"."asignaciones_cuadrilla_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."asignaciones_cuadrilla_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."asignaciones_cuadrilla_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."categorias" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."comentarios_reporte" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."comentarios_reporte" TO "authenticated";
GRANT ALL ON TABLE "public"."comentarios_reporte" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comentarios_reporte_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comentarios_reporte_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comentarios_reporte_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."cuadrillas" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."cuadrillas" TO "authenticated";
GRANT ALL ON TABLE "public"."cuadrillas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cuadrillas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cuadrillas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cuadrillas_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."estados" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."estados" TO "authenticated";
GRANT ALL ON TABLE "public"."estados" TO "service_role";



GRANT ALL ON SEQUENCE "public"."estados_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."estados_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."estados_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."fotos_reporte" TO "anon";
GRANT SELECT,INSERT,MAINTAIN ON TABLE "public"."fotos_reporte" TO "authenticated";
GRANT ALL ON TABLE "public"."fotos_reporte" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fotos_reporte_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fotos_reporte_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fotos_reporte_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."historial_estados" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."historial_estados" TO "authenticated";
GRANT ALL ON TABLE "public"."historial_estados" TO "service_role";



GRANT ALL ON SEQUENCE "public"."historial_estados_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."historial_estados_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."historial_estados_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."observaciones_cuadrilla" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."observaciones_cuadrilla" TO "authenticated";
GRANT ALL ON TABLE "public"."observaciones_cuadrilla" TO "service_role";



GRANT ALL ON SEQUENCE "public"."observaciones_cuadrilla_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."observaciones_cuadrilla_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."observaciones_cuadrilla_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."prioridades" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."prioridades" TO "authenticated";
GRANT ALL ON TABLE "public"."prioridades" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prioridades_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prioridades_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prioridades_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."public_profiles" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."report_submission_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."report_submission_attempts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."report_submission_attempts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."report_submission_attempts_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."reportes" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."reportes" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_estado_operativo_publico" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_estado_operativo_publico" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes_estado_operativo_publico" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reportes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reportes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reportes_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_linea_tiempo_operativa_publica" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_linea_tiempo_operativa_publica" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes_linea_tiempo_operativa_publica" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_vote_summary" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."reportes_vote_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes_vote_summary" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."roles" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."votos_no_existe" TO "anon";
GRANT SELECT,INSERT,MAINTAIN ON TABLE "public"."votos_no_existe" TO "authenticated";
GRANT ALL ON TABLE "public"."votos_no_existe" TO "service_role";



GRANT ALL ON SEQUENCE "public"."votos_no_existe_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."votos_no_existe_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."votos_no_existe_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."votos_reparado" TO "anon";
GRANT SELECT,INSERT,MAINTAIN ON TABLE "public"."votos_reparado" TO "authenticated";
GRANT ALL ON TABLE "public"."votos_reparado" TO "service_role";



GRANT ALL ON SEQUENCE "public"."votos_reparado_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."votos_reparado_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."votos_reparado_id_seq" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































