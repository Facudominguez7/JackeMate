import { LoadingLogo } from "@/components/loading-logo"

/** Estado de carga del panel de cuadrillas, mientras se resuelven las lecturas paralelas de `page.tsx`. */
export default function CargandoCuadrillas() {
  return (
    <div className="page-shell flex items-center justify-center">
      <LoadingLogo size="lg" text="Cargando panel de cuadrillas..." />
    </div>
  )
}
