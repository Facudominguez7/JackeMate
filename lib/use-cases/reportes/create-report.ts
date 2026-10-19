import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { PUNTOS, sumarPuntos } from "@/database/queries/puntos"
import {
  crearReporte,
  subirImagenReporte,
  type CrearReporteParams,
} from "@/database/queries/reportes/nuevo"
import { canCreateReports, getUserRoleContext, isGuestRole } from "@/lib/authz/roles"

type MutationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type CreateReportWorkflowInput = CrearReporteParams & {
  image?: File | null
  imageThumbnail?: File | null
  /** Verified `user.is_anonymous` from the session; combined with the DB role. */
  actorIsAnonymous?: boolean
}

export type CreateReportWorkflowResult = {
  reportId: number
  imageUploaded: boolean
  pointsAwarded: number
  isGuest: boolean
}

export async function crearReporteWorkflow(
  supabase: SupabaseClient,
  input: CreateReportWorkflowInput,
): Promise<MutationResult<CreateReportWorkflowResult>> {
  const roleResult = await getUserRoleContext(supabase, input.usuarioId)

  if (roleResult.error || !canCreateReports(roleResult.data?.roleId)) {
    return { success: false, error: "No tenés permisos para crear reportes." }
  }

  const reporte = await crearReporte(supabase, input)

  let imageUploaded = false
  if (input.image) {
    imageUploaded = Boolean(await subirImagenReporte(supabase, reporte.id, input.image, input.imageThumbnail ?? null))
  }

  // Guests never earn points (the DB RPC enforces it too); only permanent identities do.
  const isGuest = input.actorIsAnonymous === true || isGuestRole(roleResult.data?.roleId)
  let pointsAwarded = 0

  if (!isGuest) {
    const pointsResult = await sumarPuntos(
      supabase,
      input.usuarioId,
      PUNTOS.CREAR_REPORTE,
      "Crear nuevo reporte",
    )

    if (pointsResult.success) {
      pointsAwarded = PUNTOS.CREAR_REPORTE
    } else {
      console.error("No pudimos acreditar puntos tras crear el reporte:", pointsResult.error)
    }
  }

  return {
    success: true,
    data: {
      reportId: reporte.id,
      imageUploaded,
      pointsAwarded,
      isGuest,
    },
  }
}
