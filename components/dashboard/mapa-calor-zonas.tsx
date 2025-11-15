"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZonaConReportes } from "@/database/queries/interesado"
import { MapPin, ChevronDown, ChevronUp } from "lucide-react"
import dynamic from "next/dynamic"

type Props = {
  zonas: ZonaConReportes[]
  height?: string
}

/**
 * Componente interno que renderiza el mapa con Leaflet
 */
function MapaCalorInterno({ zonas, height }: { zonas: ZonaConReportes[], height: string }) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined" || !mapContainerRef.current) return

    // Importar Leaflet dinámicamente
    import("leaflet").then((L) => {
      // Limpiar mapa existente
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      if (!mapContainerRef.current) return

      // Calcular centro del mapa
      const centerLat = zonas.reduce((sum, zona) => sum + zona.lat, 0) / zonas.length
      const centerLon = zonas.reduce((sum, zona) => sum + zona.lon, 0) / zonas.length

      // Crear mapa
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false, // Deshabilitado para evitar zoom accidental al hacer scroll
        doubleClickZoom: true,
        touchZoom: true,
      }).setView([centerLat, centerLon], 12)

      // Agregar capa de tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Agregar marcadores para cada zona
      zonas.forEach((zona, index) => {
        // Determinar color según cantidad
        let color = "#eab308" // amarillo (baja)
        let size = 20
        
        if (zona.cantidad >= 10) {
          color = "#ef4444" // rojo (alta)
          size = 40
        } else if (zona.cantidad >= 5) {
          color = "#f97316" // naranja (media)
          size = 30
        }

        // Crear ícono personalizado
        const icon = L.divIcon({
          html: `
            <div style="
              background-color: ${color};
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size > 30 ? 14 : 12}px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              ${zona.cantidad}
            </div>
          `,
          className: "custom-heat-marker",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        // Crear marcador
        const marker = L.marker([zona.lat, zona.lon], { icon }).addTo(map)

        // Agregar popup con información
        const fechaFormateada = new Date(zona.ultimoReporte).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

        marker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              Zona ${index + 1}
            </h3>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Reportes:</strong> ${zona.cantidad}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Último reporte:</strong><br/>${fechaFormateada}
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #666;">
              Lat: ${zona.lat.toFixed(4)}, Lon: ${zona.lon.toFixed(4)}
            </p>
          </div>
        `)
      })

      // Ajustar vista para mostrar todos los marcadores
      if (zonas.length > 0) {
        const bounds = L.latLngBounds(zonas.map(z => [z.lat, z.lon]))
        map.fitBounds(bounds, { padding: [50, 50] })
      }

      mapRef.current = map
    })

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [zonas, height])

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height, 
        width: "100%", 
        borderRadius: "8px", 
        overflow: "hidden",
        position: "relative",
        zIndex: 0
      }}
    />
  )
}

// Importar dinámicamente para evitar SSR
const MapaDinamico = dynamic(
  () => Promise.resolve(MapaCalorInterno),
  { ssr: false, loading: () => (
    <div style={{ height: "400px", width: "100%" }} className="flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  )}
)

/**
 * Componente que muestra un mapa de calor con las zonas que tienen más reportes.
 * 
 * @param zonas - Array de zonas con coordenadas y cantidad de reportes
 * @param height - Altura del mapa (default: "400px")
 */
export function MapaCalorZonas({ zonas, height = "400px" }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!zonas || zonas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Calor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay datos disponibles para mostrar en el mapa
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Calor - Zonas con Más Reportes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar Mapa
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Mostrar Mapa
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded && (
          <>
            <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
              <MapaDinamico zonas={zonas} height={height} />
            </div>
            
            {/* Leyenda del mapa */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Alta concentración (10+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Media (5-9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Baja (1-4)</span>
              </div>
            </div>
          </>
        )}
        
        {!isExpanded && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Haz clic en "Mostrar Mapa" para ver las zonas con más reportes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
