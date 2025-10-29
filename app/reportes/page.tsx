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
import { ReportCard } from "@/components/report-card"
import { FiltrosReportes } from "@/components/filtros-reportes"
import { getReportes, getCategorias, getEstados, getPrioridades } from "@/database/queries/reportes/get-reportes"

/**
 * Fuerza el renderizado dinámico en cada petición
 * Evita que Next.js cachee esta página para mostrar siempre datos actualizados
 */
export const dynamic = "force-dynamic"

/**
 * Tipo simplificado para renderizar las tarjetas de reportes
 * Transforma los datos de la base de datos a un formato más amigable para la UI
 */
type ReportCardData = {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  location: string
  author: string
  createdAt: string
  image: string | null
}

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
 * 
 * @param lat - Latitud
 * @param lon - Longitud
 * @returns String formateado con coordenadas o mensaje de no disponible
 */
const formatLocation = (lat: number | null, lon: number | null) => {
  if (lat === null || lon === null) return "Ubicación no disponible"
  return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`
}

/**
 * Componente principal de la página de reportes
 * Server Component que se ejecuta en el servidor de Next.js
 */
export default async function ReportesPage({ searchParams }: ReportesPageProps) {
  // Obtener los parámetros de búsqueda
  const params = await searchParams
  const { search, categoria, estado, prioridad } = params

  // Obtener reportes con filtros aplicados
  const { data, error } = await getReportes({
    search,
    categoria,
    estado,
    prioridad,
    limite: 12
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
        <FiltrosReportes
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

        {/* Renderizado condicional: Grid de reportes, mensaje vacío, o nada si hay error */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                titulo={report.title}
                descripcion={report.description}
                categoria={report.category}
                prioridad={report.priority}
                estado={report.status}
                imageUrl={report.image}
                createdAt={report.createdAt}
                autor={report.author}
              />
            ))}
          </div>
        ) : !error ? (
          // Mensaje cuando no hay reportes y no hubo error
          <Alert className="mt-6">
            <AlertTitle>No hay reportes publicados</AlertTitle>
            <AlertDescription>
              Creá el primero para ayudar a mejorar tu comunidad.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Botón para cargar más reportes (UI únicamente, sin funcionalidad) */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Cargar Más Reportes
          </Button>
        </div>
      </div>
    </div>
  )
}
