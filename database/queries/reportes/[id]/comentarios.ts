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
 * Obtiene todos los comentarios de un reporte
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
 * Crea un nuevo comentario en un reporte
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
 * Realiza un soft delete de un comentario
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
