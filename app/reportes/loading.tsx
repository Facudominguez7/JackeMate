/**
 * Componente que muestra el estado de carga de reportes.
 *
 * @returns Un elemento JSX con el texto "Cargando reportes...".
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span>Cargando reportes...</span>
    </div>
  )
}
