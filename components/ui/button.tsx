import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/92",
        filter:
          "border border-border bg-card text-foreground hover:bg-surface-subtle aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90",
        outline:
          "border border-primary/20 bg-accent text-accent-foreground hover:border-primary/35 hover:bg-primary/14",
        secondary:
          "bg-surface-strong text-accent-foreground hover:bg-accent",
        ghost:
          "text-foreground hover:bg-accent",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:text-primary/80 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2 has-[>svg]:px-3.5",
        sm: "min-h-9 gap-1.5 px-3.5 text-xs has-[>svg]:px-3",
        lg: "min-h-11 px-5 text-sm has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
