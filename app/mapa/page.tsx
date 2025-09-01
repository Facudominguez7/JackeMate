"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, List, Layers } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Importar el mapa solo en el cliente para evitar "window is not defined"
const MapContainer = dynamic(
  () => import("@/components/map-container").then((m) => m.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  }
)

// Mock data for reports with coordinates
const mockReports = [
  {
    id: 1,
    title: "Bache en Av. Quaranta",
    description: "Bache de gran tamaño que dificulta el tránsito vehicular",
    category: "Vialidad",
    priority: "Urgente",
    status: "En Progreso",
    location: "Centro, Posadas",
    coordinates: [-27.3676, -55.8961] as [number, number], // Posadas center
    author: "María González",
    createdAt: "2024-01-15",
    image: "/bache-en-calle-de-posadas.png",
  },
  {
    id: 2,
    title: "Semáforo Descompuesto",
    description: "El semáforo de la intersección no funciona desde ayer",
    category: "Tránsito",
    priority: "Media",
    status: "Reportado",
    location: "Villa Cabello, Posadas",
    coordinates: [-27.3856, -55.8745] as [number, number],
    author: "Carlos Ruiz",
    createdAt: "2024-01-14",
    image: "/semaforo-roto-en-interseccion.png",
  },
  {
    id: 3,
    title: "Alumbrado Público Defectuoso",
    description: "Varias farolas sin funcionar en la cuadra",
    category: "Alumbrado",
    priority: "Baja",
    status: "Resuelto",
    location: "San Roque, Posadas",
    coordinates: [-27.3456, -55.9123] as [number, number],
    author: "Ana Martínez",
    createdAt: "2024-01-12",
    image: "/farola-de-luz-publica-apagada-de-noche.png",
  },
  {
    id: 4,
    title: "Basura Acumulada",
    description: "Acumulación de residuos en la esquina",
    category: "Limpieza",
    priority: "Media",
    status: "Reportado",
    location: "Villa Sarita, Posadas",
    coordinates: [-27.3789, -55.8834] as [number, number],
    author: "Pedro López",
    createdAt: "2024-01-13",
  },
  {
    id: 5,
    title: "Árbol Caído",
    description: "Árbol caído obstruye la vereda",
    category: "Espacios Verdes",
    priority: "Urgente",
    status: "En Progreso",
    location: "Centro, Posadas",
    coordinates: [-27.3612, -55.8978] as [number, number],
    author: "Laura Fernández",
    createdAt: "2024-01-16",
  },
]

export default function MapaPage() {
  const [showSidebar, setShowSidebar] = useState(true)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgente":
        return "#ef4444" // red
      case "Media":
        return "#f59e0b" // amber
      case "Baja":
        return "#10b981" // emerald
      default:
        return "#6b7280" // gray
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resuelto":
        return "#10b981" // emerald
      case "En Progreso":
        return "#3b82f6" // blue
      case "Reportado":
        return "#f59e0b" // amber
      default:
        return "#6b7280" // gray
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">PosaCalles</h1>
                  <p className="text-sm text-muted-foreground">Mapa de Reportes</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                <Layers className="w-4 h-4 mr-2" />
                {showSidebar ? "Ocultar" : "Mostrar"} Lista
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reportes">
                  <List className="w-4 h-4 mr-2" />
                  Vista Lista
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r bg-card/50 backdrop-blur-sm overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Reportes en el Mapa</h2>
                <Badge variant="outline">{mockReports.length} reportes</Badge>
              </div>

              {/* Reports List */}
              <div className="space-y-3">
                {mockReports.map((report) => (
                  <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: getPriorityColor(report.priority) }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            <Link href={`/reportes/${report.id}`} className="hover:text-primary">
                              {report.title}
                            </Link>
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">{report.location}</p>
                          <div className="flex gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ color: getStatusColor(report.status) }}
                            >
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer reports={mockReports} />
        </div>
      </div>
    </div>
  )
}
