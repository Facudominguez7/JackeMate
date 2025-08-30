import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface UserStatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
}

export function UserStatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: UserStatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
