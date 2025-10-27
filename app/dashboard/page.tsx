"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { ReportCard } from "@/components/report-card"

type UserReport = {
  id: number
  titulo: string
  descripcion: string
  created_at: string
  categorias: any
  prioridades: any
  estados: any
  fotos_reporte: any
  profiles: any
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

const getUsername = (profiles: any): string => {
  if (!profiles) return "Anónimo"
  if (Array.isArray(profiles) && profiles.length > 0)
    return profiles[0].username || "Anónimo"
  if (profiles.username) return profiles.username
  return "Anónimo"
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
            descripcion,
            created_at,
            categorias (nombre),
            prioridades (nombre),
            estados (nombre),
            fotos_reporte (url),
            profiles (username)
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
                <ReportCard
                  key={report.id}
                  id={report.id}
                  titulo={report.titulo}
                  descripcion={report.descripcion}
                  categoria={getNombre(report.categorias)}
                  prioridad={getNombre(report.prioridades)}
                  estado={getNombre(report.estados)}
                  imageUrl={getImageUrl(report.fotos_reporte)}
                  createdAt={report.created_at}
                  autor={getUsername(report.profiles)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
