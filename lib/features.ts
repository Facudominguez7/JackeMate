/**
 * Crew management ("cuadrillas") is parked: the code stays, but production runs without it.
 * The server reads `CUADRILLAS_ENABLED` at runtime, so turning it on only takes setting the
 * variable to `true` and restarting the app, with no rebuild. Unset means off.
 *
 * Server code only: browsers never receive the variable, so there it always reads as off.
 */
export function cuadrillasHabilitadas() {
  return process.env.CUADRILLAS_ENABLED === "true"
}
