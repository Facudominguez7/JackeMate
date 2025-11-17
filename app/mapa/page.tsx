/**
 * Página del mapa interactivo de reportes
 * 
 * Este componente Server Component se encarga de:
 * - Cargar reportes reales desde Supabase con sus coordenadas y filtros
 * - Renderizar el MapaClient con los datos
 * - Manejar los searchParams para los filtros
 */

import { MapaClient } from "./mapa-client"
import { getReportes, getCategorias, getEstados, getPrioridades } from "@/database/queries/reportes/get-reportes"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Props del componente - searchParams de Next.js para filtros
 */
type MapaPageProps = {
  searchParams: Promise<{
    search?: string
    categoria?: string
    estado?: string
    prioridad?: string
  }>
}

/**
 * Página servidor que carga reportes con coordenadas y las opciones de filtro, y renderiza el componente cliente del mapa con esos datos.
 *
 * @param props.searchParams - Promise de un objeto con propiedades opcionales `search`, `categoria`, `estado` y `prioridad` que se usan como filtros para los reportes.
 * @returns El elemento React que renderiza MapaClient con los reportes (o un arreglo vacío), las listas de categorías, estados y prioridades (o arreglos vacíos) y un mensaje de error o `null`.
 */
export default async function MapaPage({ searchParams }: MapaPageProps) {
  // Obtener los parámetros de búsqueda
  const params = await searchParams
  const { search, categoria, estado, prioridad } = params

  // Verificar si hay un usuario autenticado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener reportes con filtros aplicados (solo con coordenadas)
  const { data: reportes, error } = await getReportes({
    search,
    categoria,
    estado,
    prioridad,
    soloConCoordenadas: true,
    limite: 100 // Más reportes para el mapa
  })

  // Obtener opciones para los filtros
  const { data: categorias } = await getCategorias()
  const { data: estados } = await getEstados()
  const { data: prioridades } = await getPrioridades()

  return (
    <MapaClient
      reportesDB={reportes ?? []}
      categorias={categorias ?? []}
      estados={estados ?? []}
      prioridades={prioridades ?? []}
      error={error?.message ?? null}
      isAuthenticated={!!user}
    />
  )
}