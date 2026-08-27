import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { ListaReportesClient } from "@/components/lista-reportes-client"
import { EstadoReportes } from "./estado-reportes"
import { ReportesClientWrapper } from "./reportes-client"
import { PageTitleBar } from "@/components/page-title-bar"
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

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
            <AlertDescription>Intenta nuevamente en unos minutos.</AlertDescription>
          </Alert>
        )}

        <section className="space-y-3">
          <PageTitleBar
            title="Incidentes reportados"
            actions={
              <ReportesClientWrapper
                categorias={categorias ?? []}
                estados={estados ?? []}
                prioridades={prioridades ?? []}
              />
            }
          />
          <EstadoReportes searchParams={params} />

          {reports.length > 0 ? (
            <ListaReportesClient initialReports={reports} initialHasMore={hasMore ?? false} variant="compact" />
          ) : !error ? (
            <Card className="border-dashed">
              <CardContent className="space-y-2 p-4 text-center">
                <p className="text-lg font-semibold tracking-tight">No hay reportes publicados con esos criterios.</p>
                <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                  Ajustá los filtros para volver a ver incidentes en el listado.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  )
}
