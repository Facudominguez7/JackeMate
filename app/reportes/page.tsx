import Link from "next/link"
import { AlertTriangle, ArrowRight, Plus, SearchCheck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListaReportesClient } from "@/components/lista-reportes-client"
import { ReportesClientWrapper } from "./reportes-client"
import { getCategorias, getEstados, getPrioridades, getReportCardData } from "@/database/queries/reportes/get-reportes"

export const dynamic = "force-dynamic"

type ReportesPageProps = {
  searchParams: Promise<{
    search?: string
    categoria?: string
    estado?: string
    prioridad?: string
  }>
}

export default async function ReportesPage({ searchParams }: ReportesPageProps) {
  const params = await searchParams
  const { search, categoria, estado, prioridad } = params

  const { data: reports, error, hasMore } = await getReportCardData({
    search,
    categoria,
    estado,
    prioridad,
    limite: 12,
    offset: 0,
  })

  const { data: categorias } = await getCategorias()
  const { data: estados } = await getEstados()
  const { data: prioridades } = await getPrioridades()

  const activeFilters = [search, categoria, estado, prioridad].filter(Boolean).length

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-eyebrow">Reportes</span>
            <Badge variant="secondary">{reports.length} visibles</Badge>
            {activeFilters > 0 && <Badge variant="secondary">{activeFilters} filtros activos</Badge>}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:w-auto lg:grid-cols-[repeat(2,minmax(0,auto))]">
            <Button size="lg" className="justify-between" asChild>
              <Link href="/reportes/nuevo">
                <span className="flex items-center gap-2">
                  <Plus className="size-4" />
                  Crear reporte
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="justify-between" asChild>
              <Link href="/mapa">
                <span className="flex items-center gap-2">
                  <SearchCheck className="size-4" />
                  Ver en mapa
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="section-stack">
          <ReportesClientWrapper
            categorias={categorias ?? []}
            estados={estados ?? []}
            prioridades={prioridades ?? []}
          />
        </section>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
            <AlertDescription>Intenta nuevamente en unos minutos.</AlertDescription>
          </Alert>
        )}

        {reports.length > 0 ? (
          <section className="section-stack">
            <div>
              <span className="section-eyebrow">Listado</span>
              <h2 className="section-title mt-3">Incidentes visibles para toda la comunidad</h2>
            </div>
            <ListaReportesClient initialReports={reports} initialHasMore={hasMore ?? false} />
          </section>
        ) : !error ? (
          <Card className="border-dashed">
            <CardContent className="space-y-3 pt-6 text-center">
              <p className="text-lg font-semibold tracking-tight">No hay reportes publicados con esos criterios.</p>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                Ajustá los filtros o creá un nuevo reporte para sumar evidencia ciudadana desde tu barrio.
              </p>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/reportes/nuevo">Crear el primer reporte</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
