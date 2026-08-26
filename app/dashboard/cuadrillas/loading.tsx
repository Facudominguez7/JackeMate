import { LoadingState } from "@/components/loading-state"

/** Estado de carga del panel de cuadrillas, mientras se resuelven las lecturas paralelas de `page.tsx`. */
export default function CargandoCuadrillas() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <LoadingState text="Cargando panel de cuadrillas..." className="h-32 w-full max-w-sm" />
    </div>
  )
}
