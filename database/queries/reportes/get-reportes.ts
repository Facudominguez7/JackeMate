/**
 * Query para obtener reportes con filtros
 * 
 * Permite filtrar reportes por:
 * - Texto de búsqueda (busca en título y descripción)
 * - Categoría
 * - Estado
 * - Prioridad
 */

import { createClient } from "@/utils/supabase/server"

export type ReporteDB = {
  id: number
  titulo: string
  descripcion: string | null
  created_at: string
  lat: number | null
  lon: number | null
  categoria: { nombre: string } | null
  prioridad: { nombre: string } | null
  estado: { nombre: string } | null
  autor: { username: string | null } | null
  fotos: { url: string | null }[] | null
}

export type FiltrosReportes = {
  search?: string
  categoria?: string
  estado?: string
  prioridad?: string
  soloConCoordenadas?: boolean
  limite?: number
  offset?: number
}

/**
 * Recupera reportes desde la base de datos aplicando filtros opcionales.
 *
 * @param filtros - Opciones de filtrado:
 *   - `search`: texto a buscar en `titulo` y `descripcion`
 *   - `categoria`: nombre de la categoría (o `"all"` para no filtrar)
 *   - `estado`: nombre del estado (o `"all"` para no filtrar)
 *   - `prioridad`: nombre de la prioridad (o `"all"` para no filtrar)
 *   - `soloConCoordenadas`: si `true`, solo incluye reportes con `lat` y `lon`
 *   - `limite`: número máximo de resultados (por defecto 12)
 * @returns Objeto con `data` — lista de reportes (`ReporteDB[]`) o `null`, y `error` — el error devuelto por Supabase o `null`.
 */
export async function getReportes(filtros: FiltrosReportes = {}) {
  const {
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas = false,
    limite = 12,
    offset = 0
  } = filtros

  const supabase = await createClient()

  // Iniciar la consulta base con todas las relaciones
  // Usamos { count: 'exact' } para obtener el total de registros
  let query = supabase
    .from("reportes")
    .select(
      `id,
      titulo,
      descripcion,
      created_at,
      lat,
      lon,
      categoria:categorias!reportes_categoria_id_fkey(nombre),
      prioridad:prioridades!reportes_prioridad_id_fkey(nombre),
      estado:estados!reportes_estado_id_fkey(nombre),
      autor:profiles!reportes_usuario_id_fkey(username),
      fotos:fotos_reporte(url)`,
      { count: 'exact' }
    )
    .is("deleted_at", null)

  // Aplicar filtro de búsqueda de texto (busca en título y descripción)
  if (search && search.trim() !== "") {
    query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`)
  }

  // Aplicar filtro de categoría
  if (categoria && categoria !== "all") {
    // Necesitamos hacer una subconsulta para filtrar por nombre de categoría
    const { data: categoriaData } = await supabase
      .from("categorias")
      .select("id")
      .ilike("nombre", categoria)
      .single()

    if (categoriaData) {
      query = query.eq("categoria_id", categoriaData.id)
    }
  }

  // Aplicar filtro de estado
  if (estado && estado !== "all") {
    // Necesitamos hacer una subconsulta para filtrar por nombre de estado
    const { data: estadoData } = await supabase
      .from("estados")
      .select("id")
      .ilike("nombre", estado)
      .single()

    if (estadoData) {
      query = query.eq("estado_id", estadoData.id)
    }
  }

  // Aplicar filtro de prioridad
  if (prioridad && prioridad !== "all") {
    // Necesitamos hacer una subconsulta para filtrar por nombre de prioridad
    const { data: prioridadData } = await supabase
      .from("prioridades")
      .select("id")
      .ilike("nombre", prioridad)
      .single()

    if (prioridadData) {
      query = query.eq("prioridad_id", prioridadData.id)
    }
  }

  // Filtrar solo reportes con coordenadas (útil para el mapa)
  if (soloConCoordenadas) {
    query = query.not("lat", "is", null).not("lon", "is", null)
  }

  // Ordenar y aplicar paginación con range
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limite - 1)
    .returns<ReporteDB[]>()

  // Calcular si hay más resultados
  const hasMore = count !== null ? (offset + limite) < count : false

  return { data, error, count, hasMore }
}

/**
 * Recupera todas las categorías disponibles ordenadas por nombre.
 *
 * @returns Un objeto con `data` — arreglo de categorías (cada elemento tiene `id` y `nombre`) o `null` si no hay resultados — y `error` con la información del error si se produjo alguno.
 */
export async function getCategorias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre")

  return { data, error }
}

/**
 * Recupera la lista de todos los estados ordenados por nombre.
 *
 * @returns Objeto con `data` — arreglo de registros `{ id, nombre }` o `null`, y `error` — error de la consulta o `null`.
 */
export async function getEstados() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("estados")
    .select("id, nombre")
    .order("nombre")

  return { data, error }
}

/**
 * Obtiene la lista de prioridades disponibles ordenadas por nombre.
 *
 * @returns `data` — Array de objetos con `id` y `nombre` de cada prioridad; `error` — objeto de error de la consulta si se produjo, `null` en caso contrario.
 */
export async function getPrioridades() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("prioridades")
    .select("id, nombre")
    .order("nombre")

  return { data, error }
}