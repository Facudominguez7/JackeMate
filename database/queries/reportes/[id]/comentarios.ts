import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, PUNTOS } from "@/database/queries/puntos";

export type Comentario = {
  id: number;
  reporte_id: number;
  usuario_id: string;
  contenido: string;
  created_at: string;
  profiles:
    | {
        username: string;
      }
    | {
        username: string;
      }[];
};

/**
 * Fetches non-deleted comments for a report, including each comment's author username, ordered by creation time.
 *
 * @param reporteId - The report ID to retrieve comments for
 * @returns An object with `data`: an array of comment records (fields: `id`, `reporte_id`, `usuario_id`, `contenido`, `created_at`, and `profiles` containing `username`), and `error`: the error object or `null`
 */
export async function getComentariosReporte(
  supabase: SupabaseClient,
  reporteId: string
) {
  const { data, error } = await supabase
    .from("comentarios_reporte")
    .select(
      `
      id,
      reporte_id,
      usuario_id,
      contenido,
      created_at,
      profiles (username)
    `
    )
    .eq("reporte_id", reporteId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener comentarios:", error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * Create a new comment for a report and award points to the comment author.
 *
 * @param reporteId - Numeric ID of the report to attach the comment to
 * @param usuarioId - ID of the user creating the comment
 * @param contenido - Text content of the comment
 * @returns An object with `data` set to the created comment (including `profiles.username`) or `null`, and `error` set to the error object or `null`
 */
export async function crearComentario(
  supabase: SupabaseClient,
  reporteId: number,
  usuarioId: string,
  contenido: string
) {
  const { data, error } = await supabase
    .from("comentarios_reporte")
    .insert({
      reporte_id: reporteId,
      usuario_id: usuarioId,
      contenido: contenido,
    })
    .select(
      `
      id,
      reporte_id,
      usuario_id,
      contenido,
      created_at,
      profiles (username)
    `
    )
    .single();

  if (error) {
    console.error("Error al crear comentario:", error);
    return { data: null, error };
  }

  // Sumar puntos por comentar
  await sumarPuntos(
    supabase,
    usuarioId,
    PUNTOS.COMENTAR_REPORTE,
    "Comentar en reporte"
  );

  return { data, error: null };
}

/**
 * Soft-deletes a comment, scoped to the comment's author.
 *
 * Sets the comment's `deleted_at` timestamp if `usuarioId` matches the comment's author.
 *
 * @param comentarioId - The numeric ID of the comment to delete
 * @param usuarioId - The ID of the user attempting the deletion (must be the comment's author)
 * @returns An object with `success: true` and `error: null` on success, or `success: false` and the `error` on failure
 */
export async function eliminarComentario(
  supabase: SupabaseClient,
  comentarioId: number,
  usuarioId: string
) {
  const { error } = await supabase
    .from("comentarios_reporte")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", comentarioId)
    .eq("usuario_id", usuarioId); // Solo el autor puede eliminar

  if (error) {
    console.error("Error al eliminar comentario:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}