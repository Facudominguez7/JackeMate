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
import { getPublicProfilesByIds, indexPublicProfilesById } from "@/database/queries/profiles"
import {
  isMissingReportImageColumnsError,
  resolveReportImageRows,
  type ReportImageRow,
} from "@/lib/media/report-images"
import type { ReportCardData } from "@/components/lista-reportes-client"

export type ReporteDB = {
  id: number
  usuario_id: string | null
  titulo: string
  descripcion: string | null
  created_at: string
  lat: number | null
  lon: number | null
  categoria: { nombre: string } | null
  prioridad: { nombre: string } | null
  estado: { nombre: string } | null
  autor: { username: string | null } | null
  fotos: (ReportImageRow & { publicUrl?: string | null })[] | null
}

type ReporteDBRaw = Omit<ReporteDB, "fotos"> & {
  fotos: ReportImageRow[] | null
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

export type ReportMapItem = {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  location: string
  coordinates: [number, number]
  author: string
  createdAt: string
  image?: string
}

export type DashboardUserReport = {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  prioridad: string
  estado: string
  imageUrl: string | null
  createdAt: string
  autor: string
}

const CATEGORY_FILTER_IDS = {
  bache: 1,
  semaforo: 2,
  arbolcaido: 3,
  alumbrado: 4,
  residuos: 5,
  seguridad: 6,
  otros: 7,
} as const

const PRIORITY_FILTER_IDS = {
  alta: 1,
  media: 2,
  baja: 3,
} as const

const STATE_FILTER_IDS = {
  pendiente: 1,
  reparado: 2,
  rechazado: 3,
} as const

function normalizeFilterValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function resolveLookupFilterId(
  filters: Record<string, number>,
  value: string | undefined,
) {
  if (!value || value === "all") {
    return null
  }

  return filters[normalizeFilterValue(value)] ?? null
}

function getSingleRelationName<T extends { nombre: string }>(
  relation: T | T[] | null,
  fallback: string,
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nombre ?? fallback
  }

  return relation?.nombre ?? fallback
}

function getSingleUsername(
  relation:
    | {
        username: string | null
      }
    | {
        username: string | null
      }[]
    | null,
  fallback = "Anónimo",
) {
  if (Array.isArray(relation)) {
    return relation[0]?.username ?? fallback
  }

  return relation?.username ?? fallback
}

function formatLocation(lat: number | null, lon: number | null) {
  if (lat === null || lon === null) {
    return "Ubicación no disponible"
  }

  return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`
}

function mapReportToCardData(report: ReporteDB): ReportCardData {
  return {
    id: report.id,
    title: report.titulo,
    description: report.descripcion ?? "",
    category: getSingleRelationName(report.categoria, "Sin categoría"),
    priority: getSingleRelationName(report.prioridad, "Sin prioridad"),
    status: getSingleRelationName(report.estado, "Sin estado"),
    location: formatLocation(report.lat, report.lon),
    author: getSingleUsername(report.autor),
    createdAt: report.created_at,
    image: report.fotos?.[0]?.publicUrl ?? report.fotos?.[0]?.url ?? null,
  }
}

function mapReportToMapItem(report: ReporteDB): ReportMapItem | null {
  if (report.lat === null || report.lon === null) {
    return null
  }

  const cardData = mapReportToCardData(report)

  return {
    id: cardData.id,
    title: cardData.title,
    description: cardData.description || "Sin descripción",
    category: cardData.category,
    priority: cardData.priority,
    status: cardData.status,
    location: cardData.location,
    coordinates: [report.lat, report.lon],
    author: cardData.author,
    createdAt: cardData.createdAt,
    image: cardData.image ?? undefined,
  }
}

function mapReportToDashboardItem(report: ReporteDB): DashboardUserReport {
  return {
    id: report.id,
    titulo: report.titulo,
    descripcion: report.descripcion ?? "",
    categoria: getSingleRelationName(report.categoria, "Sin categoría"),
    prioridad: getSingleRelationName(report.prioridad, "Sin prioridad"),
    estado: getSingleRelationName(report.estado, "Sin estado"),
    imageUrl: report.fotos?.[0]?.publicUrl ?? report.fotos?.[0]?.url ?? null,
    createdAt: report.created_at,
    autor: getSingleUsername(report.autor),
  }
}

const buildReportesSelect = (includeCanonicalImageFields: boolean) => `id,
      usuario_id,
      titulo,
      descripcion,
      created_at,
      lat,
      lon,
      categoria:categorias!reportes_categoria_id_fkey(nombre),
      prioridad:prioridades!reportes_prioridad_id_fkey(nombre),
      estado:estados!reportes_estado_id_fkey(nombre),
      fotos:fotos_reporte(${includeCanonicalImageFields ? "url,bucket,path" : "url"})`

async function fetchReportes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filtros: Required<Pick<FiltrosReportes, "soloConCoordenadas" | "limite" | "offset">> & FiltrosReportes,
  includeCanonicalImageFields: boolean
) {
  const {
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas,
    limite,
    offset,
  } = filtros

  let query = supabase
    .from("reportes")
    .select(buildReportesSelect(includeCanonicalImageFields), { count: 'exact' })
    .is("deleted_at", null)

  if (search && search.trim() !== "") {
    query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`)
  }

  const categoriaId = resolveLookupFilterId(CATEGORY_FILTER_IDS, categoria)
  if (categoriaId !== null) {
    query = query.eq("categoria_id", categoriaId)
  }

  const estadoId = resolveLookupFilterId(STATE_FILTER_IDS, estado)
  if (estadoId !== null) {
    query = query.eq("estado_id", estadoId)
  }

  const prioridadId = resolveLookupFilterId(PRIORITY_FILTER_IDS, prioridad)
  if (prioridadId !== null) {
    query = query.eq("prioridad_id", prioridadId)
  }

  if (soloConCoordenadas) {
    query = query.not("lat", "is", null).not("lon", "is", null)
  }

  return query
    .order("created_at", { ascending: false })
    .range(offset, offset + limite - 1)
    .returns<ReporteDBRaw[]>()
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
  const supabase = await createClient()
  const {
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas = false,
    limite = 12,
    offset = 0
  } = filtros

  const normalizedFilters = {
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas,
    limite,
    offset,
  }

  let { data, error, count } = await fetchReportes(supabase, normalizedFilters, true)

  if (error && isMissingReportImageColumnsError(error)) {
    ;({ data, error, count } = await fetchReportes(supabase, normalizedFilters, false))
  }

  // Calcular si hay más resultados
  const hasMore = count !== null ? (offset + limite) < count : false

  const { data: publicProfiles } = await getPublicProfilesByIds(
    supabase,
    (data ?? []).map((report) => report.usuario_id ?? ""),
  )
  const profilesById = indexPublicProfilesById(publicProfiles)

  const resolvedData = (data ?? []).map((report: ReporteDBRaw) => ({
    ...report,
    autor: report.usuario_id
      ? { username: profilesById.get(report.usuario_id)?.username ?? null }
      : null,
    fotos: resolveReportImageRows(report.fotos),
  }))

  return { data: resolvedData, error, count, hasMore }
}

export async function getReportCardData(filtros: FiltrosReportes = {}) {
  const { data, error, count, hasMore } = await getReportes(filtros)

  return {
    data: (data ?? []).map(mapReportToCardData),
    error,
    count,
    hasMore,
  }
}

export async function getReportMapData(filtros: FiltrosReportes = {}) {
  const { data, error } = await getReportes({
    ...filtros,
    soloConCoordenadas: true,
  })

  return {
    data: (data ?? [])
      .map(mapReportToMapItem)
      .filter((report): report is ReportMapItem => report !== null),
    error,
  }
}

export async function getDashboardUserReports(userId: string) {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from("reportes")
    .select(buildReportesSelect(true))
    .eq("usuario_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<ReporteDBRaw[]>()

  if (error && isMissingReportImageColumnsError(error)) {
    ;({ data, error } = await supabase
      .from("reportes")
      .select(buildReportesSelect(false))
      .eq("usuario_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<ReporteDBRaw[]>())
  }

  if (error || !data) {
    return { data: [], error }
  }

  return {
    data: data
      .map((report) => ({
        ...report,
        fotos: resolveReportImageRows(report.fotos),
      }))
      .map(mapReportToDashboardItem),
    error: null,
  }
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
