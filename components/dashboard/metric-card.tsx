"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

type Props = {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  iconColor?: string
  iconBgColor?: string
}

/**
 * Tarjeta de métrica para mostrar estadísticas del dashboard.
 * 
 * @param title - Título de la métrica
 * @param value - Valor de la métrica
 * @param icon - Icono de Lucide React
 * @param description - Descripción opcional
 * @param iconColor - Color del icono (clase de Tailwind)
 * @param iconBgColor - Color de fondo del icono (clase de Tailwind)
 */
export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  iconColor = "text-blue-600 dark:text-blue-400",
  iconBgColor = "bg-blue-100 dark:bg-blue-950/40"
}: Props) {
  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
