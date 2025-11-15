"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { toast } from "sonner"

// Configurar el ícono del marcador
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Límites geográficos de Posadas, Misiones, Argentina
// Coordenadas aproximadas que cubren toda el área urbana y suburbana de Posadas
const POSADAS_BOUNDS: L.LatLngBoundsExpression = [
  [-27.45, -55.98],  // Suroeste (límite inferior izquierdo)
  [-27.35, -55.88],  // Noreste (límite superior derecho)
]

// Verificar si una coordenada está dentro de los límites de Posadas
const isWithinPosadasBounds = (lat: number, lng: number): boolean => {
  const bounds = L.latLngBounds(POSADAS_BOUNDS)
  return bounds.contains([lat, lng])
}

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lon: number) => void
  initialLat?: number | null
  initialLon?: number | null
}

/**
 * Muestra y controla un marcador en el mapa que permite seleccionar una ubicación mediante clics y notifica las coordenadas seleccionadas.
 *
 * Mantiene el estado del marcador inicializado desde `initialLat`/`initialLon` si se proporcionan, actualiza su posición al hacer clic en el mapa (solo si la ubicación está dentro de los límites definidos) y llama a `onLocationSelect` con la latitud y longitud seleccionadas.
 *
 * @param onLocationSelect - Callback invocado con `lat` y `lon` cuando el usuario selecciona una ubicación válida
 * @param initialLat - Latitud inicial del marcador; si no se proporciona, el marcador no aparece hasta que el usuario haga clic
 * @param initialLon - Longitud inicial del marcador; se usa junto con `initialLat` para posicionar el marcador inicial
 * @returns El componente `Marker` posicionado en las coordenadas seleccionadas, o `null` si no hay posición definida
 */
function LocationMarker({ onLocationSelect, initialLat, initialLon }: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLon ? [initialLat, initialLon] : null
  )

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      
      // Validar que la ubicación esté dentro de los límites de Posadas
      if (!isWithinPosadasBounds(lat, lng)) {
        toast.error("Ubicación fuera de rango", {
          description: "Por favor, selecciona una ubicación dentro de Posadas, Misiones."
        })
        return
      }
      
      setPosition([lat, lng])
      onLocationSelect(lat, lng)
      
      // Mostrar toast de éxito
      toast.success("Ubicación seleccionada", {
        description: `Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`
      })
    },
  })

  useEffect(() => {
    if (initialLat && initialLon && !position) {
      setPosition([initialLat, initialLon])
      map.setView([initialLat, initialLon], 13)
    }
  }, [initialLat, initialLon, map, position])

  return position ? <Marker position={position} icon={markerIcon} /> : null
}

/**
 * Renderiza un mapa interactivo centrado en Posadas que permite seleccionar una ubicación vía clic.
 *
 * Muestra un marcador en la posición seleccionada (o en las coordenadas iniciales si se proporcionan),
 * restringe la navegación al área definida de Posadas y llama a `onLocationSelect` con latitud y longitud
 * cuando el usuario selecciona una posición válida dentro de los límites.
 *
 * @param onLocationSelect - Callback que recibe `(lat, lon)` cuando el usuario selecciona una ubicación válida
 * @param initialLat - Latitud inicial opcional para centrar el mapa y posicionar el marcador
 * @param initialLon - Longitud inicial opcional para centrar el mapa y posicionar el marcador
 * @returns El elemento React que renderiza el mapa y su interfaz de selección de ubicación
 */
export function LocationPickerMap({ onLocationSelect, initialLat, initialLon }: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }

  // Posadas, Misiones, Argentina como centro por defecto
  const defaultCenter: [number, number] = initialLat && initialLon 
    ? [initialLat, initialLon] 
    : [-27.3671, -55.8961]

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-muted relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        zoomControl={true}
        maxBounds={POSADAS_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={13}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          onLocationSelect={onLocationSelect} 
          initialLat={initialLat}
          initialLon={initialLon}
        />
      </MapContainer>
    </div>
  )
}