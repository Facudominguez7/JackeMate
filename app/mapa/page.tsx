/**
 * Página del mapa interactivo de reportes
 * 
 * Este componente Client Component se encarga de:
 * - Cargar reportes reales desde Supabase con sus coordenadas
 * - Mostrar un mapa interactivo con marcadores de reportes
 * - Incluir una barra lateral con la lista de reportes
 * - Manejar estados de carga y errores
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { List, Layers } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { createClient } from "@/utils/supabase/client"

/**
 * Importar el mapa solo en el cliente para evitar "window is not defined"
 * Leaflet requiere acceso al DOM, por lo que debe cargarse dinámicamente
 */
const MapContainer = dynamic(
  () => import("@/components/map-container").then((m) => m.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  }
)

/**
 * Tipo que representa un reporte con toda la información necesaria para el mapa
 */
interface ReporteParaMapa {
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

/**
 * Tipo que representa la estructura de datos devuelta por Supabase
 */
interface ReporteDB {
  id: number
  titulo: string
  descripcion: string | null
  created_at: string
  lat: number
  lon: number
  categoria: { nombre: string } | null
  prioridad: { nombre: string } | null
  estado: { nombre: string } | null
  autor: { username: string | null } | null
  fotos: { url: string | null }[] | null
}

export default function MapaPage() {
  const [showSidebar, setShowSidebar] = useState(false)
  const [reportes, setReportes] = useState<ReporteParaMapa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Efecto para inicializar el estado del sidebar según el tamaño de pantalla
   * En desktop (>= 768px) se muestra por defecto, en mobile se oculta
   */
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }
    
    // Configurar estado inicial
    handleResize()
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
   * Efecto para cargar los reportes desde Supabase al montar el componente
   * Solo carga reportes que tengan coordenadas válidas (no null)
   */
  useEffect(() => {
    const cargarReportes = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // Consultar reportes con coordenadas válidas y sus relaciones
        const { data, error: supabaseError } = await supabase
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
          .not("lat", "is", null)
          .not("lon", "is", null)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .returns<ReporteDB[]>()

        if (supabaseError) throw supabaseError

        // Transformar los datos de BD al formato esperado por los componentes del mapa
        const reportesTransformados: ReporteParaMapa[] = (data ?? []).map((reporte) => ({
          id: reporte.id,
          title: reporte.titulo,
          description: reporte.descripcion ?? "Sin descripción",
          category: reporte.categoria?.nombre ?? "Sin categoría",
          priority: reporte.prioridad?.nombre ?? "Sin prioridad",
          status: reporte.estado?.nombre ?? "Sin estado",
          location: `Lat ${reporte.lat.toFixed(4)}, Lon ${reporte.lon.toFixed(4)}`,
          coordinates: [reporte.lat, reporte.lon] as [number, number],
          author: reporte.autor?.username ?? "Anónimo",
          createdAt: reporte.created_at,
          image: reporte.fotos?.[0]?.url ?? undefined,
        }))

        setReportes(reportesTransformados)
      } catch (err) {
        console.error("Error al cargar reportes:", err)
        setError("No se pudieron cargar los reportes del mapa")
      } finally {
        setLoading(false)
      }
    }

    cargarReportes()
  }, [])

  /**
   * Obtiene el color para la prioridad del reporte
   * @param priority - Nombre de la prioridad
   * @returns Color hex para la prioridad
   */
  const getPriorityColor = (priority: string) => {
    const normalized = priority.toLowerCase()
    switch (normalized) {
      case "urgente":
      case "alta":
        return "#ef4444" // red
      case "media":
        return "#f59e0b" // amber
      case "baja":
        return "#10b981" // emerald
      default:
        return "#6b7280" // gray
    }
  }

  /**
   * Obtiene el color para el estado del reporte
   * @param status - Nombre del estado
   * @returns Color hex para el estado
   */
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase()
    switch (normalized) {
      case "resuelto":
        return "#10b981" // emerald
      case "en progreso":
        return "#3b82f6" // blue
      case "reportado":
      case "pendiente":
        return "#f59e0b" // amber
      default:
        return "#6b7280" // gray
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de acciones superior */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
            <Layers className="w-4 h-4 mr-2" />
            {showSidebar ? "Ocultar" : "Mostrar"} Lista
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <List className="w-4 h-4 mr-2" />
              Vista Lista
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Barra lateral con lista de reportes */}
        <div className={`w-80 border-r bg-card/50 backdrop-blur-sm overflow-y-auto transition-all ${showSidebar ? '' : 'hidden md:hidden'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Reportes en el Mapa</h2>
              <Badge variant="outline">{reportes.length} reportes</Badge>
            </div>

            {/* Mensaje de carga */}
            {loading && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Cargando reportes...
              </div>
            )}

            {/* Mensaje de error */}
            {error && !loading && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Lista de reportes */}
            {!loading && !error && reportes.length === 0 && (
              <Alert>
                <AlertTitle>No hay reportes</AlertTitle>
                <AlertDescription>
                  No se encontraron reportes con ubicación en el mapa.
                </AlertDescription>
              </Alert>
            )}

            {!loading && !error && reportes.length > 0 && (
              <div className="space-y-3">
                {reportes.map((report) => (
                    <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(report.priority) }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              <Link href={`/reportes/${report.id}`} className="hover:text-primary">
                                {report.title}
                              </Link>
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">{report.location}</p>
                            <div className="flex gap-1">
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ color: getStatusColor(report.status) }}
                              >
                                {report.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {report.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenedor del mapa */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Cargando mapa...</p>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Error al cargar el mapa</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <MapContainer reports={reportes} />
          )}
        </div>
      </div>
    </div>
  )
}
