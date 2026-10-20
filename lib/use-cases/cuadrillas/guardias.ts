import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { RoleId } from "@/lib/authz/catalog"
import { getUserRoleContext, isAdminRole, puedeGestionarCuadrillas, puedeOperarCuadrillas } from "@/lib/authz/roles"
import { cuadrillasHabilitadas } from "@/lib/features"

const CUADRILLAS_DESHABILITADAS = "La gestión de cuadrillas no está disponible."

/** Resultado uniforme de una operación de casos de uso: éxito con dato, o error con mensaje en español (mismo patrón que `MutationResult` en `detail-mutations.ts`). */
export type ResultadoAccion<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Verifica que el usuario tenga permisos para gestionar el catálogo de cuadrillas (alta,
 * edición, activación). Roles habilitados: ADMIN y OPERADOR. Devuelve el `roleId` resuelto
 * en `data` para que el llamador no tenga que volver a consultarlo.
 */
export async function asegurarGestorDeCuadrillas(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResultadoAccion<RoleId>> {
  // Every crew action passes through this guard or the operator one, so this also covers
  // direct server action calls while the feature is off.
  if (!cuadrillasHabilitadas()) {
    return { success: false, error: CUADRILLAS_DESHABILITADAS }
  }

  const { data, error } = await getUserRoleContext(supabase, userId)

  if (error || data?.roleId == null || !puedeGestionarCuadrillas(data.roleId)) {
    return { success: false, error: "No tenés permisos para gestionar cuadrillas." }
  }

  return { success: true, data: data.roleId }
}

/**
 * Verifica que el usuario tenga permisos para operar cuadrillas: asignar reportes, registrar
 * observaciones y avanzar/cerrar intervenciones. Roles habilitados: ADMIN y OPERADOR.
 */
export async function asegurarOperadorDeCuadrillas(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResultadoAccion<RoleId>> {
  if (!cuadrillasHabilitadas()) {
    return { success: false, error: CUADRILLAS_DESHABILITADAS }
  }

  const { data, error } = await getUserRoleContext(supabase, userId)

  if (error || data?.roleId == null || !puedeOperarCuadrillas(data.roleId)) {
    return { success: false, error: "No tenés permisos para gestionar cuadrillas." }
  }

  return { success: true, data: data.roleId }
}

/**
 * Verifica que el usuario sea ADMIN. Reservado para el cierre administrativo del reporte
 * (confirmar "Reparado"/"Rechazado"), que conserva el mismo mensaje de error que ya usa el
 * resto del sistema para acciones exclusivas de administrador.
 */
export async function asegurarAdministrador(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResultadoAccion<RoleId>> {
  const { data, error } = await getUserRoleContext(supabase, userId)

  if (error || data?.roleId == null || !isAdminRole(data.roleId)) {
    return { success: false, error: "No tenés permisos de administrador para esta acción." }
  }

  return { success: true, data: data.roleId }
}
