"use client"

import { MapContainer as RLMapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type MiniMapProps = {
  lat: number
  lon: number
}

/**
 * MiniMap: vista previa del mapa centrada en una coordenada.
 * - No interactiva (sin zoom/drag) para evitar conflictos en la tarjeta
 * - Usa CircleMarker para evitar problemas de assets de íconos de Leaflet
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
