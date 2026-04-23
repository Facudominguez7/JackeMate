import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart3, Calendar, CheckCircle, Clock, FileText, Plus, Star, Timer, TrendingUp, Trophy } from "lucide-react"

import { GraficoReportesPorCategoria, GraficoZonasCalientes, MapaCalorZonas, MetricCard } from "@/components/dashboard"
import { ReportCard } from "@/components/report-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getDashboardPageData } from "@/database/queries/dashboard"
import { getUserInitials } from "@/lib/identity/display"

export default async function DashboardPage() {
  const data = await getDashboardPageData()

  if (!data.user) {
    redirect("/auth")
  }

  if (data.isAnalyticsDashboard) {
    return (
      <div className="page-shell">
        <div className="page-container page-stack">
          <section className="page-hero-panel">
            <div className="page-hero-grid lg:items-end">
              <div className="section-stack">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-eyebrow">Panel institucional</span>
                  <Badge variant="admin">Analíticas</Badge>
                </div>
                <div className="space-y-4">
                  <h1 className="hero-title max-w-4xl">Lectura ejecutiva del sistema de reportes ciudadanos.</h1>
                  <p className="hero-copy max-w-3xl">
                    Métricas, distribución temática y zonas con mayor concentración para decidir dónde mirar primero sin perder sobriedad visual.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {data.tiempoResolucion && (
                  <Card className="tone-admin-card border">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-[var(--semantic-admin-border)] bg-card text-[var(--semantic-admin)]">
                          <Timer className="size-6" />
                        </div>
                        <div>
                          <p className="page-meta-label">Tiempo promedio de resolución</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight">{data.tiempoResolucion.diasPromedio} días</p>
                          <p className="mt-1 text-sm text-muted-foreground">≈ {data.tiempoResolucion.horasPromedio} horas promedio entre apertura y cierre.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Button size="lg" className="justify-between" asChild>
                  <Link href="/mapa">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="size-4" />
                      Abrir mapa general
                    </span>
                    <TrendingUp className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total de reportes" value={data.estadisticas?.totalReportes || 0} icon={FileText} tone="info" />
            <MetricCard
              title="Reportes resueltos"
              value={data.estadisticas?.reportesResueltos || 0}
              icon={CheckCircle}
              description={`${data.estadisticas?.tasaResolucion || 0}% de resolución`}
              tone="success"
            />
            <MetricCard title="Pendientes" value={data.estadisticas?.reportesPendientes || 0} icon={Clock} tone="warning" />
            <MetricCard title="En progreso" value={data.estadisticas?.reportesEnProgreso || 0} icon={TrendingUp} tone="admin" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <GraficoReportesPorCategoria data={data.reportesPorCategoria} />
            <GraficoZonasCalientes zonas={data.zonasCalientes} />
          </section>

          <section>
            <MapaCalorZonas zonas={data.zonasCalientes} height="500px" />
          </section>
        </div>
      </div>
    )
  }

  const resolvedReports = data.userReports.filter((report) => report.estado.toLowerCase() === "reparado").length

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="page-hero-panel">
          <div className="page-hero-grid lg:items-center">
            <div className="flex items-start gap-4 md:gap-6">
              <Avatar className="h-[4.5rem] w-[4.5rem] border border-border bg-[var(--surface-subtle)] md:h-24 md:w-24">
                <AvatarFallback className="text-2xl font-semibold md:text-3xl">{getUserInitials(data.user.email)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-eyebrow">Panel personal</span>
                  <Badge variant="secondary">{data.userReports.length} reportes</Badge>
                </div>
                <div>
                  <h1 className="section-title text-balance">{data.user.email}</h1>
                  <p className="section-copy mt-3 max-w-2xl">Acá gestionás tus reportes, seguís el avance y entendés cuánto aportaste al pulso cívico de la ciudad.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                    <Calendar className="size-4" />
                    {data.userReports.length} {data.userReports.length === 1 ? "reporte" : "reportes"}
                  </div>
                  <div className="tone-warning-inline inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                    <Trophy className="size-4" />
                    {data.puntos} puntos acumulados
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <Button size="lg" className="justify-between" asChild>
                <Link href="/reportes/nuevo">
                  <span className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Crear nuevo reporte
                  </span>
                  <TrendingUp className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="justify-between" asChild>
                <Link href="/reportes">
                  <span className="flex items-center gap-2">
                    <FileText className="size-4" />
                    Ver reportes públicos
                  </span>
                  <BarChart3 className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Reportes creados" value={data.userReports.length} icon={Plus} tone="info" />
          <MetricCard title="Casos resueltos" value={resolvedReports} icon={Star} tone="success" />
          <MetricCard title="Puntos acumulados" value={data.puntos} icon={Trophy} tone="warning" />
        </section>

        <section className="section-stack">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">Gestión personal</span>
              <h2 className="section-title mt-3">Mis reportes</h2>
              <p className="section-copy mt-3">Un listado directo para entrar al detalle, revisar comentarios o ver el estado actual de cada caso.</p>
            </div>
            <Button asChild>
              <Link href="/reportes/nuevo">
                <Plus className="size-4" />
                Crear reporte
              </Link>
            </Button>
          </div>

          {data.userReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="space-y-4 py-12 text-center">
                <p className="text-lg font-semibold tracking-tight">Todavía no creaste reportes.</p>
                <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">Cuando publiques el primero, lo vas a ver acá con acceso rápido a seguimiento y edición contextual.</p>
                <div className="flex justify-center">
                  <Button asChild>
                    <Link href="/reportes/nuevo">Crear mi primer reporte</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
        </section>
      </div>
    </div>
  )
}
