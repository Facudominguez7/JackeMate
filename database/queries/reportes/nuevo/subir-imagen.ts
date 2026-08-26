import { SupabaseClient } from "@supabase/supabase-js"

import { REPORT_BUCKET } from "@/lib/authz/catalog"
import {
  REPORT_IMAGE_THUMBNAIL_OUTPUT_EXTENSION,
  buildReportImagePublicUrl,
  isMissingReportImageColumnsError,
  type ReportImageRef,
} from "@/lib/media/report-images"

const IMMUTABLE_CACHE_CONTROL_SECONDS = "31536000"

function getFileExtension(file: File, fallback: string) {
  const extension = file.name.split(".").pop()?.trim().toLowerCase()
  return extension || fallback
}

function createPublicImageRef(path: string, publicUrl: string | null): ReportImageRef {
  return {
    bucket: REPORT_BUCKET,
    path,
    publicUrl,
  }
}

async function uploadReportImageObject(
  supabase: SupabaseClient,
  path: string,
  file: File,
) {
  const { error: uploadError } = await supabase.storage
    .from(REPORT_BUCKET)
    .upload(path, file, {
      cacheControl: IMMUTABLE_CACHE_CONTROL_SECONDS,
      upsert: false,
      contentType: file.type || undefined,
    })

  if (uploadError) {
    console.error("Error al subir la imagen:", uploadError)
    throw new Error("Error al subir la imagen")
  }

  const {
    data: { publicUrl: storagePublicUrl },
  } = supabase.storage.from(REPORT_BUCKET).getPublicUrl(path)

  const publicUrl = buildReportImagePublicUrl(createPublicImageRef(path, storagePublicUrl))

  return createPublicImageRef(path, publicUrl)
}

async function removeUploadedObjects(supabase: SupabaseClient, refs: ReportImageRef[]) {
  if (refs.length === 0) {
    return
  }

  const refsByBucket = refs.reduce<Record<string, string[]>>((acc, ref) => {
    const currentPaths = acc[ref.bucket] ?? []
    currentPaths.push(ref.path)
    acc[ref.bucket] = currentPaths
    return acc
  }, {})

  for (const [bucket, paths] of Object.entries(refsByBucket)) {
    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      console.error("No pudimos limpiar una imagen subida tras un error:", {
        bucket,
        message: error.message,
        pathCount: paths.length,
      })
    }
  }
}

async function insertReportImageRow(
  supabase: SupabaseClient,
  reporteId: number,
  imageRef: ReportImageRef,
  thumbnailRef: ReportImageRef | null,
) {
  const imageUrl = buildReportImagePublicUrl(imageRef) ?? imageRef.publicUrl ?? null
  const thumbnailUrl = thumbnailRef ? buildReportImagePublicUrl(thumbnailRef) ?? thumbnailRef.publicUrl ?? null : null

  let { error: fotoError } = await supabase
    .from("fotos_reporte")
    .insert({
      reporte_id: reporteId,
      url: imageUrl,
      bucket: imageRef.bucket,
      path: imageRef.path,
      thumbnail_url: thumbnailUrl,
      thumbnail_bucket: thumbnailRef?.bucket ?? null,
      thumbnail_path: thumbnailRef?.path ?? null,
    })

  if (fotoError && isMissingReportImageColumnsError(fotoError)) {
    ;({ error: fotoError } = await supabase
      .from("fotos_reporte")
      .insert({
        reporte_id: reporteId,
        url: imageUrl,
        bucket: imageRef.bucket,
        path: imageRef.path,
      }))
  }

  if (fotoError && isMissingReportImageColumnsError(fotoError)) {
    ;({ error: fotoError } = await supabase
      .from("fotos_reporte")
      .insert({
        reporte_id: reporteId,
        url: imageUrl,
      }))
  }

  if (fotoError) {
    console.error("Error al guardar la URL de la foto:", fotoError)
    throw new Error("Error al guardar la URL de la foto")
  }

  return imageUrl
}

/**
 * Uploads the detail image and an optional thumbnail to Supabase Storage,
 * then persists the metadata in `fotos_reporte`.
 */
export async function subirImagenReporte(
  supabase: SupabaseClient,
  reporteId: number,
  image: File,
  thumbnail: File | null = null,
) {
  const uploadedRefs: ReportImageRef[] = []

  try {
    const imageKey = crypto.randomUUID()
    const imagePath = `${reporteId}/${imageKey}.${getFileExtension(image, "webp")}`
    const thumbnailPath = thumbnail
      ? `${reporteId}/thumbnails/${imageKey}.${REPORT_IMAGE_THUMBNAIL_OUTPUT_EXTENSION}`
      : null

    const imageRef = await uploadReportImageObject(supabase, imagePath, image)
    uploadedRefs.push(imageRef)

    const thumbnailRef = thumbnailPath && thumbnail
      ? await uploadReportImageObject(supabase, thumbnailPath, thumbnail)
      : null

    if (thumbnailRef) {
      uploadedRefs.push(thumbnailRef)
    }

    return await insertReportImageRow(supabase, reporteId, imageRef, thumbnailRef)
  } catch (error) {
    await removeUploadedObjects(supabase, uploadedRefs)
    console.error("Error al subir imagen del reporte:", error)
    return null
  }
}
