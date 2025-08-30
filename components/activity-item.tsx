import type { LucideIcon } from "lucide-react"

interface ActivityItemProps {
  type: string
  description: string
  date: string
  icon: LucideIcon
}

export function ActivityItem({ type, description, date, icon: Icon }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("es-AR")} a las{" "}
          {new Date(date).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}
