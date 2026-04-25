import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { PUNTOS, sumarPuntos } from "@/database/queries/puntos"
import {
  crearReporte,
  subirImagenReporte,
  type CrearReporteParams,
} from "@/database/queries/reportes/nuevo"
import { canCreateReports, getUserRoleContext } from "@/lib/authz/roles"

type MutationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type CreateReportWorkflowInput = CrearReporteParams & {
  image?: File | null
  isAnonymous?: boolean
}

export type CreateReportWorkflowResult = {
  reportId: number
  imageUploaded: boolean
  pointsAwarded: number
}

export async function crearReporteWorkflow(
  supabase: SupabaseClient,
  input: CreateReportWorkflowInput,
): Promise<MutationResult<CreateReportWorkflowResult>> {
  if (!input.isAnonymous) {
    const roleResult = await getUserRoleContext(supabase, input.usuarioId)

    if (roleResult.error || !canCreateReports(roleResult.data?.roleId)) {
      return { success: false, error: "No tenés permisos para crear reportes." }
    }
  }

  const reporte = await crearReporte(supabase, input)

  let imageUploaded = false
  if (input.image) {
    imageUploaded = Boolean(await subirImagenReporte(supabase, reporte.id, input.image))
  }

  const pointsResult = await sumarPuntos(
    supabase,
    input.usuarioId,
    PUNTOS.CREAR_REPORTE,
    "Crear nuevo reporte",
  )

  if (!pointsResult.success) {
    console.error("No pudimos acreditar puntos tras crear el reporte:", pointsResult.error)
  }

  return {
    success: true,
    data: {
      reportId: reporte.id,
      imageUploaded,
      pointsAwarded: pointsResult.success ? PUNTOS.CREAR_REPORTE : 0,
    },
  }
}
