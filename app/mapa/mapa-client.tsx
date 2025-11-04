/**
 * Componente cliente del mapa interactivo de reportes
 * 
 * Este componente Client Component se encarga de:
 * - Mostrar un mapa interactivo con marcadores de reportes
 * - Incluir una barra lateral con la lista de reportes
 * - Manejar estados de UI (sidebar, etc)
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { List, Layers, Map, X, ChevronRight, MapPin } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { FiltrosReportes } from "@/components/filtros-reportes"
import type { ReporteDB } from "@/database/queries/reportes/get-reportes"
import { getPriorityColor, getStatusColor, getCategoryColor } from "@/components/report-card"

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

type MapaClientProps = {
  reportesDB: ReporteDB[]
  categorias: { id: number; nombre: string }[]
  estados: { id: number; nombre: string }[]
  prioridades: { id: number; nombre: string }[]
  error: string | null
}

/**
 * Componente cliente que renderiza un mapa interactivo de reportes con una barra lateral listando reportes y un panel de filtros.
 *
 * Renderiza el mapa (cliente-only), controla la visibilidad responsiva del sidebar y del panel de filtros, transforma los registros de base de datos al formato esperado por el mapa y muestra estados de error o vacío.
 *
 * @param reportesDB - Array de registros crudos de reportes tal como provienen de la base de datos; se transforma internamente al formato usado por el mapa.
 * @param categorias - Opciones de categorías disponibles para los filtros.
 * @param estados - Opciones de estados disponibles para los filtros.
 * @param prioridades - Opciones de prioridades disponibles para los filtros.
 * @returns Un elemento React que contiene el mapa interactivo, la barra lateral de reportes y el panel de filtros.
 */
export function MapaClient({ reportesDB, categorias, estados, prioridades, error }: MapaClientProps) {
  // Inicializar siempre con false para evitar hydration mismatch
  // El useEffect ajustará el valor según el tamaño de pantalla
  const [showSidebar, setShowSidebar] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  /**
   * Efecto para inicializar y actualizar el estado del sidebar según el tamaño de pantalla
   * En desktop (>= 768px) se muestra por defecto, en mobile se oculta
   * Se ejecuta solo una vez al montar para evitar hydration errors
   */
  useEffect(() => {
    // Configurar el valor inicial basado en el tamaño de pantalla
    const isDesktop = window.innerWidth >= 768
    setShowSidebar(isDesktop)
    // Generar key única para el mapa
    setMapKey(Date.now())

    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Transformar los datos de BD al formato esperado por los componentes del mapa
  const reportes: ReporteParaMapa[] = reportesDB.map((reporte) => ({
    id: reporte.id,
    title: reporte.titulo,
    description: reporte.descripcion ?? "Sin descripción",
    category: reporte.categoria?.nombre ?? "Sin categoría",
    priority: reporte.prioridad?.nombre ?? "Sin prioridad",
    status: reporte.estado?.nombre ?? "Sin estado",
    location: `Lat ${reporte.lat!.toFixed(4)}, Lon ${reporte.lon!.toFixed(4)}`,
    coordinates: [reporte.lat!, reporte.lon!] as [number, number],
    author: reporte.autor?.username ?? "Anónimo",
    createdAt: reporte.created_at,
    image: reporte.fotos?.[0]?.url ?? undefined,
  }))

  /**
   * Maneja el cierre del panel de filtros en mobile después de aplicar un filtro
   */
  const handleFilterApplied = useCallback(() => {
    // Solo cerrar en dispositivos móviles (< 640px)
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setShowFilters(false)
    }
  }, [])

  return (
    <div className="bg-background">
      {/* Barra de control superior */}
      <div className="border-b bg-background shadow-sm z-30">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Controles izquierda */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden sm:flex shadow-sm h-9 px-3 whitespace-nowrap"
              >
                <Layers className="w-4 h-4 mr-2" />
                <span>{showSidebar ? "Ocultar" : "Mostrar"}</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="shadow-sm h-9 px-3 whitespace-nowrap"
              >
                <Map className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>

            {/* Contador de reportes y controles derecha */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold">{reportes.length}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">reportes</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="shadow-sm h-9 px-3 whitespace-nowrap"
              >
                <Link href="/reportes">
                  <List className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Vista Lista</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="flex-shrink-0 border-b bg-background shadow-md z-20 animate-in slide-in-from-top-5 duration-300 max-h-[70vh] overflow-y-auto">
          <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-xs md:text-sm">
                <Map className="w-4 h-4 text-primary" />
                Filtrar Reportes
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-7 w-7 md:h-8 md:w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <FiltrosReportes
              categorias={categorias}
              estados={estados}
              prioridades={prioridades}
              onFilterApplied={handleFilterApplied}
            />
          </div>
        </div>
      )}

      {/* Contenedor principal del mapa y sidebar */}
      <div className="flex h-[calc(100vh-160px)] overflow-hidden relative">
        {/* Backdrop para cerrar sidebar en mobile */}
        {showSidebar && (
          <div 
            className="sm:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Barra lateral con lista de reportes */}
        <div 
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
          } ${
            showSidebar ? 'w-full sm:w-80 md:w-96' : 'w-0 sm:w-0'
          } border-r bg-background transition-all duration-300 overflow-hidden flex-shrink-0 shadow-lg fixed sm:relative inset-y-0 left-0 z-30 sm:z-0`}
        >
          <div className="h-full overflow-y-auto">
            <div className="p-3 md:p-4 border-b bg-muted/30 sticky top-0 backdrop-blur-sm z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Reportes
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] md:text-xs px-1.5 md:px-2">
                  {reportes.length} en el mapa
                </Badge>
                {error && (
                  <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 md:px-2">
                    Error
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-3 md:p-4">
              {/* Mensaje de error */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Lista de reportes */}
              {!error && reportes.length === 0 && (
                <Alert className="border-dashed">
                  <MapPin className="w-4 h-4" />
                  <AlertTitle>No hay reportes</AlertTitle>
                  <AlertDescription>
                    No se encontraron reportes con los filtros aplicados.
                  </AlertDescription>
                </Alert>
              )}

              {!error && reportes.length > 0 && (
                <div className="space-y-3">
                  {reportes.map((report) => (
                    <Card 
                      key={report.id} 
                      className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0 ring-2 ring-background shadow-sm"
                            style={{ backgroundColor: getPriorityColor(report.priority) }}
                          />
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/reportes/${report.id}`} 
                              className="block"
                            >
                              <h4 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors flex items-center gap-1">
                                {report.title}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {report.description}
                              </p>
                              <div className="flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[10px] text-muted-foreground truncate">{report.location}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ borderColor: getStatusColor(report.status), color: getStatusColor(report.status) }}
                                >
                                  {report.status}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ borderColor: getCategoryColor(), color: getCategoryColor() }}
                                >
                                  {report.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ borderColor: getPriorityColor(report.priority), color: getPriorityColor(report.priority) }}
                                >
                                  {report.priority}
                                </Badge>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenedor del mapa */}
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          {error ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Error al cargar el mapa</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="w-full h-full" key={mapKey}>
              <MapContainer reports={reportes} showLegend={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}