"use client"

import { MapContainer as RLMapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type MiniMapProps = {
  lat: number
  lon: number
}

/**
 * Renderiza una vista previa de mapa centrada en las coordenadas proporcionadas.
 *
 * @param lat - Latitud en grados decimales del centro del mapa
 * @param lon - Longitud en grados decimales del centro del mapa
 * @returns Un elemento JSX que muestra un mapa no interactivo con un marcador circular en la posición indicada
 */
export function MiniMap({ lat, lon }: MiniMapProps) {
  const center: [number, number] = [lat, lon]
  return (
    <div className="w-full h-full">
      <RLMapContainer
        center={center}
        zoom={15}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ zIndex: 0 }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        keyboard={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.8 }}
        />
      </RLMapContainer>
    </div>
  )
}