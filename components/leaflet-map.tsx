"use client"

import { useEffect, useMemo } from "react"
import {
  MapContainer as RLMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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

export interface LeafletMapProps {
  reports: Report[]
}

function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || reports.length === 0) return
    const bounds = L.latLngBounds(reports.map((r) => [r.coordinates[0], r.coordinates[1]] as [number, number]))
    if (bounds.isValid() && bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), 14)
    } else if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1))
    }
  }, [map, reports])
  return null
}

export default function LeafletMap({ reports }: LeafletMapProps) {
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

  const iconsByPriority = useMemo(() => {
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
    return new Map<string, L.DivIcon>([
      ["Urgente", mk("#ef4444")],
      ["Media", mk("#f59e0b")],
      ["Baja", mk("#10b981")],
      ["default", mk("#6b7280")],
    ])
  }, [])

  const getIcon = (priority: string) => iconsByPriority.get(priority) ?? iconsByPriority.get("default")!

  return (
    <RLMapContainer center={[-27.3676, -55.8961]} zoom={13} className="w-full h-full" style={{ zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds reports={reports} />

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.coordinates[0], report.coordinates[1]]}
          icon={getIcon(report.priority)}
        >
          <Popup maxWidth={300} className="custom-popup">
            <div style={{ minWidth: 250 }}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
                  <a href={`/reportes/${report.id}`} style={{ color: "#059669", textDecoration: "none" }}>
                    {report.title}
                  </a>
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>📍</span> {report.location}
                </p>
              </div>

              {report.image ? (
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={report.image}
                    alt={report.title}
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                  />
                </div>
              ) : null}

              <p style={{ margin: 0, marginBottom: 8, fontSize: 14, color: "#374151", lineHeight: 1.4 }}>
                {report.description.length > 100 ? `${report.description.substring(0, 100)}...` : report.description}
              </p>

              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" as const }}>
                <span
                  style={{
                    backgroundColor: `${getStatusColor(report.status)}20`,
                    color: getStatusColor(report.status),
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    border: `1px solid ${getStatusColor(report.status)}40`,
                  }}
                >
                  {report.status}
                </span>
                <span
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid #d1d5db",
                  }}
                >
                  {report.category}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#6b7280" }}>
                <span>👤 {report.author}</span>
                <span>📅 {new Date(report.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </RLMapContainer>
  )
}
