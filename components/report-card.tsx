import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Construction, TrafficCone, Lightbulb, Trash2, ShieldAlert, MoreHorizontal, Trees, AlertTriangle, AlertCircle, Info, CheckCircle, X } from "lucide-react"


type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export type ReportCardProps = {
  id: number
  titulo: string
  descripcion?: string | null
  categoria: string
  prioridad: string
  estado: string
  imageUrl: string | null
  createdAt: string
  autor?: string
}

// Exportar función para obtener variante de estado
export const getStatusVariant = (status: string): "reparado" | "pendiente" | "rechazado" | "outline" => {
  switch (status) {
    case "Reparado":
      return "reparado"
    case "Pendiente":
      return "pendiente"
    case "Rechazado":
      return "rechazado"
    default:
      return "outline"
  }
}

// Exportar función para obtener iconos de estado
export const getStatusIcon = (status: string, className: string = "w-3 h-3") => {
  switch (status) {
    case "Reparado":
      return <CheckCircle className={className} />
    case "Rechazado":
      return <X className={className} />
    default:
      return null
  }
}

// Exportar función para obtener variante de prioridad
export const getPriorityVariant = (priority: string): "alta" | "media" | "baja" | "outline" => {
  switch (priority) {
    case "Alta":
      return "alta"
    case "Media":
      return "media"
    case "Baja":
      return "baja"
    default:
      return "outline"
  }
}

// Exportar función para obtener iconos de prioridad
export const getPriorityIcon = (priority: string, className: string = "w-3 h-3") => {
  switch (priority) {
    case "Alta":
      return <AlertTriangle className={className} />
    case "Media":
      return <AlertCircle className={className} />
    case "Baja":
      return <Info className={className} />
    default:
      return null
  }
}

// Exportar función para obtener iconos de categoría
export const getCategoryIcon = (category: string, className: string = "w-3 h-3") => {
  switch (category) {
    case "Bache":
      return <Construction className={className} />
    case "Semaforo":
      return <TrafficCone className={className} />
    case "Arbol caido":
      return <Trees className={className} />
    case "Alumbrado":
      return <Lightbulb className={className} />
    case "Residuos":
      return <Trash2 className={className} />
    case "Seguridad":
      return <ShieldAlert className={className} />
    case "Otros":
      return <MoreHorizontal className={className} />
    default:
      return null
  }
}

// Exportar función para obtener color de prioridad (coincide con variantes del badge)
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "Alta":
      return "#dc2626" // red-600 (coincide con variante "alta" del badge)
    case "Media":
      return "#ea580c" // orange-600 (coincide con variante "media" del badge)
    case "Baja":
      return "#ca8a04" // yellow-600 (coincide con variante "baja" del badge)
    default:
      return "#6b7280" // gray-500
  }
}

// Exportar función para obtener color de estado (coincide con variantes del badge)
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Reparado":
      return "#15803d" // green-700 (coincide con variante "reparado" del badge)
    case "Pendiente":
      return "#ca8a04" // yellow-600 (coincide con variante "pendiente" del badge)
    case "Rechazado":
      return "#b91c1c" // red-700 (coincide con variante "rechazado" del badge)
    default:
      return "#6b7280" // gray-500
  }
}

// Exportar función para obtener color de categoría (coincide con variante "blue" del badge)
export const getCategoryColor = (): string => {
  return "#2563eb" // blue-600 (coincide con variante "blue" del badge)
}

/**
 * Componente de tarjeta que muestra la información principal de un reporte y enlaza a su vista detallada.
 *
 * @param id - Identificador único del reporte usado en la ruta del enlace
 * @param titulo - Título del reporte que se muestra como encabezado
 * @param descripcion - Texto descriptivo del reporte; se muestra "Sin descripción" si no existe
 * @param categoria - Categoría del reporte (p. ej. "Bache", "Semaforo") mostrada con su icono
 * @param prioridad - Nivel de prioridad (p. ej. "Alta", "Media", "Baja") mostrado en una badge con icono
 * @param estado - Estado actual del reporte (p. ej. "Reparado", "Pendiente", "Rechazado") mostrado en una badge con icono
 * @param imageUrl - URL de la imagen del reporte; se usa un placeholder si no se proporciona
 * @param createdAt - Fecha de creación en formato compatible con Date; se muestra formateada en "es-AR"
 * @param autor - Nombre del autor; muestra "Anónimo" si no está disponible
 * @returns Un elemento React que representa la tarjeta enlazable del reporte
 */
export function ReportCard({
  id,
  titulo,
  descripcion,
  categoria,
  prioridad,
  estado,
  imageUrl,
  createdAt,
  autor,
}: ReportCardProps) {
  return (
    <Link key={id} href={`/reportes/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-1">{titulo}</CardTitle>
            <Badge variant={getPriorityVariant(prioridad)} className="flex items-center gap-1">
              {getPriorityIcon(prioridad)}
              {prioridad}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Imagen del reporte con lazy loading para optimización */}
          <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={titulo}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Descripción con límite de 2 líneas */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {descripcion || "Sin descripción"}
          </p>

          <div className="space-y-3">
            {/* Badges de estado y categoría */}
            <div className="flex items-center justify-between text-sm">
              <Badge variant={getStatusVariant(estado)} className="flex items-center gap-1">
                {getStatusIcon(estado)}
                {estado}
              </Badge>
              <Badge variant="blue" className="flex items-center gap-1">
                {getCategoryIcon(categoria)}
                {categoria}
              </Badge>
            </div>
            
            {/* Metadata: autor y fecha de creación */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {autor || "Anónimo"}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(createdAt).toLocaleDateString("es-AR")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}