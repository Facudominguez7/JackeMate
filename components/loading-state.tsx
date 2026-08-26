import { Clock3 } from "lucide-react"

import { cn } from "@/lib/utils"

type LoadingStateProps = {
  text: string
  className?: string
}

export function LoadingState({ text, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex h-full w-full flex-col items-center justify-center gap-2 text-center", className)}>
      <Clock3 className="size-5 text-primary animate-pulse" aria-hidden="true" />
      <p className="text-sm font-medium tracking-tight text-muted-foreground">{text}</p>
    </div>
  )
}
