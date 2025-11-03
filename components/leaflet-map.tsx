/**
 * Componente de mapa interactivo con Leaflet
 * 
 * Renderiza un mapa usando React-Leaflet con:
 * - Marcadores personalizados por prioridad
 * - Clustering automático para marcadores cercanos (evita superposición)
 * - Popups con información detallada de cada reporte
 * - Ajuste automático de zoom para mostrar todos los reportes
 * - Tiles de OpenStreetMap
 */

"use client"

import { useEffect, useMemo, useRef, useCallback, useState } from "react"
import {
  MapContainer as RLMapContainer,
  TileLayer,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet.markercluster"

/**
 * Interfaz que representa un reporte para mostrar en el mapa
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
 * Props del componente LeafletMap
 */
export interface LeafletMapProps {
  reports: Report[]
}

/**
 * Ajusta la vista del mapa para que todos los reportes sean visibles.
 *
 * Centra el mapa con un zoom fijo cuando sólo hay un reporte; si hay varios,
 * ajusta los límites del mapa para mostrar todos los reportes con un padding del 10%.
 *
 * @param reports - Array de reportes cuya propiedad `coordinates` ([lat, lng]) se usa para calcular los límites del mapa
 */
function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map || reports.length === 0) return
    
    // Crear límites geográficos basados en las coordenadas de los reportes
    const bounds = L.latLngBounds(reports.map((r) => [r.coordinates[0], r.coordinates[1]] as [number, number]))
    
    // Si hay un solo reporte, centrar con zoom fijo
    if (bounds.isValid() && bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), 14)
    } 
    // Si hay múltiples reportes, ajustar zoom para mostrar todos
    else if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1))
    }
  }, [map, reports])
  
  return null
}

/**
 * Crea el HTML del ícono del cluster de forma segura
 * Evita inyección de HTML al usar solo valores numéricos y constantes
 */
const createClusterIconHTML = (count: number): string => {
  const size = count > 10 ? 50 : count > 5 ? 40 : 30
  const color = count > 10 ? '#ef4444' : count > 5 ? '#f97316' : '#3b82f6'
  const fontSize = count > 10 ? 16 : count > 5 ? 14 : 12

  return `
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
      font-size: ${fontSize}px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      ${count}
    </div>
  `
}

/**
 * Sanitiza texto para prevenir XSS
 * Escapa caracteres HTML peligrosos
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Crea el contenido HTML del popup de forma segura
 * Sanitiza todos los datos del usuario
 */
const createPopupContent = (
  report: Report,
  statusColor: string
): string => {
  const safeTitle = escapeHtml(report.title)
  const safeLocation = escapeHtml(report.location)
  const safeDescription = escapeHtml(report.description)
  const safeCategory = escapeHtml(report.category)
  const safeStatus = escapeHtml(report.status)
  const safeAuthor = escapeHtml(report.author)
  const safeImage = report.image ? escapeHtml(report.image) : null

  return `
    <div style="min-width: 250px;">
      <div style="margin-bottom: 8px;">
        <h3 style="margin: 0; margin-bottom: 4px; font-size: 16px; font-weight: 600; color: #1f2937;">
          <a href="/reportes/${report.id}" style="color: #059669; text-decoration: none;">
            ${safeTitle}
          </a>
        </h3>
        <p style="margin: 0; font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
          <span>📍</span> ${safeLocation}
        </p>
      </div>

      ${safeImage ? `
        <div style="margin-bottom: 8px;">
          <img
            src="${safeImage}"
            alt="${safeTitle}"
            style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;"
          />
        </div>
      ` : ''}

      <p style="margin: 0; margin-bottom: 8px; font-size: 14px; color: #374151; line-height: 1.4;">
        ${safeDescription.length > 100 ? `${safeDescription.substring(0, 100)}...` : safeDescription}
      </p>

      <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
        <span style="
          background-color: ${statusColor}20;
          color: ${statusColor};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid ${statusColor}40;
        ">
          ${safeStatus}
        </span>
        <span style="
          background-color: #f3f4f6;
          color: #374151;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #d1d5db;
        ">
          ${safeCategory}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #6b7280;">
        <span>👤 ${safeAuthor}</span>
        <span>📅 ${new Date(report.createdAt).toLocaleDateString("es-AR")}</span>
      </div>
    </div>
  `
}

/**
 * Renderiza un grupo de clusters de marcadores en el mapa y añade un marcador por cada reporte con su popup sanitizado.
 *
 * Crea un MarkerClusterGroup con configuración personalizada, genera el icono del cluster según la cantidad de marcadores, añade marcadores coloreados según la prioridad y vincula popups que usan el color del estado.
 *
 * @param reports - Lista de reportes que se representarán como marcadores
 * @param getIcon - Función que recibe la prioridad del reporte y devuelve el `L.DivIcon` correspondiente
 * @param getStatusColor - Función que recibe el estado del reporte y devuelve el color (hex) usado en el contenido del popup
 */
function MarkerClusterGroup({ 
  reports, 
  getIcon, 
  getStatusColor 
}: { 
  reports: Report[]
  getIcon: (priority: string) => L.DivIcon
  getStatusColor: (status: string) => string
}) {
  const map = useMap()
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    if (!map) return

    // Limpiar cluster anterior si existe
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
    }

    // Crear grupo de clusters con configuración personalizada
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      animate: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size = count > 10 ? 50 : count > 5 ? 40 : 30

        return L.divIcon({
          html: createClusterIconHTML(count),
          className: 'custom-cluster-icon',
          iconSize: L.point(size, size),
        })
      },
    })

    clusterGroupRef.current = clusterGroup

    // Agregar marcadores al cluster
    reports.forEach((report) => {
      const marker = L.marker([report.coordinates[0], report.coordinates[1]], {
        icon: getIcon(report.priority),
      })

      // Crear contenido del popup de forma segura
      const popupContent = createPopupContent(report, getStatusColor(report.status))
      marker.bindPopup(popupContent, { maxWidth: 300 })
      
      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)

    // Cleanup: remover el cluster group al desmontar
    return () => {
      if (clusterGroupRef.current && map) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current = null
      }
    }
  }, [map, reports, getIcon, getStatusColor])

  return null
}

/**
 * Renderiza un mapa interactivo con Leaflet que muestra reportes como marcadores agrupados y priorizados.
 *
 * El mapa incluye tiles de OpenStreetMap, ajuste automático de vista según los reportes, agrupamiento (clustering)
 * de marcadores y popups sanitizados con detalles de cada reporte. Los marcadores se colorean según la prioridad
 * y el estado del reporte.
 *
 * @param reports - Lista de reportes cuya ubicación y metadatos se usan para crear marcadores y popups.
 * @returns El elemento React que contiene el mapa Leaflet con clustering y ajuste automático de vista.
 */
export default function LeafletMap({ reports }: LeafletMapProps) {
  const [mapKey, setMapKey] = useState(0)

  // Re-renderizar el mapa solo al montar el componente
  useEffect(() => {
    setMapKey(Date.now())
  }, [])

  /**
   * Obtiene el color para el estado del reporte
   * @param status - Nombre del estado
   * @returns Color hex correspondiente
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resuelto":
        return "#10b981"
      case "En Progreso":
        return "#3b82f6"
      case "Reportado":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  /**
   * Genera iconos personalizados para los marcadores según la prioridad
   * Usa useMemo para evitar recrear los iconos en cada render
   */
  const iconsByPriority = useMemo(() => {
    /**
     * Función auxiliar para crear un icono personalizado
     * @param color - Color hex del marcador
     * @returns Icono de Leaflet personalizado
     */
    const mk = (color: string) =>
      L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    
    // Mapeo de prioridades a colores: Alta/Urgente=Rojo, Media=Amarillo, Baja=Verde
    return new Map<string, L.DivIcon>([
      ["Urgente", mk("#ef4444")],  // Rojo para urgente
      ["Alta", mk("#ef4444")],     // Rojo para alta
      ["Media", mk("#f59e0b")],    // Amarillo para media
      ["Baja", mk("#10b981")],     // Verde para baja
      ["default", mk("#6b7280")],  // Gris por defecto
    ])
  }, [])

  /**
   * Obtiene el icono correcto según la prioridad
   * Normaliza el nombre de la prioridad para manejar mayúsculas/minúsculas
   * @param priority - Nombre de la prioridad
   * @returns Icono de Leaflet correspondiente
   */
  const getIcon = (priority: string) => {
    // Normalizar el nombre de la prioridad para búsqueda case-insensitive
    const normalized = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    return iconsByPriority.get(normalized) ?? iconsByPriority.get("default")!
  }

  return (
    <RLMapContainer 
      key={mapKey}
      center={[-27.3676, -55.8961]} 
      zoom={13} 
      className="w-full h-full" 
      style={{ zIndex: 0 }}
      scrollWheelZoom={true}
    >
      {/* Capa de tiles de OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Componente para ajustar el zoom automáticamente */}
      <FitBounds reports={reports} />

      {/* Componente de clustering que agrupa marcadores cercanos */}
      <MarkerClusterGroup 
        reports={reports} 
        getIcon={getIcon} 
        getStatusColor={getStatusColor} 
      />
    </RLMapContainer>
  )
}