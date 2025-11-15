import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recupera el nombre de usuario asociado a un ID de usuario desde la tabla `profiles`.
 *
 * @param supabase - Cliente de Supabase configurado para realizar la consulta
 * @param userId - ID del usuario cuyo nombre de usuario se desea obtener
 * @returns Un objeto con `data` siendo el nombre de usuario o `"Usuario"` si no existe o ocurre un error, y `error` con el error ocurrido o `null` en caso de éxito
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
 * Obtiene el registro completo del perfil de un usuario.
 *
 * @param userId - ID del usuario cuyo perfil se desea recuperar
 * @returns `data` es el registro del perfil o `null` si ocurre un error; `error` contiene el error devuelto por Supabase o `null` en caso de éxito
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