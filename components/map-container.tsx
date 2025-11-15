/**
 * Contenedor del mapa con componentes adicionales
 * 
 * Este componente envuelve el mapa de Leaflet y agrega:
 * - Leyenda de colores por prioridad
 * - Instrucciones de uso del mapa
 * - Manejo de carga dinámica para evitar SSR
 */

"use client"

import dynamic from "next/dynamic"
import type { LeafletMapProps } from "@/components/leaflet-map"
import { getPriorityColor } from "@/components/report-card"
import { LoadingLogo } from "@/components/loading-logo"

/**
 * Interfaz que representa un reporte con sus datos para visualizar en el mapa
 */
interface Report {
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
 * Props del componente MapContainer
 */
interface MapContainerProps {
  reports: Report[]
  showLegend?: boolean
}

/**
 * Importación dinámica del mapa de Leaflet
 * Necesario para evitar errores de SSR ya que Leaflet requiere el objeto window
 */
const LeafletMap = dynamic<LeafletMapProps>(
  () => import("@/components/leaflet-map").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingLogo size="md" />
      </div>
    ),
  }
)

/**
 * Renderiza el contenedor del mapa con el componente de Leaflet y las superposiciones de interfaz.
 *
 * @param reports - Array de informes que se mostrarán como marcadores en el mapa
 * @param showLegend - Indica si se debe mostrar la leyenda de colores; por defecto `true`
 * @returns El elemento JSX que contiene el mapa y sus superposiciones (leyenda e instrucciones)
 */
export function MapContainer({ reports, showLegend = true }: MapContainerProps) {
  return (
    <div className="relative w-full h-full">
      {/* Componente principal del mapa de Leaflet */}
      <LeafletMap reports={reports} />

      {/* Leyenda de colores flotante - Ajustada para mobile */}
      {showLegend && (
        <div className="absolute bottom-16 left-2 sm:bottom-6 md:left-4 bg-card/95 backdrop-blur-sm border rounded-lg p-3 md:p-4 shadow-lg z-[1000] max-w-[140px] md:max-w-[160px]">
          <h4 className="font-semibold text-xs md:text-sm mb-2 md:mb-3">Leyenda</h4>
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
              <div 
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" 
                style={{ backgroundColor: getPriorityColor("Alta") }}
              ></div>
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
              <div 
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" 
                style={{ backgroundColor: getPriorityColor("Media") }}
              ></div>
              <span>Media</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
              <div 
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" 
                style={{ backgroundColor: getPriorityColor("Baja") }}
              ></div>
              <span>Baja</span>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones de uso del mapa - Oculta en mobile para no saturar */}
      <div className="hidden md:block absolute top-4 right-4 max-w-xs bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-[1000]">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="text-base">💡</span>
          <span>Haz clic en los marcadores para ver detalles</span>
        </p>
      </div>
    </div>
  )
}