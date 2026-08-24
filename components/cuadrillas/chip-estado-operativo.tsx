import { Badge } from "@/components/ui/badge"
import { ETIQUETAS_ESTADO_OPERATIVO, type EstadoOperativo } from "@/lib/authz/catalog"
import { cn } from "@/lib/utils"

const VARIANTE_POR_ESTADO: Record<EstadoOperativo, "admin" | "outline"> = {
  en_progreso: "admin",
  cerrada: "outline",
}

type ChipEstadoOperativoProps = {
  estadoOperativo?: EstadoOperativo | null
  cuadrillaNombre?: string | null
  className?: string
}

/**
 * Muestra el estado operativo de una asignación de cuadrilla como una `Badge` compacta.
 * No renderiza nada si no hay estado operativo (reporte sin cuadrilla asignada).
 *
 * Componente presentacional puro, sin lógica de datos: lo reutilizan la tarjeta de reporte,
 * el popup del mapa y el detalle del reporte.
 */
export function ChipEstadoOperativo({ estadoOperativo, cuadrillaNombre, className }: ChipEstadoOperativoProps) {
  if (!estadoOperativo) {
    return null
  }

  return (
    <Badge variant={VARIANTE_POR_ESTADO[estadoOperativo]} className={cn(className)}>
      {ETIQUETAS_ESTADO_OPERATIVO[estadoOperativo]}
      {cuadrillaNombre ? ` · ${cuadrillaNombre}` : ""}
    </Badge>
  )
}
