import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { EventoLineaTiempo } from "@/lib/use-cases/cuadrillas"
import { getUserInitials } from "@/lib/identity/display"

type LineaTiempoOperativaProps = {
  eventos: EventoLineaTiempo[]
  mostrarInternas: boolean
}

/**
 * Renderiza la línea de tiempo combinada (ciudadana + operativa) de un reporte, de más
 * reciente a más antigua.
 *
 * `mostrarInternas` se usa ÚNICAMENTE para pintar el marcador "Interna" sobre un evento: NUNCA
 * filtra eventos acá. El filtrado por rol ya ocurrió en el servidor, al elegir la fuente de
 * datos en `obtenerLineaTiempoWorkflow` (tablas base para quien opera cuadrillas, vista
 * pública para cualquier otro usuario) — este componente solo decoraría, nunca ocultaría.
 */
export function LineaTiempoOperativa({ eventos, mostrarInternas }: LineaTiempoOperativaProps) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay eventos registrados.</p>
  }

  return (
    <div className="space-y-3">
      {eventos.map((evento) => (
        <Card key={evento.id}>
          <CardContent className="flex items-start gap-3 pt-6">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">{getUserInitials(evento.autor)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{evento.titulo}</p>
                {mostrarInternas && evento.esInterna && <Badge variant="outline">Interna</Badge>}
              </div>
              {evento.detalle && <p className="text-sm text-muted-foreground">{evento.detalle}</p>}
              <p className="text-xs text-muted-foreground">
                {evento.autor ?? evento.cuadrillaNombre ?? "Sistema"} ·{" "}
                {new Date(evento.ocurridoAt).toLocaleString("es-AR")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
