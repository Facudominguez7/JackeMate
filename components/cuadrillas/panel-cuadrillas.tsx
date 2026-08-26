"use client"

import dynamic from "next/dynamic"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { LoadingState } from "@/components/loading-state"

import { DialogoConfirmacionOperativa } from "@/components/cuadrillas/dialogo-confirmacion-operativa"
import { FormularioCuadrilla } from "@/components/cuadrillas/formulario-cuadrilla"
import { SelectorCuadrilla } from "@/components/cuadrillas/selector-cuadrilla"
import { TarjetaAsignacion } from "@/components/cuadrillas/tarjeta-asignacion"
import { TarjetaCuadrilla } from "@/components/cuadrillas/tarjeta-cuadrilla"
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
  cancelarIntervencionAction,
  cerrarReporteConCuadrillaAction,
  crearCuadrillaAction,
  reasignarCuadrillaAction,
  registrarObservacionAction,
} from "@/app/dashboard/cuadrillas/actions"
import type { AsignacionAbiertaConReporte, Cuadrilla, ReporteAsignable } from "@/database/queries/cuadrillas"
import type { ReportMapItem } from "@/database/queries/reportes/get-reportes"
import type { AccionOperativa } from "@/lib/use-cases/cuadrillas"

/**
 * El mapa se carga dinámicamente sin SSR porque Leaflet necesita `window`. Es el mismo
 * `MapContainer` que usa `/mapa`: no se creó un mapa aparte para el panel.
 */
const MapContainer = dynamic(() => import("@/components/map-container").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => (
    <LoadingState text="Cargando mapa..." />
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
 * Panel operativo de cuadrillas: catálogo y asignaciones en curso.
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

    if (accion === "cancelar") {
      pedirConfirmacion({
        titulo: "Cancelar intervención",
        descripcion: `Se cancela la intervención de ${nombre} sobre "${asignacion.reporteTitulo}". El reporte vuelve a quedar sin cuadrilla.`,
        textoConfirmar: "Cancelar intervención",
        destructivo: true,
        mensajeExito: "Intervención cancelada",
        ejecutar: () =>
          cancelarIntervencionAction({
            asignacionId: asignacion.id,
            observacion: observacion.trim() || "Intervención cancelada.",
            observacionPublica,
          }),
      })
      return
    }

    if (accion === "cerrar_reparado" || accion === "cerrar_rechazado") {
      const esReparado = accion === "cerrar_reparado"
      const nuevoEstadoId = esReparado ? 2 : 3

      pedirConfirmacion({
        titulo: esReparado ? "Marcar reparado" : "Rechazar reporte",
        descripcion: `"${asignacion.reporteTitulo}" se cierra como ${
          esReparado ? "reparado" : "rechazado"
        }. Esta acción ajusta los puntos del autor del reporte y le envía un correo.`,
        textoConfirmar: esReparado ? "Marcar reparado" : "Rechazar",
        destructivo: !esReparado,
        mensajeExito: esReparado ? "Reporte cerrado como reparado" : "Reporte rechazado",
        ejecutar: () =>
          cerrarReporteConCuadrillaAction({
            reporteId: asignacion.reporteId,
            nuevoEstadoId,
            comentario: observacion.trim() || undefined,
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

  return (
    <>
      <Tabs defaultValue="operacion" className="w-full">
        <TabsList>
          <TabsTrigger value="operacion">Asignar</TabsTrigger>
          <TabsTrigger value="intervenciones">
            Intervenciones en curso
            {asignaciones.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({asignaciones.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
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

        </TabsContent>

        <TabsContent value="intervenciones" className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          {asignaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay intervenciones abiertas.</p>
          ) : (
            <>
              {/*
                El selector de cuadrilla destino vive tambien acá: la accion "Reasignar" de cada
                tarjeta lee esta seleccion, y dejarla solo en la pestaña de asignacion volveria
                la reasignacion imposible de completar sin cambiar de pestaña.
              */}
              <Card>
                <CardContent className="space-y-2 pt-6">
                  <Label>Cuadrilla destino (para reasignar)</Label>
                  <div className="max-w-md">
                    <SelectorCuadrilla
                      cuadrillas={cuadrillasActivas}
                      valor={cuadrillaParaAsignar}
                      onCambio={setCuadrillaParaAsignar}
                      deshabilitado={enviando}
                      ocupadas={cuadrillasOcupadas}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elegí acá la cuadrilla que va a tomar el trabajo antes de usar &quot;Reasignar&quot;.
                  </p>
                </CardContent>
              </Card>

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
            </>
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
