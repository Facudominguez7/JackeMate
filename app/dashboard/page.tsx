"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Plus, Calendar } from "lucide-react"
import Link from "next/link"

type UserReport = {
  id: number
  titulo: string
  created_at: string
  categorias: any
  prioridades: any
  estados: any
  fotos_reporte: any
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Reparado":
      return "bg-green-50 text-green-700 border-green-200"
    case "Pendiente":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    default:
      return ""
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Alta":
      return "destructive"
    case "Media":
      return "secondary"
    case "Baja":
      return "outline"
      case "Rechazado":
        return "ghost"
    default:
      return "outline"
  }
}

const getNombre = (obj: any): string => {
  if (!obj) return "N/A"
  if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A"
  if (obj.nombre) return obj.nombre
  return "N/A"
}

const getImageUrl = (fotos: any): string => {
  if (!fotos) return "/placeholder.svg"
  if (Array.isArray(fotos) && fotos.length > 0 && fotos[0].url) return fotos[0].url
  return "/placeholder.svg"
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndReports = async () => {
      try {
        // Obtener usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setLoading(false)
          return
        }

        setUser(user)

        // Obtener reportes del usuario
        const { data: reportes, error: reportesError } = await supabase
          .from('reportes')
          .select(`
            id,
            titulo,
            created_at,
            categorias (nombre),
            prioridades (nombre),
            estados (nombre),
            fotos_reporte (url)
          `)
          .eq('usuario_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (!reportesError && reportes) {
          setUserReports(reportes)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndReports()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">{getUserInitials(user.email || "US")}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-foreground mb-1">{user.email}</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {userReports.length} {userReports.length === 1 ? 'reporte creado' : 'reportes creados'}
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

          {userReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground mb-4">Aún no has creado ningún reporte</p>
                <Button asChild>
                  <Link href="/reportes/nuevo">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Mi Primer Reporte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userReports.map((report) => (
                <Link key={report.id} href={`/reportes/${report.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {report.titulo}
                        </CardTitle>
                        <Badge variant={getPriorityColor(getNombre(report.prioridades)) as any}>
                          {getNombre(report.prioridades)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                          <img
                            src={getImageUrl(report.fotos_reporte) || "/placeholder.svg"}
                            alt={report.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(getNombre(report.estados))}>
                            {getNombre(report.estados)}
                          </Badge>
                          <Badge variant="outline">{getNombre(report.categorias)}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{new Date(report.created_at).toLocaleDateString("es-AR")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
