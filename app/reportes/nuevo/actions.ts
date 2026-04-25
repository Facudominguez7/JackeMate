"use server"

import { ZodError, z } from "zod"

import { crearReporteWorkflow, mutationErrorMessage } from "@/lib/use-cases/reportes"
import { isAnonymousUser } from "@/lib/authz/anonymous"
import { asegurarPerfilBase } from "@/database/queries/profiles"
import { REPORT_IMAGE_MAX_BYTES, isAcceptedReportImageType } from "@/lib/media/report-images"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

const createReportSchema = z.object({
  titulo: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().min(10).max(5000),
  categoriaId: z.coerce.number().int().positive("Seleccioná una categoría."),
  prioridadId: z.coerce.number().int().positive("Seleccioná una prioridad."),
  lat: z.coerce.number().min(-90, "Seleccioná una ubicación en el mapa." ).max(90, "Seleccioná una ubicación en el mapa."),
  lon: z.coerce.number().min(-180, "Seleccioná una ubicación en el mapa.").max(180, "Seleccioná una ubicación en el mapa."),
})

/**
 * Obtiene la imagen opcional del formulario y valida formato/tamaño permitidos.
 *
 * @param formData - Datos del formulario enviados desde la UI.
 * @returns El archivo de imagen listo para procesar o `null` si no se adjuntó imagen.
 */
function getOptionalImage(formData: FormData) {
  const image = formData.get("image")

  if (!(image instanceof File) || image.size === 0) {
    return null
  }

  if (!isAcceptedReportImageType(image.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  if (image.size > REPORT_IMAGE_MAX_BYTES) {
    throw new Error("La imagen optimizada no puede superar los 5 MB.")
  }

  return image
}

/**
 * Crea un reporte validando sesión activa y soporte para flujo anónimo.
 *
 * Si el usuario actual es anónimo, primero asegura un perfil base en `public.profiles`
 * para cumplir las claves foráneas de `reportes.usuario_id`.
 *
 * @param formData - Datos del formulario de creación de reporte.
 * @returns Resultado de mutación con `success`, `data` o `error`.
 */
export async function crearReporteAction(formData: FormData) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()

    if (!user) {
      return { success: false as const, error: "Tenés que iniciar sesión para crear un reporte." }
    }

    const parsedInput = createReportSchema.parse({
      titulo: formData.get("titulo"),
      descripcion: formData.get("descripcion"),
      categoriaId: formData.get("categoriaId"),
      prioridadId: formData.get("prioridadId"),
      lat: formData.get("lat"),
      lon: formData.get("lon"),
    })

    const adminClient = createAdminClient()
    const anonymous = isAnonymousUser(user)

    if (anonymous) {
      const perfilBaseResult = await asegurarPerfilBase(adminClient, user.id, user.email ?? null)

      if (!perfilBaseResult.success) {
        return {
          success: false as const,
          error: "No pudimos preparar tu perfil temporal para crear el reporte. Probá nuevamente.",
        }
      }
    }

    return await crearReporteWorkflow(adminClient, {
      usuarioId: user.id,
      titulo: parsedInput.titulo,
      descripcion: parsedInput.descripcion,
      categoriaId: parsedInput.categoriaId,
      prioridadId: parsedInput.prioridadId,
      lat: parsedInput.lat,
      lon: parsedInput.lon,
      image: getOptionalImage(formData),
      isAnonymous: anonymous,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => {
        if (issue.path[0] === "titulo") {
          return "El título debe tener al menos 3 caracteres."
        }

        if (issue.path[0] === "descripcion") {
          return "La descripción debe tener al menos 10 caracteres."
        }

        return issue.message
      })

      return {
        success: false as const,
        error: messages.join(" "),
      }
    }

    return {
      success: false as const,
      error: mutationErrorMessage(error, "No pudimos crear el reporte."),
    }
  }
}
