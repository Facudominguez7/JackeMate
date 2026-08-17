import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import { getPublicProfilesByIds, indexPublicProfilesById } from "@/database/queries/profiles"
import { ESTADOS_OPERATIVOS, type EstadoOperativo, type MotivoCierre } from "@/lib/authz/catalog"

/** Asignación de una cuadrilla a un reporte (`public.asignaciones_cuadrilla`). */
export type AsignacionCuadrilla = {
  id: number
  reporteId: number
  cuadrillaId: number
  cuadrillaNombre: string | null
  asignadaPor: string | null
  estadoOperativo: EstadoOperativo
  motivoCierre: MotivoCierre | null
  createdAt: string
  updatedAt: string
  cerradaAt: string | null
}

type NombreRelation = { nombre: string } | { nombre: string }[] | null

type AsignacionRow = {
  id: number
  reporte_id: number
  cuadrilla_id: number
  asignada_por: string | null
  estado_operativo: EstadoOperativo
  motivo_cierre: MotivoCierre | null
  created_at: string
  updated_at: string
  cerrada_at: string | null
  cuadrilla: NombreRelation
}

/** Ítem de la cola de cierre administrativo: trabajo finalizado por la cuadrilla, pendiente de confirmación de un admin. */
export type ColaCierreAdministrativoItem = {
  asignacionId: number
  reporteId: number
  reporteTitulo: string
  cuadrillaId: number
  cuadrillaNombre: string | null
  cerradaAt: string | null
}

const ASIGNACION_COLUMNS =
  "id, reporte_id, cuadrilla_id, asignada_por, estado_operativo, motivo_cierre, created_at, updated_at, cerrada_at, cuadrilla:cuadrillas(nombre)"

function getNombreRelacionado(relacion: NombreRelation) {
  if (Array.isArray(relacion)) {
    return relacion[0]?.nombre ?? null
  }

  return relacion?.nombre ?? null
}

function mapAsignacion(row: AsignacionRow): AsignacionCuadrilla {
  return {
    id: row.id,
    reporteId: row.reporte_id,
    cuadrillaId: row.cuadrilla_id,
    cuadrillaNombre: getNombreRelacionado(row.cuadrilla),
    asignadaPor: row.asignada_por,
    estadoOperativo: row.estado_operativo,
    motivoCierre: row.motivo_cierre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cerradaAt: row.cerrada_at,
  }
}

/**
 * Obtiene la asignación abierta (no cerrada) de un reporte, o `null` si no tiene ninguna.
 * El índice único parcial `(reporte_id) where estado_operativo <> 'cerrada'` garantiza que
 * a lo sumo exista una fila así por reporte.
 */
export async function obtenerAsignacionAbierta(
  supabase: SupabaseClient,
  reporteId: number,
): Promise<{ data: AsignacionCuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(ASIGNACION_COLUMNS)
    .eq("reporte_id", reporteId)
    .neq("estado_operativo", "cerrada")
    .maybeSingle()
    .returns<AsignacionRow | null>()

  if (error) {
    console.error("Error al obtener la asignación abierta del reporte:", error)
    return { data: null, error }
  }

  return { data: data ? mapAsignacion(data) : null, error: null }
}

/**
 * Obtiene la asignación abierta de una CUADRILLA, o `null` si está libre. Espejo de
 * `obtenerAsignacionAbierta`, que consulta por reporte.
 *
 * El índice único parcial `(cuadrilla_id) where estado_operativo <> 'cerrada'` garantiza que a
 * lo sumo haya una. Esta lectura sirve para avisar antes de escribir; la autoridad sobre la
 * invariante sigue siendo el índice.
 */
export async function obtenerAsignacionAbiertaDeCuadrilla(
  supabase: SupabaseClient,
  cuadrillaId: number,
): Promise<{ data: AsignacionCuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(ASIGNACION_COLUMNS)
    .eq("cuadrilla_id", cuadrillaId)
    .neq("estado_operativo", "cerrada")
    .maybeSingle()
    .returns<AsignacionRow | null>()

  if (error) {
    console.error("Error al obtener la asignación abierta de la cuadrilla:", error)
    return { data: null, error }
  }

  return { data: data ? mapAsignacion(data) : null, error: null }
}

/**
 * Obtiene una asignación por id, esté abierta o cerrada.
 */
export async function obtenerAsignacion(
  supabase: SupabaseClient,
  asignacionId: number,
): Promise<{ data: AsignacionCuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(ASIGNACION_COLUMNS)
    .eq("id", asignacionId)
    .maybeSingle()
    .returns<AsignacionRow | null>()

  if (error) {
    console.error("Error al obtener la asignación de cuadrilla:", error)
    return { data: null, error }
  }

  return { data: data ? mapAsignacion(data) : null, error: null }
}

/**
 * Lista todas las asignaciones (abiertas y cerradas) de un reporte, de la más reciente a la
 * más antigua.
 */
export async function listarAsignacionesDeReporte(
  supabase: SupabaseClient,
  reporteId: number,
): Promise<{ data: AsignacionCuadrilla[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(ASIGNACION_COLUMNS)
    .eq("reporte_id", reporteId)
    .order("created_at", { ascending: false })
    .returns<AsignacionRow[]>()

  if (error) {
    console.error("Error al listar las asignaciones de cuadrilla del reporte:", error)
    return { data: [], error }
  }

  return { data: (data ?? []).map(mapAsignacion), error: null }
}

/**
 * Sobre `asignaciones_cuadrilla` hay DOS índices únicos parciales y los dos disparan el mismo
 * código `23505`, así que `isDuplicateRowError` no alcanza para saber cuál se violó:
 *
 * - `idx_asignaciones_cuadrilla_activa_por_reporte` → el reporte ya tiene cuadrilla.
 * - `idx_asignaciones_cuadrilla_ocupada`            → la cuadrilla ya está en otro reporte.
 *
 * Postgres incluye el nombre del índice en el mensaje del error, que es la única forma de
 * distinguirlos. Sin esto el operador leería un mensaje falso y buscaría el problema donde no
 * está.
 */
export type ConflictoAsignacion = "reporte_ya_asignado" | "cuadrilla_ocupada" | null

/** Determina cuál de los dos índices únicos parciales rechazó el INSERT, o `null` si no fue un 23505. */
export function clasificarConflictoAsignacion(
  error: { code?: string; message?: string } | null | undefined,
): ConflictoAsignacion {
  if (error?.code !== "23505") {
    return null
  }

  const mensaje = error.message ?? ""

  if (mensaje.includes("idx_asignaciones_cuadrilla_ocupada")) {
    return "cuadrilla_ocupada"
  }

  if (mensaje.includes("idx_asignaciones_cuadrilla_activa_por_reporte")) {
    return "reporte_ya_asignado"
  }

  // 23505 de un índice que no conocemos: se trata como el caso más común para no perder el
  // aviso, pero conviene revisar el log si aparece.
  console.error("Conflicto 23505 no reconocido al insertar la asignación:", mensaje)
  return "reporte_ya_asignado"
}

/**
 * Inserta una asignación nueva en estado `en_progreso`: asignar una cuadrilla ya implica que
 * está a cargo del trabajo.
 *
 * ponytail: PostgREST no permite expresar en un único INSERT una validación cruzada contra
 * otras dos tablas ("la cuadrilla está activa" AND "el reporte no está borrado"); este lote
 * de migraciones no define una función RPC para eso. Por eso releemos ambas condiciones
 * inmediatamente antes del INSERT: esto achica la ventana de carrera al mínimo posible, pero
 * NO es atómico — sigue existiendo una ventana de TOCTOU angosta entre esta lectura y el
 * INSERT (p. ej. si la cuadrilla se desactiva o el reporte se borra en el medio). Techo
 * conocido: solo una función Postgres (RPC) o un trigger `BEFORE INSERT` cerrarían la
 * ventana por completo; agregar eso si se detectan carreras reales en producción.
 */
export async function insertarAsignacion(
  supabase: SupabaseClient,
  datos: { reporteId: number; cuadrillaId: number; asignadaPor: string },
): Promise<{
  data: AsignacionCuadrilla | null
  error: PostgrestError | null
  guardFailure?: "cuadrilla_inactiva" | "reporte_no_disponible"
}> {
  const [{ data: cuadrilla, error: cuadrillaError }, { data: reporte, error: reporteError }] = await Promise.all([
    supabase.from("cuadrillas").select("id, activa").eq("id", datos.cuadrillaId).maybeSingle(),
    supabase.from("reportes").select("id, deleted_at").eq("id", datos.reporteId).maybeSingle(),
  ])

  if (cuadrillaError || reporteError) {
    return { data: null, error: cuadrillaError ?? reporteError }
  }

  if (!cuadrilla || !cuadrilla.activa) {
    return { data: null, error: null, guardFailure: "cuadrilla_inactiva" }
  }

  if (!reporte || reporte.deleted_at) {
    return { data: null, error: null, guardFailure: "reporte_no_disponible" }
  }

  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .insert({
      reporte_id: datos.reporteId,
      cuadrilla_id: datos.cuadrillaId,
      asignada_por: datos.asignadaPor,
      estado_operativo: ESTADOS_OPERATIVOS.EN_PROGRESO,
    })
    .select(ASIGNACION_COLUMNS)
    .single()
    .returns<AsignacionRow>()

  if (error) {
    return { data: null, error }
  }

  return { data: mapAsignacion(data), error: null }
}

/**
 * Cierra una asignación por id. El filtro `estado_operativo <> 'cerrada'` evita cerrar dos
 * veces la misma fila: 0 filas actualizadas significa que ya estaba cerrada.
 */
export async function cerrarAsignacion(
  supabase: SupabaseClient,
  asignacionId: number,
  motivoCierre: MotivoCierre,
): Promise<{ data: AsignacionCuadrilla | null; error: PostgrestError | null }> {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .update({
      estado_operativo: ESTADOS_OPERATIVOS.CERRADA,
      motivo_cierre: motivoCierre,
      cerrada_at: ahora,
      updated_at: ahora,
    })
    .eq("id", asignacionId)
    .neq("estado_operativo", "cerrada")
    .select(ASIGNACION_COLUMNS)
    .maybeSingle()
    .returns<AsignacionRow | null>()

  if (error) {
    return { data: null, error }
  }

  return { data: data ? mapAsignacion(data) : null, error: null }
}

/**
 * Cierra la asignación abierta de un reporte (si existe), identificándola por `reporte_id`
 * en lugar de por su propio id. Útil cuando el llamador conoce el reporte pero no el id de
 * la asignación vigente (p. ej. al reasignar).
 */
export async function cerrarAsignacionAbiertaDeReporte(
  supabase: SupabaseClient,
  reporteId: number,
  motivoCierre: MotivoCierre,
): Promise<{ data: { id: number; cuadrillaId: number } | null; error: PostgrestError | null }> {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .update({
      estado_operativo: ESTADOS_OPERATIVOS.CERRADA,
      motivo_cierre: motivoCierre,
      cerrada_at: ahora,
      updated_at: ahora,
    })
    .eq("reporte_id", reporteId)
    .neq("estado_operativo", "cerrada")
    .select("id, cuadrilla_id")
    .maybeSingle()

  if (error) {
    return { data: null, error }
  }

  if (!data) {
    return { data: null, error: null }
  }

  return { data: { id: data.id, cuadrillaId: data.cuadrilla_id }, error: null }
}

/**
 * Lista la cola de cierre administrativo: asignaciones que la cuadrilla ya cerró como
 * `trabajo_finalizado` pero cuyo reporte sigue Pendiente (`estado_id = 1`), a la espera de
 * que un administrador confirme "Reparado" o "Rechazado".
 */
export async function listarColaCierreAdministrativo(
  supabase: SupabaseClient,
  limite = 50,
): Promise<{ data: ColaCierreAdministrativoItem[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(
      `
        id,
        reporte_id,
        cuadrilla_id,
        cerrada_at,
        cuadrilla:cuadrillas(nombre),
        reporte:reportes!inner(id, titulo, estado_id)
      `,
    )
    .eq("estado_operativo", "cerrada")
    .eq("motivo_cierre", "trabajo_finalizado")
    .eq("reporte.estado_id", 1)
    .order("cerrada_at", { ascending: true })
    .limit(limite)

  if (error) {
    console.error("Error al listar la cola de cierre administrativo:", error)
    return { data: [], error }
  }

  type FilaCola = {
    id: number
    reporte_id: number
    cuadrilla_id: number
    cerrada_at: string | null
    cuadrilla: NombreRelation
    reporte: { titulo: string } | { titulo: string }[] | null
  }

  function getTituloRelacionado(relacion: FilaCola["reporte"]) {
    if (Array.isArray(relacion)) {
      return relacion[0]?.titulo ?? ""
    }

    return relacion?.titulo ?? ""
  }

  return {
    data: ((data ?? []) as FilaCola[]).map((row) => ({
      asignacionId: row.id,
      reporteId: row.reporte_id,
      reporteTitulo: getTituloRelacionado(row.reporte),
      cuadrillaId: row.cuadrilla_id,
      cuadrillaNombre: getNombreRelacionado(row.cuadrilla),
      cerradaAt: row.cerrada_at,
    })),
    error: null,
  }
}

/** Asignación abierta enriquecida con los datos del reporte y el username de quien la creó, para el panel de operación. */
export type AsignacionAbiertaConReporte = AsignacionCuadrilla & {
  reporteTitulo: string
  reporteEstadoId: number | null
  reporteEliminado: boolean
  asignadaPorUsername: string | null
}

type ReporteRelation =
  | { titulo: string; estado_id: number | null; deleted_at: string | null }
  | { titulo: string; estado_id: number | null; deleted_at: string | null }[]
  | null

type AsignacionAbiertaConReporteRow = AsignacionRow & { reporte: ReporteRelation }

function getReporteRelacionado(relacion: ReporteRelation) {
  return Array.isArray(relacion) ? relacion[0] ?? null : relacion
}

/**
 * Lista todas las asignaciones abiertas (de cualquier reporte) junto con el título del
 * reporte y el username de quien las creó, para el panel "Operación" de cuadrillas. Ordenadas
 * de la más antigua a la más nueva (las intervenciones más viejas se atienden primero).
 */
export async function listarAsignacionesAbiertasConReporte(
  supabase: SupabaseClient,
  limite = 100,
): Promise<{ data: AsignacionAbiertaConReporte[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select(`${ASIGNACION_COLUMNS}, reporte:reportes(titulo, estado_id, deleted_at)`)
    .neq("estado_operativo", "cerrada")
    .order("created_at", { ascending: true })
    .limit(limite)
    .returns<AsignacionAbiertaConReporteRow[]>()

  if (error) {
    console.error("Error al listar las asignaciones abiertas con su reporte:", error)
    return { data: [], error }
  }

  const filas = data ?? []
  const { data: profiles } = await getPublicProfilesByIds(
    supabase,
    filas.map((fila) => fila.asignada_por ?? ""),
  )
  const profilesById = indexPublicProfilesById(profiles)

  return {
    data: filas.map((fila) => {
      const reporte = getReporteRelacionado(fila.reporte)

      return {
        ...mapAsignacion(fila),
        reporteTitulo: reporte?.titulo ?? "",
        reporteEstadoId: reporte?.estado_id ?? null,
        reporteEliminado: Boolean(reporte?.deleted_at),
        asignadaPorUsername: fila.asignada_por ? profilesById.get(fila.asignada_por)?.username ?? null : null,
      }
    }),
    error: null,
  }
}
