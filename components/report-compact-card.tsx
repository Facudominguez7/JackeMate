import Image from "next/image"
import Link from "next/link"
import { Calendar } from "lucide-react"

import {
  getCategoryIcon,
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
  /** Optional category label; rendered only when provided. */
  category?: string
}

export function ReportCompactCard({
  id,
  title,
  description,
  priority,
  status,
  createdAt,
  image,
  category,
}: ReportCompactCardProps) {
  return (
    <Link href={`/reportes/${id}`} className="block">
      <Card className="overflow-hidden border-border bg-card transition-colors hover:border-primary/25">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="size-20 flex-none overflow-hidden rounded-md bg-surface-subtle md:size-24">
              <Image
                src={image || "/placeholder.svg"}
                alt={title}
                width={96}
                height={96}
                sizes="(min-width: 768px) 96px, 80px"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="float-right ml-2 flex max-w-[9rem] flex-col items-end gap-1">
                <Badge
                  variant={getStatusVariant(status)}
                  className="max-w-full gap-0.5 px-1 py-0 text-[9px] leading-4"
                  title={status}
                >
                  {getStatusIcon(status)}
                  <span className="truncate">{status}</span>
                </Badge>
                {category && (
                  <Badge
                    variant="category"
                    className="max-w-full gap-0.5 px-1 py-0 text-[9px] leading-4"
                    title={category}
                  >
                    {getCategoryIcon(category, "size-3")}
                    <span className="truncate">{category}</span>
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <h2 className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground" title={title}>
                  {title}
                </h2>
                <p className="line-clamp-2 text-xs leading-4 text-muted-foreground" title={description || undefined}>
                  {description || "Sin descripción adicional."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: getPriorityColor(priority) }}>
                  {getPriorityIcon(priority, "size-3")}
                  Prioridad {priority}
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
