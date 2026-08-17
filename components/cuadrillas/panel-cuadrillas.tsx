"use client"

import dynamic from "next/dynamic"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { LoadingLogo } from "@/components/loading-logo"

import { DialogoConfirmacionOperativa } from "@/components/cuadrillas/dialogo-confirmacion-operativa"
import { FormularioCuadrilla } from "@/components/cuadrillas/formulario-cuadrilla"
import { SelectorCuadrilla } from "@/components/cuadrillas/selector-cuadrilla"
import { TarjetaAsignacion } from "@/components/cuadrillas/tarjeta-asignacion"
import { TarjetaCuadrilla } from "@/components/cuadrillas/tarjeta-cuadrilla"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  asignarCuadrillaAction,
  actualizarCuadrillaAction,
  cambiarActivacionCuadrillaAction,
  cerrarReporteConCuadrillaAction,
  crearCuadrillaAction,
  finalizarIntervencionAction,
  reasignarCuadrillaAction,
  registrarObservacionAction,
} from "@/app/dashboard/cuadrillas/actions"
import type {
  AsignacionAbiertaConReporte,
  ColaCierreAdministrativoItem,
  Cuadrilla,
  ReporteAsignable,
} from "@/database/queries/cuadrillas"
import type { ReportMapItem } from "@/database/queries/reportes/get-reportes"
import type { AccionOperativa } from "@/lib/use-cases/cuadrillas"

/**
 * El mapa se carga dinámicamente sin SSR porque Leaflet necesita `window`. Es el mismo
 * `MapContainer` que usa `/mapa`: no se creó un mapa aparte para el panel.
 */
const MapContainer = dynamic(() => import("@/components/map-container").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingLogo size="md" />
    </div>
  ),
})

type PanelCuadrillasProps = {
  cuadrillas: Cuadrilla[]
  abiertasPorCuadrilla: Record<number, number>
  asignaciones: AsignacionAbiertaConReporte[]
  accionesPorAsignacion: Record<number, AccionOperativa[]>
  reportesAsignables: ReporteAsignable[]
  /** Todos los reportes pendientes con coordenadas: los asignables y los que ya tienen cuadrilla. */
  reportesEnMapa: ReportMapItem[]
  /** Cuadrillas que ya están trabajando en un reporte, para deshabilitarlas en el selector. */
  cuadrillasOcupadas: Record<number, { reporteId: number; reporteTitulo: string }>
  colaCierre: ColaCierreAdministrativoItem[]
  accionesSinAsignacion: AccionOperativa[]
  puedeGestionarCatalogo: boolean
}

/** Descripción de la confirmación pendiente: qué se va a ejecutar si el usuario acepta. */
type ConfirmacionPendiente = {
  titulo: string
  descripcion: string
  textoConfirmar: string
  destructivo?: boolean
  ejecutar: () => Promise<{ success: boolean; error?: string }>
  mensajeExito: string
}

/**
 * Panel operativo de cuadrillas: catálogo, asignaciones en curso y cola de cierre
 * administrativo.
 *
 * No evalúa permisos por su cuenta. Cada acción se renderiza únicamente si aparece en el
 * arreglo `AccionOperativa[]` que el servidor calculó con `calcularAccionesDisponibles`, y los
 * workflows vuelven a validar esa misma tabla de transiciones antes de mutar. La lista que ve
 * el navegador es una pista; la autoridad está del lado del servidor.
 */
export function PanelCuadrillas({
  cuadrillas,
  abiertasPorCuadrilla,
  asignaciones,
  accionesPorAsignacion,
  reportesAsignables,
  reportesEnMapa,
  cuadrillasOcupadas,
  colaCierre,
  accionesSinAsignacion,
  puedeGestionarCatalogo,
}: PanelCuadrillasProps) {
  const [enviando, iniciarTransicion] = useTransition()
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPendiente | null>(null)

  const [cuadrillaEnEdicion, setCuadrillaEnEdicion] = useState<Cuadrilla | null>(null)
  const [observacionPorAsignacion, setObservacionPorAsignacion] = useState<Record<number, string>>({})
  const [publicaPorAsignacion, setPublicaPorAsignacion] = useState<Record<number, boolean>>({})

  const [reporteSeleccionado, setReporteSeleccionado] = useState<number | null>(null)
  const [cuadrillaParaAsignar, setCuadrillaParaAsignar] = useState("")
  const [observacionAsignacion, setObservacionAsignacion] = useState("")

  const cuadrillasActivas = cuadrillas.filter((cuadrilla) => cuadrilla.activa)

  /** Ejecuta una acción del servidor mostrando feedback con Sonner y sin romper ante un error. */
  function ejecutar(accion: () => Promise<{ success: boolean; error?: string }>, mensajeExito: string) {
    iniciarTransicion(async () => {
      try {
        const resultado = await accion()

        if (resultado.success) {
          toast.success(mensajeExito)
          return
        }

        toast.error("No pudimos completar la acción", {
          description: resultado.error || "Por favor, intenta nuevamente",
        })
      } catch {
        toast.error("No pudimos completar la acción", {
          description: "Por favor, intenta nuevamente",
        })
      }
    })
  }

  /** Abre el diálogo de confirmación para una acción que necesita el visto bueno del usuario. */
  function pedirConfirmacion(pendiente: ConfirmacionPendiente) {
    setConfirmacion(pendiente)
  }

  function confirmar() {
    if (!confirmacion) {
      return
    }

    const pendiente = confirmacion
    setConfirmacion(null)
    ejecutar(pendiente.ejecutar, pendiente.mensajeExito)
  }

  function observacionDe(asignacionId: number) {
    return observacionPorAsignacion[asignacionId] ?? ""
  }

  function esPublicaDe(asignacionId: number) {
    return publicaPorAsignacion[asignacionId] ?? false
  }

  /** Traduce una acción operativa de una asignación en la llamada al server action correspondiente. */
  function solicitarAccion(asignacion: AsignacionAbiertaConReporte, accion: AccionOperativa) {
    const observacion = observacionDe(asignacion.id)
    const observacionPublica = esPublicaDe(asignacion.id)
    const nombre = asignacion.cuadrillaNombre ?? "la cuadrilla"

    if (accion === "observar") {
      if (!observacion.trim()) {
        toast.error("La observación no puede estar vacía")
        return
      }

      ejecutar(
        () => registrarObservacionAction({ asignacionId: asignacion.id, observacion, observacionPublica }),
        "Observación registrada",
      )
      return
    }

    if (accion === "finalizar_trabajo" || accion === "cancelar") {
      const esCancelar = accion === "cancelar"

      pedirConfirmacion({
        titulo: esCancelar ? "Cancelar intervención" : "Finalizar trabajo",
        descripcion: esCancelar
          ? `Se cancela la intervención de ${nombre} sobre "${asignacion.reporteTitulo}". El reporte vuelve a quedar sin cuadrilla.`
          : `${nombre} informa que finalizó el trabajo sobre "${asignacion.reporteTitulo}". Un administrador tiene que confirmar el cierre del reporte.`,
        textoConfirmar: esCancelar ? "Cancelar intervención" : "Finalizar trabajo",
        destructivo: esCancelar,
        mensajeExito: esCancelar ? "Intervención cancelada" : "Trabajo finalizado",
        ejecutar: () =>
          finalizarIntervencionAction({
            asignacionId: asignacion.id,
            motivoCierre: esCancelar ? "cancelada" : "trabajo_finalizado",
            observacion: observacion.trim() || (esCancelar ? "Intervención cancelada." : "Trabajo finalizado."),
            observacionPublica,
          }),
      })
      return
    }

    if (accion === "reasignar") {
      if (!cuadrillaParaAsignar) {
        toast.error("Elegí una cuadrilla para reasignar")
        return
      }

      const destino = cuadrillasActivas.find((cuadrilla) => String(cuadrilla.id) === cuadrillaParaAsignar)

      pedirConfirmacion({
        titulo: "Reasignar cuadrilla",
        descripcion: `Se cierra la intervención de ${nombre} y "${asignacion.reporteTitulo}" pasa a ${
          destino?.nombre ?? "la cuadrilla elegida"
        }. El historial anterior se conserva.`,
        textoConfirmar: "Reasignar",
        mensajeExito: "Cuadrilla reasignada",
        ejecutar: () =>
          reasignarCuadrillaAction({
            reporteId: asignacion.reporteId,
            cuadrillaId: Number(cuadrillaParaAsignar),
            observacion,
            observacionPublica,
          }),
      })
    }
  }

  /** Asigna una cuadrilla a un reporte que todavía no tiene ninguna. */
  function asignar() {
    if (!reporteSeleccionado || !cuadrillaParaAsignar) {
      toast.error("Elegí un reporte y una cuadrilla")
      return
    }

    const reporte = reportesAsignables.find((item) => item.id === reporteSeleccionado)
    const destino = cuadrillasActivas.find((cuadrilla) => String(cuadrilla.id) === cuadrillaParaAsignar)

    pedirConfirmacion({
      titulo: "Asignar cuadrilla",
      descripcion: `"${reporte?.titulo ?? "El reporte"}" queda a cargo de ${destino?.nombre ?? "la cuadrilla elegida"}.`,
      textoConfirmar: "Asignar",
      mensajeExito: "Cuadrilla asignada",
      ejecutar: () =>
        asignarCuadrillaAction({
          reporteId: reporteSeleccionado,
          cuadrillaId: Number(cuadrillaParaAsignar),
          observacion: observacionAsignacion,
          observacionPublica: false,
        }),
    })
  }

  /** Cierra el reporte como Reparado o Rechazado. Solo se ofrece si el servidor habilitó la acción. */
  function cerrarReporte(item: ColaCierreAdministrativoItem, nuevoEstadoId: 2 | 3) {
    const esReparado = nuevoEstadoId === 2

    pedirConfirmacion({
      titulo: esReparado ? "Confirmar reparación" : "Rechazar reporte",
      descripcion: `"${item.reporteTitulo}" se cierra como ${
        esReparado ? "reparado" : "rechazado"
      }. Esta acción ajusta los puntos del autor y le envía un correo.`,
      textoConfirmar: esReparado ? "Confirmar reparación" : "Rechazar",
      destructivo: !esReparado,
      mensajeExito: esReparado ? "Reporte cerrado como reparado" : "Reporte rechazado",
      ejecutar: () => cerrarReporteConCuadrillaAction({ reporteId: item.reporteId, nuevoEstadoId }),
    })
  }

  const puedeCerrarReportes =
    accionesSinAsignacion.includes("cerrar_reparado") || accionesSinAsignacion.includes("cerrar_rechazado")

  return (
    <>
      <Tabs defaultValue="operacion" className="w-full">
        <TabsList>
          <TabsTrigger value="operacion">Operación</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="cierre">Cola de cierre</TabsTrigger>
        </TabsList>

        <TabsContent value="operacion" className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Asignar una cuadrilla</h2>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Reportes pendientes que todavía no tienen una cuadrilla trabajando.
                </p>
              </div>

              {reportesAsignables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay reportes pendientes sin asignar.</p>
              ) : (
                <>
                  {/*
                    El mapa va primero: el operador decide qué cuadrilla mandar DESPUÉS de ver
                    dónde está el problema. Los campos de abajo confirman esa decisión.
                  */}
                  {reportesEnMapa.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Label>Elegí el reporte desde el mapa</Label>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-[var(--map-heat-neutral)] ring-1 ring-black/10" />
                            Sin cuadrilla
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-[var(--semantic-admin)] ring-1 ring-black/10" />
                            Ya asignado
                          </span>
                        </div>
                      </div>
                      <div className="h-[420px] w-full overflow-hidden rounded-[var(--radius-lg)] border border-border md:h-[560px]">
                        <MapContainer
                          reports={reportesEnMapa}
                          showLegend={false}
                          onSeleccionarReporte={(reporteId) => {
                            const elegido = reportesEnMapa.find((reporte) => reporte.id === reporteId)

                            // Los reportes con cuadrilla se muestran en el mapa para que el
                            // operador vea qué está cubierto, pero no son seleccionables: el
                            // servidor los rechazaría igual.
                            if (elegido?.estadoOperativo) {
                              toast.info("Ese reporte ya tiene cuadrilla", {
                                description: elegido.cuadrillaNombre
                                  ? `Está a cargo de ${elegido.cuadrillaNombre}. Podés reasignarla desde "Intervenciones en curso".`
                                  : 'Podés reasignarla desde "Intervenciones en curso".',
                              })
                              return
                            }

                            setReporteSeleccionado(reporteId)
                            toast.success("Reporte seleccionado", { description: elegido?.title })
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="reporte-asignable">Reporte</Label>
                      <Select
                        value={reporteSeleccionado ? String(reporteSeleccionado) : ""}
                        onValueChange={(valor) => setReporteSeleccionado(Number(valor) || null)}
                        disabled={enviando}
                      >
                        <SelectTrigger id="reporte-asignable" className="w-full">
                          <SelectValue placeholder="Elegí un reporte..." />
                        </SelectTrigger>
                        <SelectContent>
                          {reportesAsignables.map((reporte) => (
                            <SelectItem key={reporte.id} value={String(reporte.id)}>
                              #{reporte.id} — {reporte.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cuadrilla</Label>
                      <SelectorCuadrilla
                        cuadrillas={cuadrillasActivas}
                        valor={cuadrillaParaAsignar}
                        onCambio={setCuadrillaParaAsignar}
                        deshabilitado={enviando}
                        ocupadas={cuadrillasOcupadas}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacion-asignacion">Observación (opcional)</Label>
                      <Textarea
                        id="observacion-asignacion"
                        value={observacionAsignacion}
                        onChange={(evento) => setObservacionAsignacion(evento.target.value)}
                        disabled={enviando}
                        rows={2}
                      />
                    </div>
                  </div>

                  <Button onClick={asignar} disabled={enviando || !reporteSeleccionado || !cuadrillaParaAsignar}>
                    Asignar cuadrilla
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Intervenciones en curso</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              Para reasignar, elegí primero la cuadrilla destino en el selector de arriba.
            </p>
          </div>

          {asignaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay intervenciones abiertas.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {asignaciones.map((asignacion) => (
                <TarjetaAsignacion
                  key={asignacion.id}
                  asignacion={asignacion}
                  acciones={accionesPorAsignacion[asignacion.id] ?? []}
                  enviando={enviando}
                  observacion={observacionDe(asignacion.id)}
                  onObservacionChange={(valor) =>
                    setObservacionPorAsignacion((previo) => ({ ...previo, [asignacion.id]: valor }))
                  }
                  observacionPublica={esPublicaDe(asignacion.id)}
                  onObservacionPublicaChange={(publica) =>
                    setPublicaPorAsignacion((previo) => ({ ...previo, [asignacion.id]: publica }))
                  }
                  onSolicitarAccion={(accion) => solicitarAccion(asignacion, accion)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalogo" className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          {puedeGestionarCatalogo && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {cuadrillaEnEdicion ? "Editar cuadrilla" : "Nueva cuadrilla"}
                  </h2>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Una cuadrilla desactivada conserva su historial pero no puede recibir asignaciones nuevas.
                  </p>
                </div>

                <FormularioCuadrilla
                  key={cuadrillaEnEdicion?.id ?? "nueva"}
                  valorInicial={cuadrillaEnEdicion ?? undefined}
                  enviando={enviando}
                  onEnviar={(datos) => {
                    if (cuadrillaEnEdicion) {
                      const id = cuadrillaEnEdicion.id
                      ejecutar(() => actualizarCuadrillaAction(id, datos), "Cuadrilla actualizada")
                      setCuadrillaEnEdicion(null)
                      return
                    }

                    ejecutar(() => crearCuadrillaAction(datos), "Cuadrilla creada")
                  }}
                />

                {cuadrillaEnEdicion && (
                  <Button variant="outline" onClick={() => setCuadrillaEnEdicion(null)} disabled={enviando}>
                    Cancelar edición
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {cuadrillas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay cuadrillas cargadas.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cuadrillas.map((cuadrilla) => (
                <TarjetaCuadrilla
                  key={cuadrilla.id}
                  cuadrilla={cuadrilla}
                  asignacionesAbiertas={abiertasPorCuadrilla[cuadrilla.id] ?? 0}
                  deshabilitado={enviando || !puedeGestionarCatalogo}
                  onEditar={setCuadrillaEnEdicion}
                  onCambiarActivacion={(objetivo) =>
                    pedirConfirmacion({
                      titulo: objetivo.activa ? "Desactivar cuadrilla" : "Activar cuadrilla",
                      descripcion: objetivo.activa
                        ? `${objetivo.nombre} deja de aparecer para asignaciones nuevas. Su historial se conserva.`
                        : `${objetivo.nombre} vuelve a estar disponible para recibir asignaciones.`,
                      textoConfirmar: objetivo.activa ? "Desactivar" : "Activar",
                      destructivo: objetivo.activa,
                      mensajeExito: objetivo.activa ? "Cuadrilla desactivada" : "Cuadrilla activada",
                      ejecutar: () => cambiarActivacionCuadrillaAction(objetivo.id, !objetivo.activa),
                    })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cierre" className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Pendientes de confirmación</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              La cuadrilla informó que terminó el trabajo. Un administrador confirma el cierre del reporte.
            </p>
          </div>

          {colaCierre.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay trabajos esperando confirmación.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {colaCierre.map((item) => (
                <Card key={item.asignacionId}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{item.reporteId}</Badge>
                      {item.cuadrillaNombre && <Badge variant="admin">{item.cuadrillaNombre}</Badge>}
                    </div>
                    <p className="text-sm font-medium">{item.reporteTitulo}</p>

                    {puedeCerrarReportes ? (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => cerrarReporte(item, 2)} disabled={enviando}>
                          Confirmar reparación
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cerrarReporte(item, 3)}
                          disabled={enviando}
                        >
                          Rechazar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        El cierre del reporte lo confirma un administrador.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DialogoConfirmacionOperativa
        abierto={confirmacion !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) {
            setConfirmacion(null)
          }
        }}
        titulo={confirmacion?.titulo ?? ""}
        descripcion={confirmacion?.descripcion ?? ""}
        textoConfirmar={confirmacion?.textoConfirmar ?? "Confirmar"}
        destructivo={confirmacion?.destructivo}
        enviando={enviando}
        onConfirmar={confirmar}
      />
    </>
  )
}
