import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Calendar, Trophy, Star, TrendingUp, FileText, CheckCircle, Clock, AlertCircle, BarChart3, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ReportCard } from "@/components/report-card"
import { GraficoReportesPorCategoria, GraficoZonasCalientes, MetricCard, MapaCalorZonas } from "@/components/dashboard"
import { getDashboardPageData } from "@/database/queries/dashboard"
import { getUserInitials } from "@/lib/identity/display"

export default async function DashboardPage() {
  const data = await getDashboardPageData()

  if (!data.user) {
    redirect("/auth")
  }

  if (data.isAnalyticsDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Analíticas</h1>
            <p className="text-muted-foreground">Métricas y estadísticas generales de la plataforma</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Total de Reportes"
              value={data.estadisticas?.totalReportes || 0}
              icon={FileText}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-100 dark:bg-blue-950/40"
            />
            <MetricCard
              title="Reportes Resueltos"
              value={data.estadisticas?.reportesResueltos || 0}
              icon={CheckCircle}
              description={`${data.estadisticas?.tasaResolucion || 0}% de resolución`}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-100 dark:bg-green-950/40"
            />
            <MetricCard
              title="Reportes Pendientes"
              value={data.estadisticas?.reportesPendientes || 0}
              icon={Clock}
              iconColor="text-yellow-600 dark:text-yellow-400"
              iconBgColor="bg-yellow-100 dark:bg-yellow-950/40"
            />
            <MetricCard
              title="En Progreso"
              value={data.estadisticas?.reportesEnProgreso || 0}
              icon={AlertCircle}
              iconColor="text-orange-600 dark:text-orange-400"
              iconBgColor="bg-orange-100 dark:bg-orange-950/40"
            />
          </div>

          {data.tiempoResolucion && (
            <div className="mb-8">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center">
                      <Timer className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Tiempo Promedio de Resolución</h3>
                      <div className="flex items-baseline gap-3">
                        <p className="text-3xl font-bold text-foreground">{data.tiempoResolucion.diasPromedio}</p>
                        <span className="text-muted-foreground">días</span>
                        <span className="text-muted-foreground mx-2">≈</span>
                        <p className="text-2xl font-bold text-foreground">{data.tiempoResolucion.horasPromedio}</p>
                        <span className="text-muted-foreground">horas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GraficoReportesPorCategoria data={data.reportesPorCategoria} />
            <GraficoZonasCalientes zonas={data.zonasCalientes} />
          </div>

          <div className="mb-8">
            <MapaCalorZonas zonas={data.zonasCalientes} height="500px" />
          </div>

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {getUserInitials(data.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{data.user.email}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{data.userReports.length} {data.userReports.length === 1 ? "reporte" : "reportes"}</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40 rounded-full border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">Puntos Totales</p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{data.puntos}</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 pl-4 border-l-2 border-amber-300 dark:border-amber-700">
                      <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">¡Sigue así!</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.userReports.length}</p>
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
                    {data.userReports.filter((report) => report.estado.toLowerCase() === "reparado").length}
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
                  <p className="text-2xl font-bold text-foreground">{data.puntos}</p>
                  <p className="text-xs text-muted-foreground">Puntos Acumulados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

          {data.userReports.length === 0 ? (
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
              {data.userReports.map((report) => (
                <ReportCard
                  key={report.id}
                  id={report.id}
                  titulo={report.titulo}
                  descripcion={report.descripcion}
                  categoria={report.categoria}
                  prioridad={report.prioridad}
                  estado={report.estado}
                  imageUrl={report.imageUrl}
                  createdAt={report.createdAt}
                  autor={report.autor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
