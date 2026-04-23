import Image from "next/image"

interface LoadingLogoProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

/**
 * Muestra un logo animado centrado con tamaño configurable y texto opcional.
 *
 * @param size - Tamaño del contenedor del logo: `"sm"`, `"md"` o `"lg"`. Valor por defecto: `"md"`.
 * @param text - Texto opcional que se muestra debajo del logo.
 * @returns Un elemento React que renderiza el logo con animaciones y, si se proporciona, una leyenda de texto.
 */
export function LoadingLogo({ size = "md", text }: LoadingLogoProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-24 w-24"
  }

  const frameClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5"
  }

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        <div className={`relative rounded-full border border-primary/15 bg-card ${frameClasses[size]}`}>
          <div className="absolute inset-[10%] rounded-full border border-primary/10 animate-pulse" />
          <div className={`${sizeClasses[size]} relative animate-[spin_9s_linear_infinite]`}>
            <div className="absolute inset-0 rounded-full border border-transparent border-t-primary/45 border-r-primary/20" />
            <div className="absolute inset-[18%] rounded-full border border-transparent border-b-primary/35 border-l-primary/15" />
            <div className="absolute inset-[24%] animate-[spin_5s_linear_infinite_reverse]">
              <Image
                src="/logo/logoJackeMate.png"
                alt="JackeMate Logo"
                width={128}
                height={128}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      {text && (
        <p className={`${textClasses[size]} max-w-xs font-medium tracking-tight text-muted-foreground`}>
          {text}
        </p>
      )}
      <span className="sr-only">Cargando contenido</span>
    </div>
  )
}
