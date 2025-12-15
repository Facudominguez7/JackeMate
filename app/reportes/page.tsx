/**
 * Página de listado de reportes públicos
 * 
 * Server Component que consulta y muestra todos los reportes de problemas
 * públicos en Posadas desde Supabase.
 * 
 * Características:
 * - Renderizado en el servidor (RSC - React Server Component)
 * - Consulta a Supabase con relaciones (joins)
 * - Manejo de estados de error y datos vacíos
 * - Optimización con lazy loading de imágenes
 * - Filtros reales por categoría, estado, prioridad y texto
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ReportesClientWrapper } from "./reportes-client"
import { ListaReportesClient, type ReportCardData } from "@/components/lista-reportes-client"
import { getReportes, getCategorias, getEstados, getPrioridades } from "@/database/queries/reportes/get-reportes"

/**
 * Fuerza el renderizado dinámico en cada petición
 * Evita que Next.js cachee esta página para mostrar siempre datos actualizados
 */
export const dynamic = "force-dynamic"

/**
 * Props del componente - searchParams de Next.js para filtros
 */
type ReportesPageProps = {
  searchParams: Promise<{
    search?: string
    categoria?: string
    estado?: string
    prioridad?: string
  }>
}

/**
 * Formatea las coordenadas geográficas para mostrar en la UI
 */
const formatLocation = (lat: number | null, lon: number | null) => {
  if (lat === null || lon === null) return "Ubicación no disponible"
  return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`
}

/**
 * Muestra la página de reportes públicos incluyendo controles de filtrado, mensajes de estado y la lista de tarjetas de reporte.
 *
 * @param searchParams - Parámetros opcionales de filtrado: `search`, `categoria`, `estado` y `prioridad`.
 * @returns El elemento React que representa la interfaz completa de la página de reportes.
 */
export default async function ReportesPage({ searchParams }: ReportesPageProps) {
  // Obtener los parámetros de búsqueda
  const params = await searchParams
  const { search, categoria, estado, prioridad } = params

  // Obtener reportes con filtros aplicados (SSR inicial)
  const { data, error, hasMore } = await getReportes({
    search,
    categoria,
    estado,
    prioridad,
    limite: 12,
    offset: 0
  })

  // Obtener opciones para los filtros
  const { data: categorias } = await getCategorias()
  const { data: estados } = await getEstados()
  const { data: prioridades } = await getPrioridades()

  /**
   * Transformación de datos de BD a formato de UI
   * Normaliza los datos y proporciona valores por defecto usando nullish coalescing (??)
   */
  const reports: ReportCardData[] = (data ?? []).map((report) => ({
    id: report.id,
    title: report.titulo,
    description: report.descripcion ?? "",
    category: report.categoria?.nombre ?? "Sin categoría",
    priority: report.prioridad?.nombre ?? "Sin prioridad",
    status: report.estado?.nombre ?? "Sin estado",
    location: formatLocation(report.lat, report.lon),
    author: report.autor?.username ?? "Anónimo",
    createdAt: report.created_at,
    image: report.fotos?.[0]?.url ?? null,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Sección de acciones: botón para crear nuevo reporte */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-end gap-3">
          <Button asChild size="sm">
            <Link href="/reportes/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Reporte
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Encabezado de la página */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Reportes Públicos</h2>
          <p className="text-muted-foreground">Explora todos los reportes de problemas públicos en Posadas</p>
        </div>

        {/* Sección de filtros con funcionalidad real */}
        <ReportesClientWrapper
          categorias={categorias ?? []}
          estados={estados ?? []}
          prioridades={prioridades ?? []}
        />

        {/* Mensaje de error si falla la consulta a Supabase */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
            <AlertDescription>Intenta nuevamente en unos minutos.</AlertDescription>
          </Alert>
        )}

        {/* Renderizado condicional: Lista de reportes con paginación, mensaje vacío, o nada si hay error */}
        {reports.length > 0 ? (
          <ListaReportesClient
            initialReports={reports}
            initialHasMore={hasMore ?? false}
          />
        ) : !error ? (
          // Mensaje cuando no hay reportes y no hubo error
          <Alert className="mt-6">
            <AlertTitle>No hay reportes publicados</AlertTitle>
            <AlertDescription>
              Creá el primero para ayudar a mejorar tu comunidad.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  )
}