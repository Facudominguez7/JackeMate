"use server"

import { z } from "zod"

import {
  cambiarEstadoAdminWorkflow,
  crearComentarioWorkflow,
  eliminarComentarioAdminWorkflow,
  eliminarComentarioPropioWorkflow,
  eliminarReporteAdminWorkflow,
  eliminarReportePropioWorkflow,
  mutationErrorMessage,
  votarNoExisteWorkflow,
  votarReparadoWorkflow,
} from "@/lib/use-cases/reportes"
import {
  obtenerLineaTiempoWorkflow,
  type EventoLineaTiempo,
} from "@/lib/use-cases/cuadrillas"
import {
  obtenerAsignacionAbierta,
  obtenerEstadoOperativoPublicoPorReporte,
} from "@/database/queries/cuadrillas"
import type { EstadoOperativo } from "@/lib/authz/catalog"
import { getUserRoleContext, puedeOperarCuadrillas } from "@/lib/authz/roles"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

const reportIdSchema = z.coerce.number().int().positive()
const commentIdSchema = z.coerce.number().int().positive()
const commentSchema = z.string().trim().min(1).max(1000)
const stateIdSchema = z.coerce.number().int().positive()

/**
 * Datos de seguimiento de cuadrilla (solo lectura) que el detalle de un reporte necesita
 * renderizar. La gestión operativa (asignar, reasignar, cerrar, etc.) vive exclusivamente en
 * `/dashboard/cuadrillas`; esta página nunca recibe campos internos como `asignacionAbierta`.
 */
export type GestionOperativaDetalle = {
  puedeOperar: boolean
  estadoOperativo: EstadoOperativo | null
  cuadrillaNombre: string | null
  eventos: EventoLineaTiempo[]
}

export async function votarNoExisteAction(reporteId: number) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para votar." }
    }

    const { data: contextoRol } = await getUserRoleContext(supabase, user.id)
    if (puedeOperarCuadrillas(contextoRol?.roleId)) {
      return { success: false as const, error: "Los operadores y administradores no pueden votar." }
    }

    return await votarNoExisteWorkflow(createAdminClient(), parsedReportId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos registrar tu voto.") }
  }
}

export async function votarReparadoAction(reporteId: number) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para votar." }
    }

    const { data: contextoRol } = await getUserRoleContext(supabase, user.id)
    if (puedeOperarCuadrillas(contextoRol?.roleId)) {
      return { success: false as const, error: "Los operadores y administradores no pueden votar." }
    }

    return await votarReparadoWorkflow(createAdminClient(), parsedReportId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos registrar tu voto.") }
  }
}

export async function crearComentarioAction(reporteId: number, contenido: string) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const parsedComment = commentSchema.parse(contenido)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para comentar." }
    }

    return await crearComentarioWorkflow(createAdminClient(), parsedReportId, user.id, parsedComment)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos publicar tu comentario.") }
  }
}

export async function eliminarComentarioPropioAction(comentarioId: number) {
  try {
    const parsedCommentId = commentIdSchema.parse(comentarioId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para eliminar el comentario." }
    }

    return await eliminarComentarioPropioWorkflow(createAdminClient(), parsedCommentId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos eliminar el comentario.") }
  }
}

export async function eliminarComentarioAdminAction(comentarioId: number) {
  try {
    const parsedCommentId = commentIdSchema.parse(comentarioId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para eliminar el comentario." }
    }

    return await eliminarComentarioAdminWorkflow(createAdminClient(), parsedCommentId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos eliminar el comentario.") }
  }
}

export async function eliminarReportePropioAction(reporteId: number) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para eliminar el reporte." }
    }

    return await eliminarReportePropioWorkflow(createAdminClient(), parsedReportId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos eliminar el reporte.") }
  }
}

export async function eliminarReporteAdminAction(reporteId: number) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para eliminar el reporte." }
    }

    return await eliminarReporteAdminWorkflow(createAdminClient(), parsedReportId, user.id)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos eliminar el reporte.") }
  }
}

export async function cambiarEstadoAdminAction(reporteId: number, nuevoEstadoId: number, comentario?: string) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const parsedStateId = stateIdSchema.parse(nuevoEstadoId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para cambiar el estado." }
    }

    return await cambiarEstadoAdminWorkflow(createAdminClient(), parsedReportId, parsedStateId, user.id, comentario)
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos actualizar el estado del reporte.") }
  }
}

/**
 * Carga los datos de seguimiento de cuadrilla (solo lectura) de un reporte para el detalle:
 * estado operativo actual y línea de tiempo combinada. La gestión operativa (asignar, cerrar,
 * etc.) vive exclusivamente en `/dashboard/cuadrillas`.
 *
 * Server action obligatoria acá porque `obtenerLineaTiempoWorkflow` es `server-only` (elige,
 * del lado del servidor, entre las tablas base o la vista pública según el rol) y la página de
 * detalle es un componente cliente.
 *
 * Defensa en profundidad: para quien NO puede operar cuadrillas, el resumen
 * (`estadoOperativo`/`cuadrillaNombre`) sale siempre de la vista pública
 * `reportes_estado_operativo_publico`, nunca de la tabla base — así el componente nunca puede
 * filtrar por accidente `asignadaPor` u observaciones internas a un ciudadano, aunque tenga un
 * bug. Para quien sí puede operar, el mismo resumen sale de la asignación abierta (tabla base),
 * pero esa asignación completa nunca se envía al cliente.
 */
export async function obtenerGestionOperativaAction(reporteId: number) {
  try {
    const parsedReportId = reportIdSchema.parse(reporteId)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let roleId: number | null = null
    if (user) {
      const { data: roleContext } = await getUserRoleContext(supabase, user.id)
      roleId = roleContext?.roleId ?? null
    }

    const puedeOperar = puedeOperarCuadrillas(roleId)
    const admin = createAdminClient()

    if (puedeOperar) {
      const [{ data: asignacionAbierta }, eventos] = await Promise.all([
        obtenerAsignacionAbierta(admin, parsedReportId),
        obtenerLineaTiempoWorkflow(admin, parsedReportId, roleId),
      ])

      const detalle: GestionOperativaDetalle = {
        puedeOperar,
        estadoOperativo: asignacionAbierta?.estadoOperativo ?? null,
        cuadrillaNombre: asignacionAbierta?.cuadrillaNombre ?? null,
        eventos,
      }

      return { success: true as const, data: detalle }
    }

    const [estadoOperativoPorReporte, eventos] = await Promise.all([
      obtenerEstadoOperativoPublicoPorReporte(admin, [parsedReportId]),
      obtenerLineaTiempoWorkflow(admin, parsedReportId, roleId),
    ])
    const resumenPublico = estadoOperativoPorReporte.get(parsedReportId) ?? null

    const detalle: GestionOperativaDetalle = {
      puedeOperar,
      estadoOperativo: (resumenPublico?.estadoOperativo as EstadoOperativo | undefined) ?? null,
      cuadrillaNombre: resumenPublico?.cuadrillaNombre ?? null,
      eventos,
    }

    return { success: true as const, data: detalle }
  } catch (error) {
    return {
      success: false as const,
      error: mutationErrorMessage(error, "No pudimos cargar la gestión operativa del reporte."),
    }
  }
}
