import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-foreground text-background [a&]:hover:bg-foreground/88",
        primary:
          "border-[var(--semantic-success-border)] bg-[var(--semantic-success-soft)] text-[var(--primary)] [a&]:hover:bg-[var(--accent)]",
        secondary:
          "border-transparent bg-[var(--surface-subtle)] text-foreground [a&]:hover:bg-[var(--surface-strong)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-[var(--surface-subtle)]",
        blue: "border-[var(--semantic-info-border)] bg-[var(--semantic-info-soft)] text-[var(--semantic-info)]",
        alta: "border-[var(--semantic-danger-border)] bg-[var(--semantic-danger-soft)] text-[var(--semantic-danger)]",
        media: "border-[var(--semantic-warning-border)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning)]",
        baja: "border-[var(--priority-low-border)] bg-[var(--priority-low-soft)] text-[var(--priority-low)]",
        oro: "border-[var(--rank-gold-border)] bg-[var(--rank-gold-soft)] text-[var(--rank-gold)]",
        plata: "border-[var(--rank-silver-border)] bg-[var(--rank-silver-soft)] text-[var(--rank-silver)]",
        bronce: "border-[var(--rank-bronze-border)] bg-[var(--rank-bronze-soft)] text-[var(--rank-bronze)]",
        reparado: "border-[var(--semantic-success-border)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success)]",
        pendiente: "border-[var(--semantic-warning-border)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning)]",
        rechazado: "border-[var(--semantic-danger-border)] bg-[var(--semantic-danger-soft)] text-[var(--semantic-danger)]",
        admin: "border-[var(--semantic-admin-border)] bg-[var(--semantic-admin-soft)] text-[var(--semantic-admin)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Componente visual que renderiza una etiqueta compacta (badge) con variantes de estilo.
 *
 * @param variant - Clave de la variante visual a aplicar (p. ej. `default`, `secondary`, `destructive`, `blue`, `alta`, `media`, `baja`, `reparado`, `pendiente`, `rechazado`).
 * @param asChild - Si es `true`, renderiza el contenido usando `Slot` para delegar el elemento raíz; por defecto renderiza un `span`.
 * @returns El elemento React que representa la badge: un `span` por defecto o el componente pasado mediante `asChild`.
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
