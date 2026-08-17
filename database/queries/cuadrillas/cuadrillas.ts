import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

/** Registro de una cuadrilla municipal del catálogo (`public.cuadrillas`). */
export type Cuadrilla = {
  id: number
  nombre: string
  descripcion: string | null
  telefono: string | null
  activa: boolean
  createdAt: string
  updatedAt: string
}

type CuadrillaRow = {
  id: number
  nombre: string
  descripcion: string | null
  telefono: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

type DatosCuadrilla = {
  nombre: string
  descripcion?: string | null
  telefono?: string | null
}

const CUADRILLA_COLUMNS = "id, nombre, descripcion, telefono, activa, created_at, updated_at"

/**
 * Mapea una fila cruda de `cuadrillas` (columnas snake_case) al tipo `Cuadrilla` (camelCase)
 * usado por el resto de la aplicación.
 */
function mapCuadrilla(row: CuadrillaRow): Cuadrilla {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    telefono: row.telefono,
    activa: row.activa,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Lista las cuadrillas del catálogo ordenadas alfabéticamente por nombre.
 *
 * @param supabase - Cliente de Supabase
 * @param soloActivas - Si es `true`, filtra solo las cuadrillas activas
 */
export async function listarCuadrillas(
  supabase: SupabaseClient,
  soloActivas?: boolean,
): Promise<{ data: Cuadrilla[]; error: PostgrestError | null }> {
  let query = supabase.from("cuadrillas").select(CUADRILLA_COLUMNS).order("nombre")

  if (soloActivas) {
    query = query.eq("activa", true)
  }

  const { data, error } = await query.returns<CuadrillaRow[]>()

  if (error) {
    console.error("Error al listar cuadrillas:", error)
    return { data: [], error }
  }

  return { data: (data ?? []).map(mapCuadrilla), error: null }
}

/**
 * Obtiene una cuadrilla por id, o `null` si no existe.
 */
export async function obtenerCuadrilla(
  supabase: SupabaseClient,
  cuadrillaId: number,
): Promise<{ data: Cuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("cuadrillas")
    .select(CUADRILLA_COLUMNS)
    .eq("id", cuadrillaId)
    .maybeSingle()
    .returns<CuadrillaRow | null>()

  if (error) {
    console.error("Error al obtener cuadrilla:", error)
    return { data: null, error }
  }

  return { data: data ? mapCuadrilla(data) : null, error: null }
}

/**
 * Crea una cuadrilla nueva. El error `23505` (nombre duplicado, por el índice único sobre
 * `lower(btrim(nombre))`) se propaga sin transformar: la capa de casos de uso decide el
 * mensaje que se muestra al usuario.
 */
export async function crearCuadrilla(
  supabase: SupabaseClient,
  datos: DatosCuadrilla,
): Promise<{ data: Cuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("cuadrillas")
    .insert({
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      telefono: datos.telefono ?? null,
    })
    .select(CUADRILLA_COLUMNS)
    .single()
    .returns<CuadrillaRow>()

  if (error) {
    return { data: null, error }
  }

  return { data: mapCuadrilla(data), error: null }
}

/**
 * Actualiza los datos de una cuadrilla existente. Igual que en la creación, propaga `23505`
 * sin transformar ante un nombre duplicado.
 */
export async function actualizarCuadrilla(
  supabase: SupabaseClient,
  cuadrillaId: number,
  datos: DatosCuadrilla,
): Promise<{ data: Cuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("cuadrillas")
    .update({
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      telefono: datos.telefono ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cuadrillaId)
    .select(CUADRILLA_COLUMNS)
    .maybeSingle()
    .returns<CuadrillaRow | null>()

  if (error) {
    return { data: null, error }
  }

  return { data: data ? mapCuadrilla(data) : null, error: null }
}

/**
 * Activa o desactiva una cuadrilla mediante un UPDATE condicionado al valor opuesto de
 * `activa`: si la cuadrilla ya estaba en el estado pedido, el UPDATE no toca ninguna fila
 * (0 filas = "ya estaba así", no un error).
 */
export async function cambiarActivacionCuadrilla(
  supabase: SupabaseClient,
  cuadrillaId: number,
  activa: boolean,
): Promise<{ data: Cuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("cuadrillas")
    .update({ activa, updated_at: new Date().toISOString() })
    .eq("id", cuadrillaId)
    .eq("activa", !activa)
    .select(CUADRILLA_COLUMNS)
    .maybeSingle()
    .returns<CuadrillaRow | null>()

  if (error) {
    return { data: null, error }
  }

  return { data: data ? mapCuadrilla(data) : null, error: null }
}

/**
 * Cuenta las asignaciones abiertas (`estado_operativo <> 'cerrada'`) de una cuadrilla.
 */
export async function contarAsignacionesAbiertasDeCuadrilla(
  supabase: SupabaseClient,
  cuadrillaId: number,
): Promise<{ count: number; error: PostgrestError | null }> {
  const { count, error } = await supabase
    .from("asignaciones_cuadrilla")
    .select("id", { count: "exact", head: true })
    .eq("cuadrilla_id", cuadrillaId)
    .neq("estado_operativo", "cerrada")

  if (error) {
    console.error("Error al contar asignaciones abiertas de la cuadrilla:", error)
    return { count: 0, error }
  }

  return { count: count ?? 0, error: null }
}
