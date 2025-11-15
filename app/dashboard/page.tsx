"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Calendar, Trophy, Star, TrendingUp, FileText, CheckCircle, Clock, AlertCircle, BarChart3, Timer } from "lucide-react"
import Link from "next/link"
import { ReportCard } from "@/components/report-card"
import { getPuntosUsuario } from "@/database/queries/puntos"
import { LoadingLogo } from "@/components/loading-logo"
import { verificarPuedeVerDashboard, getEstadisticasInteresado, getReportesPorCategoria, getTiempoPromedioResolucion, getZonasConMasReportes } from "@/database/queries/interesado"
import { GraficoReportesPorCategoria, GraficoZonasCalientes, MetricCard, MapaCalorZonas } from "@/components/dashboard"

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
 * Renderiza la página de dashboard del usuario.
 *
 * Muestra el perfil, métricas (reportes, problemas resueltos y puntos) y la lista de reportes personales;
 * alterna a un dashboard de analíticas con métricas y gráficos si el usuario tiene rol Admin (rol_id = 1) o Interesado (rol_id = 3).
 *
 * @returns El elemento React que representa la página de dashboard.
 */
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [puntos, setPuntos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isInteresado, setIsInteresado] = useState(false)
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [reportesPorCategoria, setReportesPorCategoria] = useState<any[]>([])
  const [tiempoResolucion, setTiempoResolucion] = useState<any>(null)
  const [zonasCalientes, setZonasCalientes] = useState<any[]>([])
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

        // Verificar si el usuario puede ver el dashboard de analíticas (Admin o Interesado)
        const { puedeVerDashboard } = await verificarPuedeVerDashboard(supabase, user.id)
        setIsInteresado(puedeVerDashboard)

        if (puedeVerDashboard) {
          // Si es interesado, cargar estadísticas generales
          const [stats, categorias, tiempo, zonas] = await Promise.all([
            getEstadisticasInteresado(supabase),
            getReportesPorCategoria(supabase),
            getTiempoPromedioResolucion(supabase),
            getZonasConMasReportes(supabase, 10)
          ])
          
          setEstadisticas(stats)
          setReportesPorCategoria(categorias)
          setTiempoResolucion(tiempo)
          setZonasCalientes(zonas)
        } else {
          // Si no es interesado, cargar sus reportes personales
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
        <LoadingLogo size="lg" text="Cargando dashboard..." />
      </div>
    )
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  // Dashboard para usuarios con rol "Admin" o "Interesado"
  if (isInteresado) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Dashboard de Analíticas
            </h1>
            <p className="text-muted-foreground">
              Métricas y estadísticas generales de la plataforma
            </p>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Total de Reportes"
              value={estadisticas?.totalReportes || 0}
              icon={FileText}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-100 dark:bg-blue-950/40"
            />
            <MetricCard
              title="Reportes Resueltos"
              value={estadisticas?.reportesResueltos || 0}
              icon={CheckCircle}
              description={`${estadisticas?.tasaResolucion || 0}% de resolución`}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-100 dark:bg-green-950/40"
            />
            <MetricCard
              title="Reportes Pendientes"
              value={estadisticas?.reportesPendientes || 0}
              icon={Clock}
              iconColor="text-yellow-600 dark:text-yellow-400"
              iconBgColor="bg-yellow-100 dark:bg-yellow-950/40"
            />
            <MetricCard
              title="En Progreso"
              value={estadisticas?.reportesEnProgreso || 0}
              icon={AlertCircle}
              iconColor="text-orange-600 dark:text-orange-400"
              iconBgColor="bg-orange-100 dark:bg-orange-950/40"
            />
          </div>

          {/* Tiempo Promedio de Resolución */}
          {tiempoResolucion && (
            <div className="mb-8">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center">
                      <Timer className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Tiempo Promedio de Resolución
                      </h3>
                      <div className="flex items-baseline gap-3">
                        <p className="text-3xl font-bold text-foreground">
                          {tiempoResolucion.diasPromedio}
                        </p>
                        <span className="text-muted-foreground">días</span>
                        <span className="text-muted-foreground mx-2">≈</span>
                        <p className="text-2xl font-bold text-foreground">
                          {tiempoResolucion.horasPromedio}
                        </p>
                        <span className="text-muted-foreground">horas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GraficoReportesPorCategoria data={reportesPorCategoria} />
            <GraficoZonasCalientes zonas={zonasCalientes} />
          </div>

          {/* Mapa de Calor */}
          <div className="mb-8">
            <MapaCalorZonas zonas={zonasCalientes} height="500px" />
          </div>

          {/* Botón para ver mapa completo */}
          <div className="flex justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/mapa">
                <BarChart3 className="w-5 h-5" />
                Ver Todos los Reportes en el Mapa
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard normal para usuarios regulares
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