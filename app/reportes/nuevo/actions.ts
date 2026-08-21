"use server"

import { ZodError, z } from "zod"

import { crearReporteWorkflow, mutationErrorMessage } from "@/lib/use-cases/reportes"
import { isAcceptedReportImageType } from "@/lib/media/report-images"
import {
  validateUploadedReportImage,
  validateUploadedReportThumbnail,
} from "@/lib/media/report-image-validation.server"
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

async function getOptionalImage(formData: FormData) {
  const image = formData.get("image")

  if (!(image instanceof File) || image.size === 0) {
    return null
  }

  if (!isAcceptedReportImageType(image.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  const metadata = await validateUploadedReportImage(image)

  return { file: image, metadata }
}

async function getOptionalThumbnail(formData: FormData) {
  const thumbnail = formData.get("imageThumbnail")

  if (!(thumbnail instanceof File) || thumbnail.size === 0) {
    return null
  }

  const metadata = await validateUploadedReportThumbnail(thumbnail)

  return { file: thumbnail, metadata }
}

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

    const image = await getOptionalImage(formData)
    const imageThumbnail = await getOptionalThumbnail(formData)

    if (imageThumbnail && !image) {
      return {
        success: false as const,
        error: "No pudimos validar la miniatura sin la imagen principal.",
      }
    }

    if (
      image &&
      imageThumbnail &&
      (imageThumbnail.metadata.width > image.metadata.width ||
        imageThumbnail.metadata.height > image.metadata.height)
    ) {
      return {
        success: false as const,
        error: "La miniatura generada no coincide con la imagen principal.",
      }
    }

    const adminClient = createAdminClient()

    return await crearReporteWorkflow(adminClient, {
      usuarioId: user.id,
      titulo: parsedInput.titulo,
      descripcion: parsedInput.descripcion,
      categoriaId: parsedInput.categoriaId,
      prioridadId: parsedInput.prioridadId,
      lat: parsedInput.lat,
      lon: parsedInput.lon,
      image: image?.file ?? null,
      imageThumbnail: imageThumbnail?.file ?? null,
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
