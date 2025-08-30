"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, ArrowLeft, Calendar, Flag, Share2, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

// Mock data for individual report
const mockReport = {
  id: 1,
  title: "Bache en Av. Quaranta",
  description:
    "Bache de gran tamaño que dificulta el tránsito vehicular en la intersección con Av. López y Planes. El problema se ha agravado con las últimas lluvias y representa un peligro para motociclistas y ciclistas.",
  category: "Vialidad",
  priority: "Urgente",
  status: "En Progreso",
  location: "Av. Quaranta y López y Planes, Centro, Posadas",
  author: "María González",
  authorInitials: "MG",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-16T14:20:00Z",
  images: ["/bache-en-calle-de-posadas.png"],
  timeline: [
    {
      id: 1,
      type: "status",
      status: "Reportado",
      description: "Reporte creado por el ciudadano",
      date: "2024-01-15T10:30:00Z",
      author: "María González",
      authorInitials: "MG",
    },
    {
      id: 2,
      type: "status",
      status: "Verificado",
      description: "Reporte verificado por el equipo municipal",
      date: "2024-01-15T16:45:00Z",
      author: "Municipalidad de Posadas",
      authorInitials: "MP",
    },
    {
      id: 3,
      type: "status",
      status: "En Progreso",
      description: "Trabajo asignado al equipo de vialidad",
      date: "2024-01-16T09:15:00Z",
      author: "Dirección de Vialidad",
      authorInitials: "DV",
    },
  ],
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgente":
      return "destructive"
    case "Media":
      return "secondary"
    case "Baja":
      return "outline"
    default:
      return "outline"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Resuelto":
      return "bg-green-50 text-green-700 border-green-200"
    case "En Progreso":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Reportado":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    case "Verificado":
      return "bg-purple-50 text-purple-700 border-purple-200"
    default:
      return ""
  }
}

export default function ReporteDetallePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const [timeline, setTimeline] = useState(mockReport.timeline)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newUpdate, setNewUpdate] = useState({
    status: "",
    description: "",
  })

  const handleAddUpdate = () => {
    if (!user) return
    if (newUpdate.status && newUpdate.description) {
      const update = {
        id: timeline.length + 1,
        type: "status" as const,
        status: newUpdate.status,
        description: newUpdate.description,
        date: new Date().toISOString(),
        author: (user.user_metadata?.full_name as string) || user.email || "Usuario",
        authorInitials: ((user.user_metadata?.full_name as string) || user.email || "U").slice(0, 2).toUpperCase(),
      }
      setTimeline([...timeline, update])
      setNewUpdate({ status: "", description: "" })
      setShowUpdateForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/reportes" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">PosaCalles</h1>
                  <p className="text-sm text-muted-foreground">Detalle del Reporte</p>
                </div>
              </Link>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reportes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(mockReport.priority) as any}>{mockReport.priority}</Badge>
                      <Badge className={getStatusColor(mockReport.status)}>{mockReport.status}</Badge>
                      <Badge variant="outline">{mockReport.category}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{mockReport.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {mockReport.location}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed mb-6">{mockReport.description}</p>

                {/* Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {mockReport.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Imagen ${index + 1} del reporte`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Author and Date */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{mockReport.authorInitials}</AvatarFallback>
                    </Avatar>
                    <span>Reportado por {mockReport.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(mockReport.createdAt).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cronología del Reporte</CardTitle>
                    <CardDescription>Seguimiento de las actualizaciones y progreso del reporte</CardDescription>
                  </div>
                  {!loading && user ? (
                    <Button variant="outline" size="sm" onClick={() => setShowUpdateForm(!showUpdateForm)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Actualización
                    </Button>
                  ) : (
                    !loading && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/auth">Iniciar Sesión para actualizar</Link>
                      </Button>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showUpdateForm && user && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-4">Agregar Nueva Actualización</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Estado</label>
                        <Select onValueChange={(value) => setNewUpdate((prev) => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el nuevo estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Verificado">Verificado</SelectItem>
                            <SelectItem value="En Progreso">En Progreso</SelectItem>
                            <SelectItem value="Pausado">Pausado</SelectItem>
                            <SelectItem value="Resuelto">Resuelto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Descripción</label>
                        <Textarea
                          placeholder="Describe la actualización del estado..."
                          value={newUpdate.description}
                          onChange={(e) => setNewUpdate((prev) => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddUpdate} size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publicar Actualización
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowUpdateForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        {index < timeline.length - 1 && <div className="w-px h-12 bg-border mt-2"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(item.status)} variant="outline">
                            {item.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("es-AR")} a las{" "}
                            {new Date(item.date).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">{item.authorInitials}</AvatarFallback>
                          </Avatar>
                          <p className="text-xs text-muted-foreground">por {item.author}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado Actual</p>
                  <Badge className={getStatusColor(mockReport.status)}>{mockReport.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                  <Badge variant={getPriorityColor(mockReport.priority) as any}>{mockReport.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                  <Badge variant="outline">{mockReport.category}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                  <p className="text-sm">{new Date(mockReport.updatedAt).toLocaleDateString("es-AR")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Mapa Interactivo</p>
                    <p className="text-xs text-muted-foreground">Próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
