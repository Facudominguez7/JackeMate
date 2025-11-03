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
}

/**
 * Fetches reports from the database applying optional filters.
 *
 * @param filtros - Optional filters: `search`, `categoria`, `estado`, `prioridad`, `soloConCoordenadas`, and `limite`. Defaults: `soloConCoordenadas = false`, `limite = 12`.
 * @returns An object with `data` containing an array of `ReporteDB` or `null`, and `error` containing the query error or `null`.
 */
export async function getReportes(filtros: FiltrosReportes = {}) {
  const {
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas = false,
    limite = 12
  } = filtros

  const supabase = await createClient()

  // Iniciar la consulta base con todas las relaciones
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
      fotos:fotos_reporte(url)`
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

  // Ordenar y limitar resultados
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limite)
    .returns<ReporteDB[]>()

  return { data, error }
}

/**
 * Fetches all available categories sorted by name.
 *
 * @returns `{ data, error }` where `data` is an array of category objects with `id` and `nombre` or `null`, and `error` is the Supabase error object or `null`
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
 * Fetches all available states ordered by name.
 *
 * @returns An object with `data` containing an array of state records (each with `id` and `nombre`) or `null`, and `error` containing the request error object or `null`.
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
 * Fetches all priority records sorted by name.
 *
 * @returns An object containing `data` — an array of priority objects with `id` and `nombre`, or `null` if none — and `error` — an error object if the query failed, or `null` otherwise.
 */
export async function getPrioridades() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("prioridades")
    .select("id, nombre")
    .order("nombre")
  
  return { data, error }
}