import Image from "next/image"
import Link from "next/link"
import { Calendar } from "lucide-react"

import {
  getPriorityColor,
  getPriorityIcon,
  getStatusIcon,
  getStatusVariant,
} from "@/components/report-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type ReportCompactCardProps = {
  id: number
  title: string
  description?: string | null
  priority: string
  status: string
  createdAt: string
  image: string | null
}

export function ReportCompactCard({
  id,
  title,
  description,
  priority,
  status,
  createdAt,
  image,
}: ReportCompactCardProps) {
  return (
    <Link href={`/reportes/${id}`} className="block">
      <Card className="overflow-hidden border-border bg-card shadow-[var(--card-shadow)] transition-colors hover:border-primary/25">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="size-20 flex-none overflow-hidden rounded-[var(--radius)] bg-[var(--surface-subtle)] md:size-24">
              <Image
                src={image || "/placeholder.svg"}
                alt={title}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <Badge
                variant={getStatusVariant(status)}
                className="float-right ml-2 gap-0.5 px-1 py-0 text-[9px] leading-4"
              >
                {getStatusIcon(status)}
                {status}
              </Badge>

              <div>
                <h2 className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground">{title}</h2>
                <p className="line-clamp-1 text-xs leading-4 text-muted-foreground">
                  {description || "Sin descripción adicional."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: getPriorityColor(priority) }}>
                  {getPriorityIcon(priority, "size-3")}
                  {priority}
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="size-3 flex-none" />
                  {new Date(createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
