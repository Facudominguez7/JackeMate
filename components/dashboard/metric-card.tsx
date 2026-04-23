import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

const toneClasses = {
  neutral: {
    wrapper: "bg-[var(--surface-subtle)] text-foreground",
    icon: "text-foreground",
  },
  info: {
    wrapper: "tone-info-card",
    icon: "text-[var(--semantic-info)]",
  },
  success: {
    wrapper: "tone-success-card",
    icon: "text-[var(--semantic-success)]",
  },
  warning: {
    wrapper: "tone-warning-card",
    icon: "text-[var(--semantic-warning)]",
  },
  danger: {
    wrapper: "tone-danger-card",
    icon: "text-[var(--semantic-danger)]",
  },
  admin: {
    wrapper: "tone-admin-card",
    icon: "text-[var(--semantic-admin)]",
  },
} as const

type Props = {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  tone?: keyof typeof toneClasses
}

/**
 * Componente que renderiza una tarjeta de métrica con icono, valor y texto auxiliar.
 *
 * @param icon - Componente de icono (LucideIcon) que se renderiza dentro del contenedor de color
 * @param tone - Variante cromática basada en tokens globales
 * @returns El elemento JSX que representa la tarjeta de métrica
 */
export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  tone = "info"
}: Props) {
  const styles = toneClasses[tone]

  return (
    <Card className="h-full transition-colors hover:border-foreground/15">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${styles.wrapper}`}>
            <Icon className={`h-6 w-6 ${styles.icon}`} />
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
