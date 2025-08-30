"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

// Mock user data
const mockUser = {
  name: "María González",
  email: "maria.gonzalez@email.com",
  initials: "MG",
  joinDate: "2023-08-15",
}

// Mock user reports
const mockUserReports = [
  {
    id: 1,
    title: "Bache en Av. Quaranta",
    status: "En Progreso",
    priority: "Urgente",
    category: "Vialidad",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Alumbrado Defectuoso en San Roque",
    status: "Resuelto",
    priority: "Media",
    category: "Alumbrado",
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    title: "Basura Acumulada en Villa Sarita",
    status: "Reportado",
    priority: "Baja",
    category: "Limpieza",
    createdAt: "2024-01-08",
  },
  {
    id: 4,
    title: "Semáforo Descompuesto en Centro",
    status: "En Progreso",
    priority: "Urgente",
    category: "Tránsito",
    createdAt: "2024-01-05",
  },
  {
    id: 5,
    title: "Árbol Caído en Villa Cabello",
    status: "Resuelto",
    priority: "Media",
    category: "Espacios Verdes",
    createdAt: "2024-01-03",
  },
]

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

export default function DashboardPage() {
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
                  <p className="text-sm text-muted-foreground">Mi Dashboard</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" asChild>
                <Link href="/reportes/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Reporte
                </Link>
              </Button>
              <LogoutButton size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">{mockUser.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">{mockUser.name}</h2>
                  <p className="text-muted-foreground mb-2">{mockUser.email}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Miembro desde {new Date(mockUser.joinDate).toLocaleDateString("es-AR")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Mis Reportes</h3>
              <p className="text-muted-foreground">Gestiona todos tus reportes creados</p>
            </div>
            <Button asChild>
              <Link href="/reportes/nuevo">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Reporte
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockUserReports.map((report) => (
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                      <Badge variant="outline">{report.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(report.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
