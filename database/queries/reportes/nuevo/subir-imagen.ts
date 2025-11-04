import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Sube una imagen al storage de Supabase y guarda su URL en la tabla fotos_reporte.
 * 
 * @param supabase - Cliente de Supabase
 * @param reporteId - ID del reporte al que pertenece la imagen
 * @param image - Archivo de imagen a subir
 * @returns URL pública de la imagen o null si hubo un error
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
      .from('reportes')
      .upload(filePath, image, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("Error al subir la imagen:", uploadError)
      throw new Error("Error al subir la imagen")
    }

    // Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from('reportes')
      .getPublicUrl(filePath)

    // Guardar la foto en la tabla fotos_reporte
    const { error: fotoError } = await supabase
      .from('fotos_reporte')
      .insert({
        reporte_id: reporteId,
        url: publicUrl
      })

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
