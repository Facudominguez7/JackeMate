import { LoadingState } from "@/components/loading-state"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <LoadingState text="Cargando reportes..." className="h-32 w-full max-w-sm" />
    </div>
  )
}
