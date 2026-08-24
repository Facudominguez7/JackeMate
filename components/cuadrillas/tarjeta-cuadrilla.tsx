import { Pencil, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Cuadrilla } from "@/database/queries/cuadrillas"

type TarjetaCuadrillaProps = {
  cuadrilla: Cuadrilla
  asignacionesAbiertas: number
  deshabilitado?: boolean
  onEditar: (cuadrilla: Cuadrilla) => void
  onCambiarActivacion: (cuadrilla: Cuadrilla) => void
}

/**
 * Tarjeta presentacional de una cuadrilla del catálogo: nombre, descripción, teléfono, estado
 * activa/inactiva y cantidad de asignaciones abiertas. No hace fetching de datos ni evalúa
 * roles: el panel que la renderiza decide qué botones mostrar y qué `deshabilitado` pasarle.
 */
export function TarjetaCuadrilla({
  cuadrilla,
  asignacionesAbiertas,
  deshabilitado,
  onEditar,
  onCambiarActivacion,
}: TarjetaCuadrillaProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{cuadrilla.nombre}</CardTitle>
          {cuadrilla.descripcion && (
            <p className="text-xs text-muted-foreground md:text-sm">{cuadrilla.descripcion}</p>
          )}
        </div>
        <Badge variant={cuadrilla.activa ? "reparado" : "outline"}>
          {cuadrilla.activa ? "Activa" : "Inactiva"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {cuadrilla.telefono && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
            <Phone className="size-3.5" />
            {cuadrilla.telefono}
          </p>
        )}
        <p className="text-xs text-muted-foreground md:text-sm">
          {asignacionesAbiertas} {asignacionesAbiertas === 1 ? "asignación abierta" : "asignaciones abiertas"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEditar(cuadrilla)} disabled={deshabilitado}>
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            variant={cuadrilla.activa ? "destructive" : "secondary"}
            size="sm"
            onClick={() => onCambiarActivacion(cuadrilla)}
            disabled={deshabilitado}
          >
            {cuadrilla.activa ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
