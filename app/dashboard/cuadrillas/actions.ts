"use server"

import { revalidatePath } from "next/cache"
import { z, type ZodError } from "zod"

import {
  actualizarCuadrillaWorkflow,
  asignarCuadrillaWorkflow,
  cambiarActivacionCuadrillaWorkflow,
  cancelarIntervencionWorkflow,
  cerrarReporteConCuadrillaWorkflow,
  crearCuadrillaWorkflow,
  reasignarCuadrillaWorkflow,
  registrarObservacionWorkflow,
} from "@/lib/use-cases/cuadrillas"
import { mutationErrorMessage } from "@/lib/use-cases/reportes"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

import {
  esquemaAsignarCuadrilla,
  esquemaCancelarIntervencion,
  esquemaCerrarReporteConCuadrilla,
  esquemaCuadrilla,
  esquemaIdCuadrilla,
  esquemaReasignarCuadrilla,
  esquemaRegistrarObservacion,
} from "./esquemas"

const esquemaActiva = z.boolean()

/** Devuelve el primer mensaje de error en español de un `ZodError`, para mostrarlo directo al usuario. */
function primerMensajeZod(error: ZodError) {
  return error.issues[0]?.message ?? "Los datos ingresados no son válidos."
}

/** Revalida las rutas públicas y de detalle afectadas por un cambio operativo sobre un reporte. */
function revalidarRutasDeReporte(reporteId: number) {
  revalidatePath("/dashboard/cuadrillas")
  revalidatePath(`/reportes/${reporteId}`)
  revalidatePath("/reportes")
  revalidatePath("/mapa")
}

/**
 * Da de alta una cuadrilla nueva en el catálogo. Requiere sesión y permisos de gestión de
 * cuadrillas (verificados en el workflow).
 */
export async function crearCuadrillaAction(datos: unknown) {
  try {
    const parsedDatos = esquemaCuadrilla.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await crearCuadrillaWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidatePath("/dashboard/cuadrillas")
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos crear la cuadrilla.") }
  }
}

/**
 * Actualiza los datos de una cuadrilla existente. Requiere sesión y permisos de gestión de
 * cuadrillas.
 */
export async function actualizarCuadrillaAction(cuadrillaId: number, datos: unknown) {
  try {
    const parsedId = esquemaIdCuadrilla.safeParse(cuadrillaId)
    if (!parsedId.success) {
      return { success: false as const, error: primerMensajeZod(parsedId.error) }
    }

    const parsedDatos = esquemaCuadrilla.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await actualizarCuadrillaWorkflow(createAdminClient(), user.id, parsedId.data, parsedDatos.data)

    if (resultado.success) {
      revalidatePath("/dashboard/cuadrillas")
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos actualizar la cuadrilla.") }
  }
}

/**
 * Activa o desactiva una cuadrilla del catálogo. Requiere sesión y permisos de gestión de
 * cuadrillas.
 */
export async function cambiarActivacionCuadrillaAction(cuadrillaId: number, activa: boolean) {
  try {
    const parsedId = esquemaIdCuadrilla.safeParse(cuadrillaId)
    if (!parsedId.success) {
      return { success: false as const, error: primerMensajeZod(parsedId.error) }
    }

    const parsedActiva = esquemaActiva.safeParse(activa)
    if (!parsedActiva.success) {
      return { success: false as const, error: primerMensajeZod(parsedActiva.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await cambiarActivacionCuadrillaWorkflow(
      createAdminClient(),
      user.id,
      parsedId.data,
      parsedActiva.data,
    )

    if (resultado.success) {
      revalidatePath("/dashboard/cuadrillas")
    }

    return resultado
  } catch (error) {
    return {
      success: false as const,
      error: mutationErrorMessage(error, "No pudimos actualizar el estado de la cuadrilla."),
    }
  }
}

/**
 * Asigna una cuadrilla a un reporte pendiente sin cuadrilla asignada. Requiere sesión y
 * permisos de operación de cuadrillas.
 */
export async function asignarCuadrillaAction(datos: unknown) {
  try {
    const parsedDatos = esquemaAsignarCuadrilla.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await asignarCuadrillaWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidarRutasDeReporte(parsedDatos.data.reporteId)
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos asignar la cuadrilla.") }
  }
}

/**
 * Reasigna un reporte a otra cuadrilla, cerrando la asignación vigente. Requiere sesión y
 * permisos de operación de cuadrillas.
 */
export async function reasignarCuadrillaAction(datos: unknown) {
  try {
    const parsedDatos = esquemaReasignarCuadrilla.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await reasignarCuadrillaWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidarRutasDeReporte(parsedDatos.data.reporteId)
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos reasignar la cuadrilla.") }
  }
}

/**
 * Cancela la intervención de una cuadrilla: el reporte vuelve a quedar sin cuadrilla. Requiere
 * sesión y permisos de operación de cuadrillas.
 */
export async function cancelarIntervencionAction(datos: unknown) {
  try {
    const parsedDatos = esquemaCancelarIntervencion.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await cancelarIntervencionWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidarRutasDeReporte(resultado.data.asignacion.reporteId)
    }

    return resultado
  } catch (error) {
    return {
      success: false as const,
      error: mutationErrorMessage(error, "No pudimos cancelar la intervención de la cuadrilla."),
    }
  }
}

/**
 * Registra una observación libre sobre una asignación abierta, sin cambiar su estado
 * operativo. Requiere sesión y permisos de operación de cuadrillas.
 */
export async function registrarObservacionAction(datos: unknown) {
  try {
    const parsedDatos = esquemaRegistrarObservacion.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para gestionar cuadrillas." }
    }

    const resultado = await registrarObservacionWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidarRutasDeReporte(resultado.data.asignacion.reporteId)
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos registrar la observación.") }
  }
}

/**
 * Cierra un reporte con cuadrilla (Reparado/Rechazado). Disponible para ADMIN y OPERADOR
 * (verificado en el workflow). Delega enteramente en `cerrarReporteConCuadrillaWorkflow` el
 * cambio de estado del reporte, sus puntos y su email.
 */
export async function cerrarReporteConCuadrillaAction(datos: unknown) {
  try {
    const parsedDatos = esquemaCerrarReporteConCuadrilla.safeParse(datos)
    if (!parsedDatos.success) {
      return { success: false as const, error: primerMensajeZod(parsedDatos.error) }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para cerrar el reporte." }
    }

    const resultado = await cerrarReporteConCuadrillaWorkflow(createAdminClient(), user.id, parsedDatos.data)

    if (resultado.success) {
      revalidarRutasDeReporte(parsedDatos.data.reporteId)
    }

    return resultado
  } catch (error) {
    return { success: false as const, error: mutationErrorMessage(error, "No pudimos cerrar el reporte.") }
  }
}
