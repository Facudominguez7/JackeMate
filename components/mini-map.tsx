"use client"

import { MapContainer as RLMapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type MiniMapProps = {
  lat: number
  lon: number
}

/**
 * Render a compact, non-interactive Leaflet map preview centered on the provided coordinates.
 *
 * The map disables user interactions (zooming, dragging, keyboard/touch controls) and shows a simple
 * center marker to avoid using Leaflet's default icon assets, suitable for use inside cards or small UIs.
 *
 * @param lat - Latitude in decimal degrees for the map center
 * @param lon - Longitude in decimal degrees for the map center
 * @returns A JSX element containing the non-interactive map preview centered at the given coordinates
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