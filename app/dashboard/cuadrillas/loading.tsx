import { CuadrillasLoadingSkeleton } from "@/components/loading-skeletons"

/** Estado de carga del panel de cuadrillas, mientras se resuelven las lecturas paralelas de `page.tsx`. */
export default function CargandoCuadrillas() {
  return <CuadrillasLoadingSkeleton />
}
