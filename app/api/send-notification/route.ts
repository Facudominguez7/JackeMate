import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPrivateProfileContact } from "@/database/queries/profiles";
import { sendCommentNotificationEmail } from "@/lib/notifications/report-notifications";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const commentNotificationSchema = z
  .object({
    reporteId: z.coerce.number().int().positive().optional(),
    reportId: z.coerce.number().int().positive().optional(),
    comentarioContenido: z.string().trim().min(1).optional(),
    commentContent: z.string().trim().min(1).optional(),
  })
  .transform((value) => ({
    reporteId: value.reporteId ?? value.reportId,
    comentarioContenido: value.comentarioContenido ?? value.commentContent,
  }));

/**
 * Envía una notificación por correo al propietario cuando se añade un nuevo comentario a un reporte.
 *
 * @param request - Petición POST cuya carga JSON debe incluir `ownerEmail`, `reporteId`, `reporteTitulo` y `comentarioContenido`. Opcionales: `ownerUsername` y `commenterUsername`.
 * @returns Un objeto JSON con:
 *  - `{ success: true, messageId }` en caso de envío correcto,
 *  - `{ error: "Faltan datos requeridos" }` con estado 400 si faltan campos obligatorios,
 *  - `{ error: "Error al enviar el correo" }` o `{ error: "Error interno del servidor" }` con estado 500 en caso de fallo al enviar el correo o error interno.
 */
export async function POST(request: NextRequest) {
  try {
    const parsedBody = commentNotificationSchema.safeParse(await request.json());

    if (!parsedBody.success || !parsedBody.data.reporteId || !parsedBody.data.comentarioContenido) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: reporte, error: reporteError } = await supabase
      .from("reportes")
      .select("id, titulo, usuario_id")
      .eq("id", parsedBody.data.reporteId)
      .single();

    if (reporteError || !reporte) {
      console.error("Error al obtener reporte para notificación:", reporteError);
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    if (!reporte.usuario_id || reporte.usuario_id === user.id) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const adminClient = createAdminClient();
    const [{ data: ownerProfile, error: ownerError }, { data: commenterProfile, error: commenterError }] = await Promise.all([
      getPrivateProfileContact(adminClient, reporte.usuario_id),
      getPrivateProfileContact(adminClient, user.id),
    ]);

    if (ownerError || !ownerProfile) {
      console.error("Error al obtener propietario para notificación:", ownerError);
      return NextResponse.json({ error: "No se pudo resolver el destinatario" }, { status: 500 });
    }

    if (commenterError) {
      console.error("Error al obtener comentarista para notificación:", commenterError);
    }

    if (!ownerProfile.email) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const { data, error } = await sendCommentNotificationEmail({
      ownerEmail: ownerProfile.email,
      ownerUsername: ownerProfile.username,
      commenterUsername: commenterProfile?.username ?? user.email?.split("@")[0] ?? "Un usuario",
      reporteId: reporte.id,
      reporteTitulo: reporte.titulo,
      comentarioContenido: parsedBody.data.comentarioContenido,
    });

    if (error) {
      console.error("Error al enviar correo con Resend:", error);
      return NextResponse.json(
        { error: "Error al enviar el correo" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en API de notificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
