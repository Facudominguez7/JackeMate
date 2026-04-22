import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { actualizarPuntos, PUNTOS, sumarPuntos } from "@/database/queries/puntos"
import { REPORT_STATE_IDS } from "@/lib/authz/catalog"
import { isAdminRole, getUserRoleContext } from "@/lib/authz/roles"
import {
  sendCommentNotificationEmail,
  sendStatusNotificationEmail,
} from "@/lib/notifications/report-notifications"

type MutationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type CommentProfileRelation =
  | {
      username: string
    }
  | {
      username: string
    }[]

type CommentView = {
  id: number
  reporte_id: number
  usuario_id: string
  contenido: string
  created_at: string
  profiles: CommentProfileRelation
}

type ReportOwnerRelation =
  | {
      username: string | null
      email: string | null
    }
  | {
      username: string | null
      email: string | null
    }[]
  | null

type ReportContext = {
  id: number
  usuario_id: string | null
  titulo: string
  estado_id: number | null
  deleted_at: string | null
  ownerProfile: ReportOwnerRelation
}

type VoteResult = {
  count: number
  stateChangedTo: number | null
}

type StatusChangeResult = {
  stateChanged: boolean
  estadoId: number
}

type SoftDeleteResult = {
  deleted: boolean
}

function getOwnerProfile(relation: ReportOwnerRelation) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function getCommentUsername(relation: CommentProfileRelation) {
  if (Array.isArray(relation)) {
    return relation[0]?.username ?? null
  }

  return relation.username ?? null
}

function normalizeCommentProfiles(relation: CommentView["profiles"] | null | undefined): CommentProfileRelation {
  if (!relation) {
    return { username: "Usuario" }
  }

  if (Array.isArray(relation)) {
    return relation.map((profile) => ({ username: profile?.username ?? "Usuario" }))
  }

  return { username: relation.username ?? "Usuario" }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function isDuplicateRowError(error: { code?: string } | null | undefined) {
  return error?.code === "23505"
}

function isReportClosed(report: Pick<ReportContext, "estado_id">) {
  return report.estado_id === REPORT_STATE_IDS.REPARADO || report.estado_id === REPORT_STATE_IDS.RECHAZADO
}

async function getReportContext(
  supabase: SupabaseClient,
  reporteId: number,
): Promise<MutationResult<ReportContext>> {
  const { data, error } = await supabase
    .from("reportes")
    .select(
      `
        id,
        usuario_id,
        titulo,
        estado_id,
        deleted_at,
        ownerProfile:profiles!reportes_usuario_id_fkey(username, email)
      `,
    )
    .eq("id", reporteId)
    .single()

  if (error || !data) {
    return { success: false, error: "No pudimos encontrar el reporte." }
  }

  return {
    success: true,
    data: data as ReportContext,
  }
}

async function ensureAdmin(supabase: SupabaseClient, userId: string): Promise<MutationResult<true>> {
  const { data, error } = await getUserRoleContext(supabase, userId)

  if (error || !isAdminRole(data?.roleId)) {
    return { success: false, error: "No tenés permisos de administrador para esta acción." }
  }

  return { success: true, data: true }
}

async function applyReportStateChange(
  supabase: SupabaseClient,
  report: ReportContext,
  nextStateId: number,
  actorUserId: string,
  comment?: string,
): Promise<MutationResult<StatusChangeResult>> {
  if (report.deleted_at) {
    return { success: false, error: "El reporte ya no está disponible." }
  }

  if (report.estado_id === nextStateId) {
    return {
      success: true,
      data: { stateChanged: false, estadoId: nextStateId },
    }
  }

  const owner = getOwnerProfile(report.ownerProfile)
  const previousStateId = report.estado_id ?? null

  const { data: updatedReport, error: updateError } = await supabase
    .from("reportes")
    .update({ estado_id: nextStateId })
    .eq("id", report.id)
    .is("deleted_at", null)
    .neq("estado_id", nextStateId)
    .select("id")
    .maybeSingle()

  if (updateError) {
    return { success: false, error: "No pudimos actualizar el estado del reporte." }
  }

  if (!updatedReport) {
    const latestReportResult = await getReportContext(supabase, report.id)

    if (!latestReportResult.success) {
      return latestReportResult
    }

    if (latestReportResult.data.deleted_at) {
      return { success: false, error: "El reporte ya no está disponible." }
    }

    if (latestReportResult.data.estado_id === nextStateId) {
      return {
        success: true,
        data: { stateChanged: false, estadoId: nextStateId },
      }
    }

    return {
      success: false,
      error: "El estado del reporte cambió mientras procesábamos la acción. Recargá e intentá nuevamente.",
    }
  }

  if (report.usuario_id) {
    if (nextStateId === REPORT_STATE_IDS.RECHAZADO) {
      await actualizarPuntos(supabase, report.usuario_id, PUNTOS.REPORTE_RECHAZADO, "Reporte rechazado por votos")
    }

    if (nextStateId === REPORT_STATE_IDS.REPARADO) {
      await sumarPuntos(supabase, report.usuario_id, PUNTOS.REPORTE_VALIDADO_REPARADO, "Reporte validado como reparado")
    }
  }

  const { error: historyError } = await supabase.from("historial_estados").insert({
    reporte_id: report.id,
    estado_anterior_id: previousStateId,
    estado_nuevo_id: nextStateId,
    usuario_id: actorUserId,
    comentario: comment ?? null,
  })

  if (historyError) {
    console.error("Error al registrar historial de estado:", historyError)
  }

  if (report.usuario_id && owner?.email && (nextStateId === REPORT_STATE_IDS.REPARADO || nextStateId === REPORT_STATE_IDS.RECHAZADO)) {
    try {
      await sendStatusNotificationEmail({
        ownerEmail: owner.email,
        ownerUsername: owner.username,
        reporteId: report.id,
        reporteTitulo: report.titulo,
        nuevoEstado: nextStateId === REPORT_STATE_IDS.REPARADO ? "Reparado" : "Rechazado",
        comentario: comment ?? null,
      })
    } catch (notificationError) {
      console.error("Error al enviar notificación de estado:", notificationError)
    }
  }

  return {
    success: true,
    data: { stateChanged: true, estadoId: nextStateId },
  }
}

async function softDeleteComment(
  supabase: SupabaseClient,
  comentarioId: number,
  actorUserId?: string,
): Promise<MutationResult<SoftDeleteResult>> {
  let query = supabase
    .from("comentarios_reporte")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", comentarioId)
    .is("deleted_at", null)

  if (actorUserId) {
    query = query.eq("usuario_id", actorUserId)
  }

  const { data, error } = await query.select("id").maybeSingle()

  if (error) {
    return { success: false, error: "No pudimos eliminar el comentario." }
  }

  if (!data) {
    return {
      success: false,
      error: actorUserId
        ? "El comentario ya fue eliminado o no te pertenece."
        : "El comentario ya fue eliminado o no está disponible.",
    }
  }

  return { success: true, data: { deleted: true } }
}

async function softDeleteReport(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId?: string,
): Promise<MutationResult<SoftDeleteResult>> {
  let query = supabase
    .from("reportes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reporteId)
    .is("deleted_at", null)

  if (actorUserId) {
    query = query.eq("usuario_id", actorUserId)
  }

  const { data, error } = await query.select("id").maybeSingle()

  if (error) {
    return { success: false, error: "No pudimos eliminar el reporte." }
  }

  if (!data) {
    return {
      success: false,
      error: actorUserId
        ? "El reporte ya fue eliminado o no te pertenece."
        : "El reporte ya fue eliminado o no está disponible.",
    }
  }

  return { success: true, data: { deleted: true } }
}

async function createVote(
  supabase: SupabaseClient,
  table: "votos_no_existe" | "votos_reparado",
  reportId: number,
  userId: string,
) {
  const { error: insertError } = await supabase.from(table).insert({
    reporte_id: reportId,
    usuario_id: userId,
  })

  if (isDuplicateRowError(insertError)) {
    return { success: false as const, error: "Ya habías votado este reporte." }
  }

  if (insertError) {
    return { success: false as const, error: "No pudimos registrar tu voto." }
  }

  const { count, error: countError } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("reporte_id", reportId)

  if (countError) {
    return { success: false as const, error: "No pudimos actualizar el contador de votos." }
  }

  return { success: true as const, count: count ?? 0 }
}

export async function votarNoExisteWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId: string,
): Promise<MutationResult<VoteResult>> {
  const reportResult = await getReportContext(supabase, reporteId)
  if (!reportResult.success) {
    return reportResult
  }

  const report = reportResult.data

  if (report.deleted_at) {
    return { success: false, error: "El reporte ya no está disponible." }
  }

  if (isReportClosed(report)) {
    return { success: false, error: "No podés votar un reporte que ya está cerrado." }
  }

  if (report.usuario_id === actorUserId) {
    return { success: false, error: "No podés votar 'No Existe' sobre tu propio reporte." }
  }

  const voteResult = await createVote(supabase, "votos_no_existe", reporteId, actorUserId)
  if (!voteResult.success) {
    return voteResult
  }

  await sumarPuntos(supabase, actorUserId, PUNTOS.VOTAR_NO_EXISTE, "Votar 'No Existe' en reporte")

  let stateChangedTo: number | null = null

  if (voteResult.count >= 1) {
    const stateResult = await applyReportStateChange(
      supabase,
      report,
      REPORT_STATE_IDS.RECHAZADO,
      actorUserId,
      "Rechazado automáticamente por 1 voto de 'No Existe'",
    )

    if (!stateResult.success) {
      return stateResult
    }

    stateChangedTo = stateResult.data.stateChanged ? stateResult.data.estadoId : null
  }

  return {
    success: true,
    data: {
      count: voteResult.count,
      stateChangedTo,
    },
  }
}

export async function votarReparadoWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId: string,
): Promise<MutationResult<VoteResult>> {
  const reportResult = await getReportContext(supabase, reporteId)
  if (!reportResult.success) {
    return reportResult
  }

  const report = reportResult.data

  if (report.deleted_at) {
    return { success: false, error: "El reporte ya no está disponible." }
  }

  if (isReportClosed(report)) {
    return { success: false, error: "No podés votar un reporte que ya está cerrado." }
  }

  const voteResult = await createVote(supabase, "votos_reparado", reporteId, actorUserId)
  if (!voteResult.success) {
    return voteResult
  }

  await sumarPuntos(supabase, actorUserId, PUNTOS.VOTAR_REPARADO, "Votar 'Reparado' en reporte")

  let stateChangedTo: number | null = null

  if (voteResult.count >= 1) {
    const stateResult = await applyReportStateChange(
      supabase,
      report,
      REPORT_STATE_IDS.REPARADO,
      actorUserId,
      "Marcado como reparado por 1 voto de usuarios",
    )

    if (!stateResult.success) {
      return stateResult
    }

    stateChangedTo = stateResult.data.stateChanged ? stateResult.data.estadoId : null
  }

  return {
    success: true,
    data: {
      count: voteResult.count,
      stateChangedTo,
    },
  }
}

export async function crearComentarioWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId: string,
  contenido: string,
): Promise<MutationResult<CommentView>> {
  const cleanContent = contenido.trim()
  if (!cleanContent) {
    return { success: false, error: "El comentario no puede estar vacío." }
  }

  const reportResult = await getReportContext(supabase, reporteId)
  if (!reportResult.success) {
    return reportResult
  }

  const report = reportResult.data

  if (report.deleted_at) {
    return { success: false, error: "El reporte ya no está disponible." }
  }

  if (isReportClosed(report)) {
    return { success: false, error: "No podés comentar un reporte que ya está cerrado." }
  }

  const { data, error } = await supabase
    .from("comentarios_reporte")
    .insert({
      reporte_id: reporteId,
      usuario_id: actorUserId,
      contenido: cleanContent,
    })
    .select(
      `
        id,
        reporte_id,
        usuario_id,
        contenido,
        created_at,
        profiles(username)
      `,
    )
    .single()

  if (error || !data) {
    return { success: false, error: "No pudimos publicar tu comentario." }
  }

  await sumarPuntos(supabase, actorUserId, PUNTOS.COMENTAR_REPORTE, "Comentar en reporte")

  const owner = getOwnerProfile(report.ownerProfile)
  if (report.usuario_id && report.usuario_id !== actorUserId && owner?.email) {
    try {
      await sendCommentNotificationEmail({
        ownerEmail: owner.email,
        ownerUsername: owner.username,
        commenterUsername: getCommentUsername((data as CommentView).profiles),
        reporteId,
        reporteTitulo: report.titulo,
        comentarioContenido: cleanContent,
      })
    } catch (notificationError) {
      console.error("Error al enviar notificación de comentario:", notificationError)
    }
  }

  return {
    success: true,
    data: {
      ...(data as Omit<CommentView, "profiles"> & { profiles?: CommentView["profiles"] | null }),
      profiles: normalizeCommentProfiles((data as CommentView).profiles),
    },
  }
}

export async function eliminarComentarioPropioWorkflow(
  supabase: SupabaseClient,
  comentarioId: number,
  actorUserId: string,
): Promise<MutationResult<true>> {
  const deleteResult = await softDeleteComment(supabase, comentarioId, actorUserId)
  if (!deleteResult.success) {
    return deleteResult
  }

  return { success: true, data: true }
}

export async function eliminarComentarioAdminWorkflow(
  supabase: SupabaseClient,
  comentarioId: number,
  actorUserId: string,
): Promise<MutationResult<true>> {
  const adminResult = await ensureAdmin(supabase, actorUserId)
  if (!adminResult.success) {
    return adminResult
  }

  const deleteResult = await softDeleteComment(supabase, comentarioId)
  if (!deleteResult.success) {
    return deleteResult
  }

  return { success: true, data: true }
}

export async function eliminarReportePropioWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId: string,
): Promise<MutationResult<true>> {
  const deleteResult = await softDeleteReport(supabase, reporteId, actorUserId)
  if (!deleteResult.success) {
    return deleteResult
  }

  await actualizarPuntos(supabase, actorUserId, PUNTOS.ELIMINAR_REPORTE_PROPIO, "Eliminar reporte propio")

  return { success: true, data: true }
}

export async function eliminarReporteAdminWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  actorUserId: string,
): Promise<MutationResult<true>> {
  const adminResult = await ensureAdmin(supabase, actorUserId)
  if (!adminResult.success) {
    return adminResult
  }

  const deleteResult = await softDeleteReport(supabase, reporteId)
  if (!deleteResult.success) {
    return deleteResult
  }

  return { success: true, data: true }
}

export async function cambiarEstadoAdminWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  nuevoEstadoId: number,
  actorUserId: string,
  comentario?: string,
): Promise<MutationResult<StatusChangeResult>> {
  const adminResult = await ensureAdmin(supabase, actorUserId)
  if (!adminResult.success) {
    return adminResult
  }

  const reportResult = await getReportContext(supabase, reporteId)
  if (!reportResult.success) {
    return reportResult
  }

  return applyReportStateChange(
    supabase,
    reportResult.data,
    nuevoEstadoId,
    actorUserId,
    comentario?.trim() || "Cambio de estado realizado por administrador",
  )
}

export function mutationErrorMessage(error: unknown, fallback: string) {
  return toErrorMessage(error, fallback)
}
