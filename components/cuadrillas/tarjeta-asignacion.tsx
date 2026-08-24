"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChipEstadoOperativo } from "@/components/cuadrillas/chip-estado-operativo"
import type { AsignacionAbiertaConReporte } from "@/database/queries/cuadrillas"
import { getUserInitials } from "@/lib/identity/display"
import type { AccionOperativa } from "@/lib/use-cases/cuadrillas"

const ETIQUETA_BOTON: Partial<Record<AccionOperativa, string>> = {
  reasignar: "Reasignar",
  cancelar: "Cancelar",
  observar: "Registrar observación",
  cerrar_reparado: "Marcar reparado",
  cerrar_rechazado: "Rechazar",
}

/** Orden fijo en el que se muestran los botones de acción disponibles sobre una asignación. */
const ORDEN_ACCIONES: AccionOperativa[] = [
  "cerrar_reparado",
  "cerrar_rechazado",
  "observar",
  "reasignar",
  "cancelar",
]

type TarjetaAsignacionProps = {
  asignacion: AsignacionAbiertaConReporte
  acciones: AccionOperativa[]
  enviando: boolean
  observacion: string
  onObservacionChange: (valor: string) => void
  observacionPublica: boolean
  onObservacionPublicaChange: (publica: boolean) => void
  onSolicitarAccion: (accion: AccionOperativa) => void
}

/**
 * Tarjeta de una asignación abierta de cuadrilla sobre un reporte: título, chip de estado
 * operativo, cuadrilla, fecha y autor de la asignación, un campo de observación (con
 * visibilidad interna/pública) y los botones de acción habilitados. Nunca evalúa roles: solo
 * renderiza el botón de una acción si viene en `acciones`, el arreglo que ya calculó el
 * servidor con `calcularAccionesDisponibles`.
 */
export function TarjetaAsignacion({
  asignacion,
  acciones,
  enviando,
  observacion,
  onObservacionChange,
  observacionPublica,
  onObservacionPublicaChange,
  onSolicitarAccion,
}: TarjetaAsignacionProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm md:text-base">{asignacion.reporteTitulo}</CardTitle>
          <ChipEstadoOperativo estadoOperativo={asignacion.estadoOperativo} />
        </div>
        <p className="text-xs text-muted-foreground md:text-sm">
          Cuadrilla: <span className="font-medium text-foreground">{asignacion.cuadrillaNombre ?? "—"}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px]">{getUserInitials(asignacion.asignadaPorUsername)}</AvatarFallback>
          </Avatar>
          <span>
            Asignada por {asignacion.asignadaPorUsername ?? "un operador"} el{" "}
            {new Date(asignacion.createdAt).toLocaleDateString("es-AR")}
          </span>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Observación (opcional, salvo para 'Registrar observación')"
            value={observacion}
            onChange={(e) => onObservacionChange(e.target.value)}
            disabled={enviando}
            className="min-h-[70px] resize-none text-sm"
          />
          {/*
            La etiqueta dice quién LEE la observación, no cómo se llama internamente el flag:
            "Interna/Pública" no le comunica nada a quien no conoce el modelo de datos.
            El default es no publicar porque filtrar una nota es irreversible.
          */}
          <div className="space-y-1.5">
            <Label htmlFor={`visibilidad-${asignacion.id}`} className="text-xs text-muted-foreground">
              Visibilidad de la observación
            </Label>
            <Select
              value={observacionPublica ? "publica" : "interna"}
              onValueChange={(valor) => onObservacionPublicaChange(valor === "publica")}
              disabled={enviando}
            >
              <SelectTrigger id={`visibilidad-${asignacion.id}`} className="w-full text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interna">Solo el municipio</SelectItem>
                <SelectItem value="publica">También la ve el ciudadano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDEN_ACCIONES.filter((accion) => acciones.includes(accion)).map((accion) => (
            <Button
              key={accion}
              size="sm"
              variant={accion === "cancelar" || accion === "cerrar_rechazado" ? "destructive" : "outline"}
              disabled={enviando}
              onClick={() => onSolicitarAccion(accion)}
            >
              {ETIQUETA_BOTON[accion]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
