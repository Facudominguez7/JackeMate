import { LoadingState } from "@/components/loading-state"

/** Estado de carga del panel de cuadrillas, mientras se resuelven las lecturas paralelas de `page.tsx`. */
export default function CargandoCuadrillas() {
  return <div className="page-shell"><LoadingState text="Cargando panel de cuadrillas..." /></div>
}
