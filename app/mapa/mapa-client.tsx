"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Layers3, List, Map, MapPin, SlidersHorizontal, UserPlus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FiltrosReportes } from "@/components/filtros-reportes"
import { LoadingLogo } from "@/components/loading-logo"
import { getCategoryColor, getPriorityColor, getStatusColor } from "@/components/report-card"
import type { ReportMapItem } from "@/database/queries/reportes/get-reportes"

const MapContainer = dynamic(() => import("@/components/map-container").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingLogo size="md" text="Cargando mapa..." />
    </div>
  ),
})

type MapaClientProps = {
  reportes: ReportMapItem[]
  categorias: { id: number; nombre: string }[]
  estados: { id: number; nombre: string }[]
  prioridades: { id: number; nombre: string }[]
  error: string | null
  isAuthenticated: boolean
}

export function MapaClient({ reportes, categorias, estados, prioridades, error, isAuthenticated }: MapaClientProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const syncLayout = () => setShowSidebar(window.innerWidth >= 1024)

    syncLayout()
    setMapKey(Date.now())
    window.addEventListener("resize", syncLayout)

    return () => window.removeEventListener("resize", syncLayout)
  }, [])

  const handleFilterApplied = useCallback(() => {
    setShowFilters(false)
  }, [])

  return (
    <div className="page-shell">
      {isPending && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground">
            <div className="flex gap-1">
              <div className="size-2 animate-bounce rounded-full bg-foreground"></div>
              <div className="size-2 animate-bounce rounded-full bg-foreground" style={{ animationDelay: "0.1s" }}></div>
              <div className="size-2 animate-bounce rounded-full bg-foreground" style={{ animationDelay: "0.2s" }}></div>
            </div>
            Aplicando filtros…
          </div>
        </div>
      )}

      <div className="page-container page-stack">
        {!isAuthenticated && (
          <div className="tone-info-card rounded-[var(--radius-xl)] border p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--semantic-info-border)] bg-card text-[var(--semantic-info)]">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Estás viendo el mapa como visitante.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Podés explorar incidentes públicos. Para crear y gestionar reportes necesitás una cuenta.</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/auth">
                  <UserPlus className="size-4" />
                  Crear cuenta
                </Link>
              </Button>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-eyebrow">Mapa</span>
            <Badge variant="secondary">{reportes.length} puntos visibles</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:w-auto lg:grid-cols-[repeat(3,minmax(0,auto))]">
            <Button size="lg" variant="outline" className="justify-between" onClick={() => setShowFilters((prev) => !prev)}>
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              </span>
            </Button>
            <Button size="lg" variant="outline" className="justify-between" onClick={() => setShowSidebar((prev) => !prev)}>
              <span className="flex items-center gap-2">
                <Layers3 className="size-4" />
                {showSidebar ? "Ocultar panel" : "Mostrar panel"}
              </span>
            </Button>
            <Button size="lg" className="justify-between md:col-span-2 lg:col-span-1" asChild>
              <Link href="/reportes">
                <span className="flex items-center gap-2">
                  <List className="size-4" />
                  Ir a la vista lista
                </span>
                <Map className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {showFilters && (
          <section className="section-stack">
            <FiltrosReportes
              categorias={categorias}
              estados={estados}
              prioridades={prioridades}
              onFilterApplied={handleFilterApplied}
              externalIsPending={isPending}
              externalStartTransition={startTransition}
            />
          </section>
        )}

        <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card">
          <div className="grid min-h-[72vh] lg:grid-cols-[22rem_minmax(0,1fr)] 2xl:grid-cols-[26rem_minmax(0,1fr)]">
            {showSidebar && (
              <>
                <button
                  type="button"
                  className="absolute inset-0 z-20 bg-black/35 lg:hidden"
                  onClick={() => setShowSidebar(false)}
                  aria-label="Cerrar panel lateral"
                />

                <aside className="absolute inset-y-0 left-0 z-30 flex w-[min(24rem,100%)] flex-col border-r border-border bg-card lg:static lg:z-0 lg:w-auto">
                  <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-5">
                    <div>
                      <p className="page-kicker">Panel lateral</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight">Reportes visibles</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                      <X className="size-4" />
                    </Button>
                  </div>

                  <div className="border-b border-border px-4 py-4 md:px-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="page-meta-card p-3">
                        <p className="page-meta-label">Total visible</p>
                        <p className="page-meta-value text-xl">{reportes.length}</p>
                      </div>
                      <div className="page-meta-card p-3">
                        <p className="page-meta-label">Estado del panel</p>
                        <p className="mt-2 text-sm text-muted-foreground">{error ? "Con incidencia" : "Operativo"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTitle>Error al cargar el mapa</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {!error && reportes.length === 0 && (
                      <Alert>
                        <AlertTitle>No hay reportes con estos filtros</AlertTitle>
                        <AlertDescription>Probá cambiando la combinación de búsqueda o abrí la vista lista para revisar más contexto.</AlertDescription>
                      </Alert>
                    )}

                    {!error && reportes.length > 0 && (
                      <div className="space-y-3">
                        {reportes.map((report) => (
                          <Link key={report.id} href={`/reportes/${report.id}`} className="block">
                            <Card className="h-full transition-colors hover:border-foreground/15">
                              <CardContent className="space-y-3 pt-5">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="map-card-dot mt-1"
                                    style={{ backgroundColor: getPriorityColor(report.priority) }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">{report.title}</h3>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{report.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MapPin className="size-3.5 flex-none" />
                                  <span className="truncate">{report.location}</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" style={{ borderColor: getStatusColor(report.status), color: getStatusColor(report.status) }}>
                                    {report.status}
                                  </Badge>
                                  <Badge variant="outline" style={{ borderColor: getCategoryColor(), color: getCategoryColor() }}>
                                    {report.category}
                                  </Badge>
                                  <Badge variant="outline" style={{ borderColor: getPriorityColor(report.priority), color: getPriorityColor(report.priority) }}>
                                    {report.priority}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              </>
            )}

            <div className="relative min-h-[72vh] bg-[var(--surface-subtle)]">
              {error ? (
                <div className="flex h-full items-center justify-center p-6">
                  <Alert variant="destructive" className="max-w-lg">
                    <AlertTitle>Error al cargar el mapa</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="h-full w-full" key={mapKey}>
                  <MapContainer reports={reportes} showLegend />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
