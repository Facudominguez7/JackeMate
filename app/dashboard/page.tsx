"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Calendar, Trophy, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { ReportCard } from "@/components/report-card"
import { getPuntosUsuario } from "@/database/queries/puntos"

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

/**
 * Renders the authenticated user's dashboard including profile header, statistics, and a grid of the user's reports.
 *
 * Fetches the current user, the user's reports, and the user's points from Supabase on mount and shows a loading state while fetching.
 *
 * @returns The dashboard page JSX element containing the profile header, stats cards, and "Mis Reportes" section with report cards and links to create new reports.
 */
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [puntos, setPuntos] = useState(0)
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

        // Obtener puntos del usuario
        const { puntos: userPuntos } = await getPuntosUsuario(supabase, user.id)
        setPuntos(userPuntos)
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
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {getUserInitials(user.email || "US")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{user.email}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{userReports.length} {userReports.length === 1 ? 'reporte' : 'reportes'}</span>
                    </div>
                  </div>
                  
                  {/* Puntos del Usuario - Destacado */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40 rounded-full border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">
                          Puntos Totales
                        </p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                          {puntos}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 pl-4 border-l-2 border-amber-300 dark:border-amber-700">
                      <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                        ¡Sigue así!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userReports.length}</p>
                  <p className="text-xs text-muted-foreground">Reportes Creados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {userReports.filter(r => getNombre(r.estados).toLowerCase() === 'reparado').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Problemas Resueltos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{puntos}</p>
                  <p className="text-xs text-muted-foreground">Puntos Acumulados</p>
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