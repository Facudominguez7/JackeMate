import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, User } from "lucide-react"
import Link from "next/link"

interface ReportCardProps {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  location: string
  author: string
  createdAt: string
  image?: string
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgente":
      return "destructive"
    case "Media":
      return "secondary"
    case "Baja":
      return "outline"
    default:
      return "outline"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Resuelto":
      return "bg-green-50 text-green-700 border-green-200"
    case "En Progreso":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Reportado":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    default:
      return ""
  }
}

export function ReportCard({
  id,
  title,
  description,
  category,
  priority,
  status,
  location,
  author,
  createdAt,
  image,
}: ReportCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <Link href={`/reportes/${id}`} className="hover:text-primary">
              {title}
            </Link>
          </CardTitle>
          <Badge variant={getPriorityColor(priority) as any}>{priority}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {image && (
          <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
            <img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge className={getStatusColor(status)}>{status}</Badge>
            <Badge variant="outline">{category}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(createdAt).toLocaleDateString("es-AR")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
