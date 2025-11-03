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
 * Fetches all non-deleted comments for a given report, including each comment's author username, ordered by creation time ascending.
 *
 * @param reporteId - The report `id` to retrieve comments for
 * @returns An object with `data` set to an array of comment records (each containing `id`, `reporte_id`, `usuario_id`, `contenido`, `created_at`, and `profiles.username`) and `error` set to any encountered error or `null` on success
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
 * Create a new comment for a report and award points to the author.
 *
 * @param reporteId - The report's numeric identifier to attach the comment to
 * @param usuarioId - The user's identifier creating the comment
 * @param contenido - The comment text content
 * @returns An object with `data` set to the inserted comment (including `profiles.username`) or `null`, and `error` set to the error object or `null`
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
 * Soft-deletes a report comment by setting its `deleted_at` timestamp.
 *
 * Only the comment's author (matching `usuarioId`) can perform the deletion.
 *
 * @param comentarioId - ID of the comment to mark as deleted
 * @param usuarioId - ID of the user attempting the deletion; deletion only occurs if this matches the comment's author
 * @returns An object with `success` set to `true` when the comment was marked deleted, `false` otherwise; `error` contains the database error on failure and `null` on success
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