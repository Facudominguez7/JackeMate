/**
 * Utilidades compartidas para conservar redirecciones internas seguras durante
 * los flujos de autenticación.
 */

const RUTA_AUTENTICADA_PREDETERMINADA = "/mapa"

/**
 * Normaliza un destino `next` para evitar redirecciones abiertas fuera de la app.
 *
 * @param next - Valor recibido desde formularios o parámetros de búsqueda.
 * @param fallback - Ruta interna usada cuando `next` no es seguro.
 * @returns Una ruta interna segura que empieza con `/` y no con `//`.
 */
export function obtenerRutaInternaSegura(
  next: FormDataEntryValue | string | null,
  fallback = RUTA_AUTENTICADA_PREDETERMINADA,
) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback
  }

  return next
}

/**
 * Resuelve el origen público que debe recibir el callback de Supabase Auth.
 *
 * @param cabeceras - Cabeceras de la petición actual en el servidor.
 * @returns Origen público respetando proxy inverso en producción o el origen local disponible.
 */
export function obtenerOrigenAutenticacion(cabeceras: Headers) {
  const hostReenviado = cabeceras.get("x-forwarded-host")?.split(",")[0]?.trim()
  const protocolo = cabeceras.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const protocoloReenviado = protocolo === "http" || protocolo === "https" ? protocolo : "https"

  if (hostReenviado) {
    return `${protocoloReenviado}://${hostReenviado}`
  }

  return cabeceras.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
