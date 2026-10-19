"use server"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import { headers } from "next/headers"
import { ZodError, z } from "zod"

import { crearReporteWorkflow, mutationErrorMessage } from "@/lib/use-cases/reportes"
import { isAcceptedReportImageType } from "@/lib/media/report-images"
import {
  validateUploadedReportImage,
  validateUploadedReportThumbnail,
} from "@/lib/media/report-image-validation.server"
import { isAnonymousUser } from "@/lib/authz/roles"
import {
  claimReportSubmission,
  hashClientIp,
  releaseReportSubmission,
  reportSubmissionClaimMessage,
} from "@/lib/security/report-submission-guard.server"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

const createReportSchema = z.object({
  titulo: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().min(10).max(5000),
  categoriaId: z.coerce.number().int().positive("Seleccioná una categoría."),
  prioridadId: z.coerce.number().int().positive("Seleccioná una prioridad."),
  lat: z.coerce.number().min(-90, "Seleccioná una ubicación en el mapa." ).max(90, "Seleccioná una ubicación en el mapa."),
  lon: z.coerce.number().min(-180, "Seleccioná una ubicación en el mapa.").max(180, "Seleccioná una ubicación en el mapa."),
  submissionId: z.string().uuid("No pudimos identificar el envío. Recargá la página e intentá nuevamente."),
  captchaToken: z.string().trim().max(4096).optional(),
})

type ReportActorResult =
  | { success: true; user: User }
  | { success: false; error: string }

/**
 * Resolves who is creating the report. This is the ONLY place where JackeMate creates
 * an anonymous identity: after the submission was validated and only when the request
 * carries no valid session. Existing sessions (anonymous or permanent) are always reused,
 * so visiting pages or opening "Mis reportes" never creates users.
 */
async function resolveReportActor(
  sessionClient: SupabaseClient,
  captchaToken: string | undefined,
): Promise<ReportActorResult> {
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  if (user) {
    return { success: true, user }
  }

  const { data, error } = await sessionClient.auth.signInAnonymously(
    captchaToken ? { options: { captchaToken } } : undefined,
  )

  if (error || !data.user) {
    if (error?.code === "over_request_rate_limit" || error?.status === 429) {
      return { success: false, error: "Demasiados intentos desde tu conexión. Probá de nuevo en unos minutos." }
    }

    if (error?.code === "anonymous_provider_disabled") {
      return { success: false, error: "Los reportes como invitado no están disponibles. Iniciá sesión para reportar." }
    }

    if (error?.message?.toLowerCase().includes("captcha")) {
      return { success: false, error: "Completá la verificación de seguridad e intentá nuevamente." }
    }

    return { success: false, error: "No pudimos preparar tu sesión de invitado. Intentá nuevamente." }
  }

  return { success: true, user: data.user }
}

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
    const parsedInput = createReportSchema.parse({
      titulo: formData.get("titulo"),
      descripcion: formData.get("descripcion"),
      categoriaId: formData.get("categoriaId"),
      prioridadId: formData.get("prioridadId"),
      lat: formData.get("lat"),
      lon: formData.get("lon"),
      submissionId: formData.get("submissionId"),
      captchaToken: formData.get("captchaToken") || undefined,
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

    // Identity is resolved only after the payload is valid, to avoid minting
    // anonymous users for submissions that would be rejected anyway.
    const sessionClient = await createClient()
    const actor = await resolveReportActor(sessionClient, parsedInput.captchaToken)

    if (!actor.success) {
      return { success: false as const, error: actor.error }
    }

    const adminClient = createAdminClient()
    const claim = await claimReportSubmission(adminClient, {
      submissionId: parsedInput.submissionId,
      actorId: actor.user.id,
      ipHash: hashClientIp(await headers()),
    })

    if (claim !== "ok") {
      return { success: false as const, error: reportSubmissionClaimMessage(claim) }
    }

    try {
      const result = await crearReporteWorkflow(adminClient, {
        usuarioId: actor.user.id,
        actorIsAnonymous: isAnonymousUser(actor.user),
        titulo: parsedInput.titulo,
        descripcion: parsedInput.descripcion,
        categoriaId: parsedInput.categoriaId,
        prioridadId: parsedInput.prioridadId,
        lat: parsedInput.lat,
        lon: parsedInput.lon,
        image: image?.file ?? null,
        imageThumbnail: imageThumbnail?.file ?? null,
      })

      if (!result.success) {
        await releaseReportSubmission(adminClient, parsedInput.submissionId)
      }

      return result
    } catch (workflowError) {
      await releaseReportSubmission(adminClient, parsedInput.submissionId)
      throw workflowError
    }
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
