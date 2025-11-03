"use client"

import { MapContainer as RLMapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type MiniMapProps = {
  lat: number
  lon: number
}

/**
 * Render a small, non-interactive map preview centered on the given coordinates.
 *
 * The map is disabled for user interaction and displays a circular marker at the center to avoid Leaflet icon asset issues.
 *
 * @param lat - Center latitude in decimal degrees
 * @param lon - Center longitude in decimal degrees
 * @returns A JSX element containing a non-interactive Leaflet map centered at `[lat, lon]` with a CircleMarker at the center
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