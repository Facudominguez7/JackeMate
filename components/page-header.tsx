import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <Card className={cn("overflow-hidden shadow-[var(--card-shadow)]", className)}>
      <CardContent>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-balance text-xl font-semibold tracking-[-0.03em] md:text-2xl">
              {title}
            </h1>
            <p className="max-w-2xl text-xs leading-4 text-muted-foreground md:text-sm">{description}</p>
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
