"use client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Plus, Search, Calendar, User } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

// Mock data for reports
const mockReports = [
  {
    id: 1,
    title: "Bache en Av. Quaranta",
    description: "Bache de gran tamaño que dificulta el tránsito vehicular en la intersección con Av. López y Planes",
    category: "Vialidad",
    priority: "Urgente",
    status: "En Progreso",
    location: "Centro, Posadas",
    author: "María González",
    createdAt: "2024-01-15",
    image: "/bache-en-calle-de-posadas.png",
  },
  {
    id: 2,
    title: "Semáforo Descompuesto",
    description: "El semáforo de la intersección no funciona desde ayer, causando problemas de tránsito",
    category: "Tránsito",
    priority: "Media",
    status: "Reportado",
    location: "Villa Cabello, Posadas",
    author: "Carlos Ruiz",
    createdAt: "2024-01-14",
    image: "/semaforo-roto-en-interseccion.png",
  },
  {
    id: 3,
    title: "Alumbrado Público Defectuoso",
    description: "Varias farolas sin funcionar en la cuadra, generando inseguridad nocturna",
    category: "Alumbrado",
    priority: "Baja",
    status: "Resuelto",
    location: "San Roque, Posadas",
    author: "Ana Martínez",
    createdAt: "2024-01-12",
    image: "/farola-de-luz-publica-apagada-de-noche.png",
  },
]

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
    default:
      return ""
  }
}

export default function ReportesPage() {
  const { user, loading } = useAuth()
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
                  <p className="text-sm text-muted-foreground">Reportes Públicos</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {!loading && user && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">Mi Dashboard</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/reportes/nuevo">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Reporte
                    </Link>
                  </Button>
                  <LogoutButton size="sm" />
                </>
              )}
              {!loading && !user && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth">Iniciar Sesión</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth">Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Reportes Públicos</h2>
          <p className="text-muted-foreground">Explora todos los reportes de problemas públicos en Posadas</p>
        </div>

        {/* Filters */}
        <div className="mb-8 p-6 bg-card rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar reportes..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="vialidad">Vialidad</SelectItem>
                <SelectItem value="transito">Tránsito</SelectItem>
                <SelectItem value="alumbrado">Alumbrado</SelectItem>
                <SelectItem value="limpieza">Limpieza</SelectItem>
                <SelectItem value="seguridad">Seguridad</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="reportado">Reportado</SelectItem>
                <SelectItem value="en-progreso">En Progreso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    <Link href={`/reportes/${report.id}`} className="hover:text-primary">
                      {report.title}
                    </Link>
                  </CardTitle>
                  <Badge variant={getPriorityColor(report.priority) as any}>{report.priority}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {report.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  <img
                    src={report.image || "/placeholder.svg"}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{report.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    <Badge variant="outline">{report.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {report.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Cargar Más Reportes
          </Button>
        </div>
      </div>
    </div>
  )
}
