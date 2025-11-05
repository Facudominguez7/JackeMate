import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Obtiene el email de un usuario específico usando el admin API de Supabase.
 * Esta ruta solo debe ser llamada desde el servidor, no desde el cliente.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener el usuario actual para verificar que está autenticado
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Crear un cliente de Supabase con la service role key para acceder a auth.users
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Obtener el email del usuario
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data) {
      console.error("Error al obtener usuario:", error);
      return NextResponse.json(
        { error: "Error al obtener usuario" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { email: data.user.email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en API get-user-email:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
