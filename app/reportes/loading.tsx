import { LoadingLogo } from "@/components/loading-logo"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingLogo size="lg" text="Cargando reportes..." />
    </div>
  )
}
