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

export default async function MapaPage({ searchParams }: MapaPageProps) {
  // Obtener los parámetros de búsqueda
  const params = await searchParams
  const { search, categoria, estado, prioridad } = params

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
    />
  )
}
