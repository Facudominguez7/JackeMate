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
 * Componente que renderiza una tarjeta de métrica con icono, valor y texto auxiliar.
 *
 * @param icon - Componente de icono (LucideIcon) que se renderiza dentro del contenedor de color
 * @param iconColor - Clase(s) de Tailwind para el color del icono
 * @param iconBgColor - Clase(s) de Tailwind para el fondo del contenedor del icono
 * @returns El elemento JSX que representa la tarjeta de métrica
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