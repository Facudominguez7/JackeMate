import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el username de un usuario específico desde su perfil.
 *
 * @param supabase - Cliente de Supabase configurado
 * @param userId - ID del usuario del cual obtener el username
 * @returns Objeto con `data` (username del usuario o "Usuario" por defecto) y `error`
 */
export async function getUserUsername(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error al obtener username:", error);
      return { data: "Usuario", error };
    }

    return { data: data?.username || "Usuario", error: null };
  } catch (error) {
    console.error("Error en getUserUsername:", error);
    return { data: "Usuario", error };
  }
}

/**
 * Obtiene información completa del perfil de un usuario.
 *
 * @param supabase - Cliente de Supabase configurado
 * @param userId - ID del usuario del cual obtener el perfil
 * @returns Objeto con `data` (perfil completo del usuario) y `error`
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error al obtener perfil:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error en getUserProfile:", error);
    return { data: null, error };
  }
}
