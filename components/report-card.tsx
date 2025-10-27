import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Droplet, TrafficCone, Lightbulb, Trash2, ShieldAlert, MoreHorizontal, Trees } from "lucide-react"


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


const getStatusColor = (status: string) => {
  switch (status) {
    case "Reparado":
      return "bg-green-50 text-green-700 border-green-200"
    case "Pendiente":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    case "Rechazado":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return ""
  }
}


const getPriorityColor = (priority: string): BadgeVariant => {
  switch (priority) {
    case "Alta":
      return "destructive"
    case "Media":
      return "secondary"
    case "Baja":
      return "outline"
    default:
      return "outline"
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Bache":
      return <Droplet className="w-3 h-3" />
    case "Semaforo":
      return <TrafficCone className="w-3 h-3" />
    case "Arbol caido":
      return <Trees className="w-3 h-3" />
    case "Alumbrado":
      return <Lightbulb className="w-3 h-3" />
    case "Residuos":
      return <Trash2 className="w-3 h-3" />
    case "Seguridad":
      return <ShieldAlert className="w-3 h-3" />
    case "Otros":
      return <MoreHorizontal className="w-3 h-3" />
    default:
      return null
  }
}

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
            <Badge variant={getPriorityColor(prioridad)}>{prioridad}</Badge>
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
              <Badge className={getStatusColor(estado)}>{estado}</Badge>
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
