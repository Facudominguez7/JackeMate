import { redirect } from "next/navigation"
import { CheckCircle, Clock, FileText, Plus, Star, Timer, TrendingUp, Trophy } from "lucide-react"

import { GraficoReportesPorCategoria, GraficoZonasCalientes, MapaCalorZonas } from "@/components/dashboard"
import { ReportCompactCard } from "@/components/report-compact-card"
import { ReportesClientWrapper } from "@/app/reportes/reportes-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { getCategorias, getEstados, getPrioridades } from "@/database/queries/reportes/get-reportes"
import { getDashboardPageData } from "@/database/queries/dashboard"
import { getUserInitials } from "@/lib/identity/display"

type DashboardPageProps = {
  searchParams: Promise<{
    search?: string
    categoria?: string
    estado?: string
    prioridad?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const data = await getDashboardPageData(params)

  if (!data.user) {
    redirect("/auth")
  }

  if (data.isAnalyticsDashboard) {
    return (
      <div className="page-shell">
        <div className="page-container page-stack">
          <section className="page-hero-panel">
            <div className="page-hero-grid lg:items-center">
              <div className="section-stack">
                <div>
                  <h1 className="section-title text-balance">Analíticas de reportes</h1>
                  <p className="section-copy mt-2">Una lectura breve del estado, la distribución y las zonas con mayor concentración.</p>
                </div>
              </div>

              <div>
                {data.tiempoResolucion && (
                  <Card className="border-[var(--semantic-admin)]/25 bg-[var(--semantic-admin)]/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--semantic-admin)]/25 bg-card text-[var(--semantic-admin)]">
                          <Timer className="size-4" />
                        </div>
                        <div>
                          <p className="page-meta-label">Tiempo promedio de resolución</p>
                          <p className="mt-1 text-xl font-semibold tracking-tight">{data.tiempoResolucion.diasPromedio} días</p>
                          <p className="text-xs text-muted-foreground">≈ {data.tiempoResolucion.horasPromedio} horas entre apertura y cierre.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>

          <section aria-label="Resumen global">
            <Card>
              <CardContent className="divide-y divide-border p-0">
                <div className="flex items-center gap-3 px-5 py-3">
                  <FileText className="size-4 shrink-0 text-[var(--semantic-info)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Total de reportes</p>
                    <p className="text-xs text-muted-foreground">Reportes publicados</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{data.estadisticas?.totalReportes || 0}</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3">
                  <CheckCircle className="size-4 shrink-0 text-[var(--semantic-success)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Reportes resueltos</p>
                    <p className="text-xs text-muted-foreground">{data.estadisticas?.tasaResolucion || 0}% de resolución</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{data.estadisticas?.reportesResueltos || 0}</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3">
                  <Clock className="size-4 shrink-0 text-[var(--semantic-warning)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Pendientes</p>
                    <p className="text-xs text-muted-foreground">Requieren atención</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{data.estadisticas?.reportesPendientes || 0}</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3">
                  <TrendingUp className="size-4 shrink-0 text-[var(--semantic-admin)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">En progreso</p>
                    <p className="text-xs text-muted-foreground">Casos en seguimiento</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{data.estadisticas?.reportesEnProgreso || 0}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <GraficoReportesPorCategoria data={data.reportesPorCategoria} />
            <GraficoZonasCalientes zonas={data.zonasCalientes} />
          </section>

          <section className="section-stack">
            <MapaCalorZonas zonas={data.zonasCalientes} height="500px" />
          </section>
        </div>
      </div>
    )
  }

  const [{ data: categorias }, { data: estados }, { data: prioridades }] = await Promise.all([
    getCategorias(),
    getEstados(),
    getPrioridades(),
  ])
  const resolvedReports = data.userReports.filter((report) => report.estado.toLowerCase() === "reparado").length
  const hasActiveFilters = Boolean(params.search || params.categoria || params.estado || params.prioridad)

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Mi cuenta</h2>
          <section className="page-hero-panel">
          <div className="page-hero-grid lg:items-center">
            <div className="flex items-start gap-4 md:gap-6">
              <Avatar className="size-16 border border-border bg-[var(--surface-subtle)] md:size-20">
                <AvatarFallback className="text-2xl font-semibold md:text-3xl">{getUserInitials(data.user.email)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h2 className="section-title text-balance">{data.user.email}</h2>
                  <p className="ranking-points mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Trophy className="size-4" aria-hidden="true" />
                    {data.puntos} puntos
                  </p>
                </div>
              </div>
            </div>
          </div>
          </section>
        </section>

        <section aria-label="Resumen personal">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-center gap-3 px-5 py-3">
                <Plus className="size-4 shrink-0 text-[var(--semantic-info)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Reportes creados</p>
                  <p className="text-xs text-muted-foreground">Reportes publicados</p>
                </div>
                <p className="text-lg font-semibold tracking-tight">{data.userReports.length}</p>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <Star className="size-4 shrink-0 text-[var(--semantic-success)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Casos resueltos</p>
                  <p className="text-xs text-muted-foreground">Reportes solucionados</p>
                </div>
                <p className="text-lg font-semibold tracking-tight">{resolvedReports}</p>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <Trophy className="size-4 shrink-0 ranking-points" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Puntos acumulados</p>
                  <p className="text-xs text-muted-foreground">Participación en la comunidad</p>
                </div>
                <p className="ranking-points text-lg font-semibold tracking-tight">{data.puntos}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="section-stack">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">Mis reportes</h2>
            <ReportesClientWrapper
              categorias={categorias ?? []}
              estados={estados ?? []}
              prioridades={prioridades ?? []}
            />
          </div>

          {data.userReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="space-y-2 py-10 text-center">
                <p className="text-lg font-semibold tracking-tight">
                  {hasActiveFilters ? "No hay reportes con esos filtros." : "Todavía no creaste reportes."}
                </p>
                <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                  {hasActiveFilters ? "Ajustá los filtros para volver a ver tus reportes." : "Tus reportes aparecerán acá cuando publiques el primero."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.userReports.map((report) => (
                <ReportCompactCard
                  key={report.id}
                  id={report.id}
                  title={report.titulo}
                  description={report.descripcion}
                  priority={report.prioridad}
                  status={report.estado}
                  createdAt={report.createdAt}
                  image={report.imageUrl}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
