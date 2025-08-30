import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TimelineItemProps {
  status: string
  description: string
  date: string
  author: string
  authorInitials: string
  isLast?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Resuelto":
      return "bg-green-50 text-green-700 border-green-200"
    case "En Progreso":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Reportado":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    case "Verificado":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "Pausado":
      return "bg-orange-50 text-orange-700 border-orange-200"
    default:
      return ""
  }
}

export function TimelineItem({ status, description, date, author, authorInitials, isLast = false }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        {!isLast && <div className="w-px h-12 bg-border mt-2"></div>}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={getStatusColor(status)} variant="outline">
            {status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("es-AR")} a las{" "}
            {new Date(date).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm text-foreground mb-1">{description}</p>
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground">por {author}</p>
        </div>
      </div>
    </div>
  )
}
