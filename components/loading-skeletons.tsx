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

export function MapLoadingSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-full w-full rounded-lg ${className ?? ""}`} />
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

export function NuevoReporteLoadingSkeleton() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-6 md:space-y-8">
        <Skeleton className="mx-auto h-7 w-44" />
        <div className="space-y-6 rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--card-shadow)] md:p-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-28 w-full" />
            <div className="grid gap-5 md:grid-cols-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-[280px] w-full rounded-lg" />
            <div className="flex justify-end">
              <Skeleton className="h-11 w-40 rounded-[var(--radius-pill)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReporteDetalleLoadingSkeleton() {
  return (
    <div className="page-shell">
      <div className="page-container space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-4 rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--card-shadow)]">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
