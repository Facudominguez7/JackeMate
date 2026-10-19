import { Skeleton } from "@/components/ui/skeleton"

function ReportCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--card-shadow)]">
      <Skeleton className="size-20 shrink-0 rounded-md md:size-24" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export function ReportesLoadingSkeleton() {
  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24 rounded-[var(--radius-pill)]" />
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-pill)] bg-muted p-1">
            <Skeleton className="h-9 rounded-[var(--radius-pill)]" />
            <Skeleton className="h-9 rounded-[var(--radius-pill)]" />
            <Skeleton className="h-9 rounded-[var(--radius-pill)]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => <ReportCardSkeleton key={index} />)}
          </div>
        </section>
      </div>
    </div>
  )
}

export function CuadrillasLoadingSkeleton() {
  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-7 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-pill)] bg-muted p-1">
            <Skeleton className="h-9 rounded-[var(--radius-pill)]" />
            <Skeleton className="h-9 rounded-[var(--radius-pill)]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--card-shadow)]">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-9 w-28 rounded-[var(--radius-pill)]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
