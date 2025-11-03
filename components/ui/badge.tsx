import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        blue: "bg-blue-50 text-blue-700 border-blue-200 [a&]:hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
        // Variantes de prioridad
        alta: "bg-red-300 text-red-700 border-red-300 [a&]:hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
        media: "bg-orange-100 text-orange-700 border-orange-300 [a&]:hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
        baja: "bg-yellow-50 text-yellow-700 border-yellow-300 [a&]:hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
        // Variantes de estado
        reparado: "bg-green-50 text-green-700 border-green-200 [a&]:hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
        pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200 [a&]:hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
        rechazado: "bg-red-50 text-red-700 border-red-200 [a&]:hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Renders a styled badge with selectable visual variants.
 *
 * @param variant - The visual variant to apply (controls colors, borders, and hover/focus styles).
 * @param asChild - If true, renders the badge by delegating to a child element via Radix `Slot`; otherwise renders a `span`.
 * @returns The badge element — a `span` by default or the provided child element when `asChild` is true — with the selected variant styles and any additional classes/props applied.
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };