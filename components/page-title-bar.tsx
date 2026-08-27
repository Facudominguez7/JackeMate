import type { ReactNode } from "react"

type PageTitleBarProps = {
  leading?: ReactNode
  title: ReactNode
  actions?: ReactNode
}

export function PageTitleBar({ leading, title, actions }: PageTitleBarProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="min-w-0 justify-self-start">{leading}</div>
      <h1 className="justify-self-center border-b-2 border-primary/50 px-2 text-center text-lg font-semibold tracking-tight text-foreground md:px-3 md:text-2xl">
        {title}
      </h1>
      <div className="min-w-0 justify-self-end">{actions}</div>
    </div>
  )
}
