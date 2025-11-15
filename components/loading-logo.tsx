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
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative animate-bounce`}>
        <Image
          src="/logo/logoJackeMate.png"
          alt="JackeMate Logo"
          width={128}
          height={128}
          className="w-full h-full object-contain animate-pulse"
          priority
        />
      </div>
      {text && (
        <p className="text-lg text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}