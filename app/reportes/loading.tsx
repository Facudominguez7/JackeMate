import { LoadingLogo } from "@/components/loading-logo"

/**
 * Componente que muestra una pantalla de carga centrada en toda la ventana.
 *
 * @returns Un elemento JSX que renderiza una pantalla de carga centrada con el logotipo y el texto "Cargando reportes...".
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingLogo size="lg" text="Cargando reportes..." />
    </div>
  )
}