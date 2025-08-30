"use client"

import dynamic from "next/dynamic"
import type { LeafletMapProps } from "@/components/leaflet-map"

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

interface MapContainerProps {
  reports: Report[]
}

const LeafletMap = dynamic<LeafletMapProps>(
  () => import("@/components/leaflet-map").then((m) => m.default),
  {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
  }
)

export function MapContainer({ reports }: MapContainerProps) {
  return (
    <>
      <LeafletMap reports={reports} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg z-[1000]">
        <h4 className="font-semibold text-sm mb-3">Leyenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Urgente</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Baja</span>
          </div>
        </div>
      </div>

      {/* Map Controls Info */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-[1000]">
        <p className="text-xs text-muted-foreground">Haz clic en los marcadores para ver detalles</p>
      </div>
    </>
  )
}
