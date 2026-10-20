import Image from "next/image"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type LoadingStateProps = {
  text: string
  className?: string
  showSkeleton?: boolean
}

export function LoadingState({ text, className, showSkeleton = true }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex h-full w-full flex-col items-center justify-center gap-2 text-center", className)}>
      <span className="rounded-full bg-secondary px-3 py-2">
        <Image
          src="/logos/logoBlanco.webp"
          alt="Reporty"
          width={136}
          height={40}
          className="h-8 w-auto animate-pulse object-contain"
          priority
        />
      </span>
      <p className="text-sm font-medium tracking-tight text-muted-foreground">{text}</p>
      {showSkeleton && (
        <div className="w-full max-w-xs space-y-2" aria-hidden="true">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
          <Skeleton className="h-2.5 w-3/5" />
        </div>
      )}
    </div>
  )
}
