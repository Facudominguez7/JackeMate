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
import { getPriorityColor, getStatusColor, getCategoryColor } from "@/components/report-card"
import { ETIQUETAS_ESTADO_OPERATIVO, type EstadoOperativo } from "@/lib/authz/catalog"

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
  estadoOperativo?: EstadoOperativo | null
  cuadrillaNombre?: string | null
}

/**
 * Colores del popup (HTML plano) por estado operativo, calcados de las variantes de
 * `ChipEstadoOperativo` (`components/cuadrillas/chip-estado-operativo.tsx`).
 *
 * ponytail: el popup de Leaflet se arma como string HTML (no JSX), así que no se puede
 * renderizar `ChipEstadoOperativo` directamente acá; esta tabla duplica su mapeo de colores.
 * Si `ChipEstadoOperativo` cambia de paleta, actualizar también esta tabla.
 */
const ESTILO_ESTADO_OPERATIVO_POPUP: Record<EstadoOperativo, { border: string; bg: string; color: string }> = {
  en_progreso: {
    border: "var(--semantic-admin-border)",
    bg: "var(--semantic-admin-soft)",
    color: "var(--semantic-admin)",
  },
  cerrada: {
    border: "var(--border)",
    bg: "transparent",
    color: "var(--foreground)",
  },
}

/**
 * Props del componente LeafletMap
 */
export interface LeafletMapProps {
  reports: Report[]
  /**
   * Modo selección: si se pasa, al hacer click en un marcador se avisa qué reporte se eligió
   * (además de abrirse el popup habitual). Omitirlo deja el mapa en su comportamiento actual.
   */
  onSeleccionarReporte?: (reporteId: number) => void
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
    if (!map) return

    /**
     * Leaflet mide el contenedor una sola vez, al inicializarse. Si en ese momento el layout
     * todavía no terminó (mapa dentro de una pestaña, de un contenedor con alto por CSS, o
     * cargado dinámicamente), mide mal: los tiles no llenan el alto y `fitBounds` calcula
     * contra un tamaño incorrecto y termina mostrando el mundo entero.
     *
     * `invalidateSize()` lo obliga a volver a medir. Se llama antes de ajustar los límites.
     */
    const ajustarVista = () => {
      map.invalidateSize()

      if (reports.length === 0) return

      const bounds = L.latLngBounds(reports.map((r) => [r.coordinates[0], r.coordinates[1]] as [number, number]))
      if (!bounds.isValid()) return

      // Un solo reporte: no hay área que encuadrar, así que se centra con zoom fijo.
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setView(bounds.getCenter(), 15)
        return
      }

      map.fitBounds(bounds.pad(0.1))
    }

    // En el próximo frame el contenedor ya terminó de maquetarse.
    const frame = requestAnimationFrame(ajustarVista)

    // Y si el contenedor cambia de tamaño después (cambio de pestaña, responsive, zoom del
    // navegador), Leaflet necesita que se lo avisen: no lo detecta solo.
    const observador = new ResizeObserver(() => map.invalidateSize())
    observador.observe(map.getContainer())

    return () => {
      cancelAnimationFrame(frame)
      observador.disconnect()
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
  const color = count > 10 ? 'var(--map-heat-high)' : count > 5 ? 'var(--map-heat-medium)' : 'var(--map-heat-low)'
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
      color: var(--map-marker-foreground);
      font-weight: bold;
      font-size: ${fontSize}px;
      border: 3px solid var(--map-marker-stroke);
      box-shadow: var(--elevation-soft);
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
  statusColor: string,
  priorityColor: string,
  categoryColor: string
): string => {
  const safeTitle = escapeHtml(report.title)
  const safeLocation = escapeHtml(report.location)
  const safeDescription = escapeHtml(report.description)
  const safeCategory = escapeHtml(report.category)
  const safePriority = escapeHtml(report.priority)
  const safeStatus = escapeHtml(report.status)
  const safeAuthor = escapeHtml(report.author)
  const safeImage = report.image ? escapeHtml(report.image) : null

  const estiloEstadoOperativo = report.estadoOperativo
    ? ESTILO_ESTADO_OPERATIVO_POPUP[report.estadoOperativo]
    : null
  const chipEstadoOperativo = estiloEstadoOperativo
    ? `
        <span style="
          background-color: ${estiloEstadoOperativo.bg};
          color: ${estiloEstadoOperativo.color};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid ${estiloEstadoOperativo.border};
        ">
          ${escapeHtml(ETIQUETAS_ESTADO_OPERATIVO[report.estadoOperativo as EstadoOperativo])}${
            report.cuadrillaNombre ? ` · ${escapeHtml(report.cuadrillaNombre)}` : ""
          }
        </span>
      `
    : ""

  return `
    <div style="min-width: 250px;">
      <div style="margin-bottom: 8px;">
        <h3 style="margin: 0; margin-bottom: 4px; font-size: 16px; font-weight: 600; color: var(--foreground);">
          <a href="/reportes/${report.id}" style="color: var(--primary); text-decoration: none;">
            ${safeTitle}
          </a>
        </h3>
        <p style="margin: 0; font-size: 12px; color: var(--muted-foreground); display: flex; align-items: center; gap: 4px;">
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

      <p style="margin: 0; margin-bottom: 8px; font-size: 14px; color: var(--foreground); line-height: 1.4;">
        ${safeDescription.length > 100 ? `${safeDescription.substring(0, 100)}...` : safeDescription}
      </p>

      <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
        <span style="
          background-color: ${statusColor}15;
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
          background-color: ${categoryColor}15;
          color: ${categoryColor};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid ${categoryColor}40;
        ">
          ${safeCategory}
        </span>
        <span style="
          background-color: ${priorityColor}15;
          color: ${priorityColor};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid ${priorityColor}40;
        ">
          ${safePriority}
        </span>
        ${chipEstadoOperativo}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted-foreground);">
        <span>👤 ${safeAuthor}</span>
        <span>📅 ${new Date(report.createdAt).toLocaleDateString("es-AR")}</span>
      </div>
    </div>
  `
}

/**
 * Renderiza en el mapa un grupo de clusters que contiene un marcador por cada reporte y enlaza sus popups sanitizados.
 *
 * @param reports - Array de reportes a representar como marcadores
 * @param getIcon - Devuelve el `L.DivIcon` correspondiente a la prioridad proporcionada
 * @param getStatusColor - Devuelve el color (hex) asociado al estado, usado para estilizar el contenido del popup
 * @param getPriorityColor - Devuelve el color (hex) asociado a la prioridad, usado para estilizar el contenido del popup
 * @param getCategoryColor - Devuelve el color (hex) usado para categorías en el contenido del popup
 */
function MarkerClusterGroup({
  reports,
  getIcon,
  getStatusColor,
  getPriorityColor,
  getCategoryColor,
  onSeleccionarReporte
}: {
  reports: Report[]
  getIcon: (priority: string, conCuadrilla?: boolean) => L.DivIcon
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
  getCategoryColor: () => string
  onSeleccionarReporte?: (reporteId: number) => void
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
        icon: getIcon(report.priority, Boolean(report.estadoOperativo)),
      })

      // Crear contenido del popup de forma segura
      const popupContent = createPopupContent(
        report, 
        getStatusColor(report.status),
        getPriorityColor(report.priority),
        getCategoryColor()
      )
      marker.bindPopup(popupContent, { maxWidth: 300 })

      // Modo selección (opcional): además de abrir el popup, el click avisa qué reporte se
      // eligió. Sin este callback el mapa se comporta exactamente como siempre.
      if (onSeleccionarReporte) {
        marker.on("click", () => onSeleccionarReporte(report.id))
      }

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
  }, [map, reports, getIcon, getStatusColor, getPriorityColor, getCategoryColor, onSeleccionarReporte])

  return null
}

/**
 * Renderiza un mapa Leaflet con marcadores agrupados que representan los reportes.
 *
 * Ajusta automáticamente la vista para incluir todos los reportes, utiliza tiles de OpenStreetMap,
 * colorea marcadores según prioridad y muestra popups sanitizados con los detalles de cada reporte.
 *
 * @param reports - Lista de objetos `Report` que se mostrarán como marcadores en el mapa
 * @returns El elemento React que contiene el mapa Leaflet con clustering, ajuste automático de vista y popups por reporte
 */
export default function LeafletMap({ reports, onSeleccionarReporte }: LeafletMapProps) {
  const [mapKey, setMapKey] = useState(0)

  // Re-renderizar el mapa solo al montar el componente
  useEffect(() => {
    setMapKey(Date.now())
  }, [])

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
    const mk = (color: string, conCuadrilla = false) =>
      L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="
              background-color: ${color};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid var(--map-marker-stroke);
              box-shadow: var(--elevation-soft);
              display: flex;
              align-items: center;
              justify-content: center;
              ${conCuadrilla ? "opacity: 0.5;" : ""}
            ">
              <div style="
                width: 8px;
                height: 8px;
                background-color: var(--map-marker-foreground);
                border-radius: 50%;
              "></div>
            </div>
            ${
              conCuadrilla
                ? `<div title="Con cuadrilla asignada" style="
                     position: absolute;
                     top: -3px;
                     right: -3px;
                     width: 12px;
                     height: 12px;
                     border-radius: 50%;
                     background-color: var(--semantic-admin);
                     border: 2px solid var(--map-marker-stroke);
                   "></div>`
                : ""
            }
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

    // Mapeo de prioridades a colores (usando los mismos colores que report-card.tsx).
    // Cada prioridad tiene dos variantes: sin cuadrilla (normal) y con cuadrilla asignada
    // (atenuada y con un punto de aviso), para que el operador distinga de un vistazo qué
    // reportes ya están cubiertos sin tener que abrir cada popup.
    const clave = (prioridad: string, conCuadrilla: boolean) => `${prioridad}|${conCuadrilla ? "asignado" : "libre"}`

    const mapa = new Map<string, L.DivIcon>()
    for (const prioridad of ["Alta", "Media", "Baja", "default"]) {
      const color = prioridad === "default" ? "var(--map-heat-neutral)" : getPriorityColor(prioridad)
      mapa.set(clave(prioridad, false), mk(color, false))
      mapa.set(clave(prioridad, true), mk(color, true))
    }

    return mapa
  }, [])

  /**
   * Obtiene el icono correcto según la prioridad
   * Normaliza el nombre de la prioridad para manejar mayúsculas/minúsculas
   * @param priority - Nombre de la prioridad
   * @returns Icono de Leaflet correspondiente
   */
  const getIcon = (priority: string, conCuadrilla = false) => {
    // Normalizar el nombre de la prioridad para búsqueda case-insensitive
    const normalized = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    const sufijo = conCuadrilla ? "asignado" : "libre"
    return (
      iconsByPriority.get(`${normalized}|${sufijo}`) ?? iconsByPriority.get(`default|${sufijo}`)!
    )
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
        getPriorityColor={getPriorityColor}
        getCategoryColor={getCategoryColor}
        onSeleccionarReporte={onSeleccionarReporte}
      />
    </RLMapContainer>
  )
}
