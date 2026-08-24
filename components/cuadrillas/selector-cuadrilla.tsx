"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cuadrilla } from "@/database/queries/cuadrillas"

type SelectorCuadrillaProps = {
  cuadrillas: Cuadrilla[]
  valor: string
  onCambio: (valor: string) => void
  deshabilitado?: boolean
  /**
   * Cuadrillas que ya están trabajando en un reporte, indexadas por id. Se muestran
   * deshabilitadas con el reporte que las ocupa, para que el operador entienda POR QUÉ no
   * puede elegirlas en vez de recibir un error después de intentarlo.
   */
  ocupadas?: Record<number, { reporteId: number; reporteTitulo: string }>
}

/**
 * Selector de una cuadrilla activa del catálogo. Solo lista cuadrillas con `activa: true`: no
 * tiene buscador (no hay un primitivo `command` disponible en este proyecto), así que se
 * apoya en el orden alfabético que ya trae `listarCuadrillas`.
 *
 * Las cuadrillas ocupadas se muestran igual, deshabilitadas: ocultarlas haría creer que no
 * existen. La regla de "una cuadrilla, un reporte" la impone el índice único parcial
 * `idx_asignaciones_cuadrilla_ocupada`; esto es solo el aviso previo.
 */
export function SelectorCuadrilla({ cuadrillas, valor, onCambio, deshabilitado, ocupadas }: SelectorCuadrillaProps) {
  const cuadrillasActivas = cuadrillas.filter((cuadrilla) => cuadrilla.activa)
  const hayLibres = cuadrillasActivas.some((cuadrilla) => !ocupadas?.[cuadrilla.id])

  return (
    <Select value={valor} onValueChange={onCambio} disabled={deshabilitado}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={hayLibres ? "Seleccioná una cuadrilla..." : "No hay cuadrillas libres"}
        />
      </SelectTrigger>
      <SelectContent>
        {cuadrillasActivas.map((cuadrilla) => {
          const ocupacion = ocupadas?.[cuadrilla.id]

          return (
            <SelectItem key={cuadrilla.id} value={String(cuadrilla.id)} disabled={Boolean(ocupacion)}>
              {cuadrilla.nombre}
              {ocupacion && (
                <span className="text-muted-foreground"> — ocupada en #{ocupacion.reporteId}</span>
              )}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
