import Image from "next/image"

interface LoadingLogoProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

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
