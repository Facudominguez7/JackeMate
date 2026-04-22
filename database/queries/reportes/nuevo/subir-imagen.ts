import { SupabaseClient } from "@supabase/supabase-js"

import { REPORT_BUCKET } from "@/lib/authz/catalog"
import {
  buildReportImagePublicUrl,
  isMissingReportImageColumnsError,
} from "@/lib/media/report-images"

/**
 * Sube una imagen al bucket "reportes" de Supabase, guarda su URL en la tabla `fotos_reporte` y devuelve la URL pública.
 *
 * @returns La URL pública de la imagen subida, o `null` si se produce algún error.
 */
export async function subirImagenReporte(
  supabase: SupabaseClient,
  reporteId: number,
  image: File
) {
  try {
    const fileExt = image.name.split('.').pop()
    const fileName = `${reporteId}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Subir imagen al bucket 'reportes'
    const { error: uploadError } = await supabase.storage
      .from(REPORT_BUCKET)
      .upload(filePath, image, {
        cacheControl: '3600',
        upsert: false,
        contentType: image.type || undefined,
      })

    if (uploadError) {
      console.error("Error al subir la imagen:", uploadError)
      throw new Error("Error al subir la imagen")
    }

    // Obtener URL pública de la imagen
    const { data: { publicUrl: storagePublicUrl } } = supabase.storage
      .from(REPORT_BUCKET)
      .getPublicUrl(filePath)

    const publicUrl = buildReportImagePublicUrl({
      bucket: REPORT_BUCKET,
      path: filePath,
      publicUrl: storagePublicUrl,
    })

    // Guardar la foto en la tabla fotos_reporte
    let { error: fotoError } = await supabase
      .from('fotos_reporte')
      .insert({
        reporte_id: reporteId,
        url: publicUrl,
        bucket: REPORT_BUCKET,
        path: filePath,
      })

    if (fotoError && isMissingReportImageColumnsError(fotoError)) {
      ;({ error: fotoError } = await supabase
        .from('fotos_reporte')
        .insert({
          reporte_id: reporteId,
          url: publicUrl,
        }))
    }

    if (fotoError) {
      console.error("Error al guardar la URL de la foto:", fotoError)
      throw new Error("Error al guardar la URL de la foto")
    }

    return publicUrl
  } catch (error) {
    console.error("Error al subir imagen del reporte:", error)
    return null
  }
}
