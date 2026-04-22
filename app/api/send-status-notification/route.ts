import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPrivateProfileContact } from "@/database/queries/profiles";
import { getUserRoleContext, isAdminRole } from "@/lib/authz/roles";
import { sendStatusNotificationEmail } from "@/lib/notifications/report-notifications";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const statusNotificationSchema = z
  .object({
    reporteId: z.coerce.number().int().positive().optional(),
    reportId: z.coerce.number().int().positive().optional(),
    estadoId: z.coerce.number().int().positive().optional(),
    statusId: z.coerce.number().int().positive().optional(),
    nuevoEstado: z.string().trim().min(1).optional(),
    comentario: z.string().trim().max(4000).optional().nullable(),
    comment: z.string().trim().max(4000).optional().nullable(),
  })
  .transform((value) => ({
    reporteId: value.reporteId ?? value.reportId,
    estadoId: value.estadoId ?? value.statusId,
    nuevoEstado: value.nuevoEstado,
    comentario: value.comentario ?? value.comment ?? null,
  }));

/**
 * Envía una notificación por correo al propietario de un reporte cuando su estado cambia.
 *
 * Envía un email personalizado (HTML) usando Resend con detalles del reporte, el nuevo estado
 * (por ejemplo "Reparado" o "Rechazado") y un comentario opcional; valida campos requeridos antes de enviar.
 *
 * @returns Un objeto JSON con `{ success: true, messageId }` y estado 200 si el envío fue exitoso;
 *          `{ error: "Faltan datos requeridos" }` con estado 400 si faltan campos obligatorios;
 *          `{ error: "Error al enviar el correo" }` o `{ error: "Error interno del servidor" }` con estado 500 en caso de fallo.
 */
export async function POST(request: NextRequest) {
  try {
    const parsedBody = statusNotificationSchema.safeParse(await request.json());

    if (!parsedBody.success || !parsedBody.data.reporteId || (!parsedBody.data.estadoId && !parsedBody.data.nuevoEstado)) {
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

    const { data: actorRole, error: actorRoleError } = await getUserRoleContext(supabase, user.id);

    if (actorRoleError) {
      console.error("Error al obtener rol del actor:", actorRoleError);
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!isAdminRole(actorRole?.roleId)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: reporte, error: reporteError } = await supabase
      .from("reportes")
      .select("id, titulo, usuario_id")
      .eq("id", parsedBody.data.reporteId)
      .single();

    if (reporteError || !reporte) {
      console.error("Error al obtener reporte para notificación de estado:", reporteError);
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    if (!reporte.usuario_id) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const adminClient = createAdminClient();
    const { data: ownerProfile, error: ownerError } = await getPrivateProfileContact(adminClient, reporte.usuario_id);

    if (ownerError || !ownerProfile) {
      console.error("Error al obtener propietario para notificación de estado:", ownerError);
      return NextResponse.json({ error: "No se pudo resolver el destinatario" }, { status: 500 });
    }

    if (!ownerProfile.email) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    let nuevoEstado = parsedBody.data.nuevoEstado ?? null;

    if (parsedBody.data.estadoId) {
      const { data: estado, error: estadoError } = await supabase
        .from("estados")
        .select("nombre")
        .eq("id", parsedBody.data.estadoId)
        .single();

      if (estadoError || !estado) {
        console.error("Error al obtener estado para notificación:", estadoError);
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }

      nuevoEstado = estado.nombre;
    } else if (nuevoEstado) {
      const { data: estado, error: estadoError } = await supabase
        .from("estados")
        .select("nombre")
        .eq("nombre", nuevoEstado)
        .single();

      if (estadoError || !estado) {
        console.error("Error al validar estado para notificación:", estadoError);
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }

      nuevoEstado = estado.nombre;
    }

    if (!nuevoEstado) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const { data, error } = await sendStatusNotificationEmail({
      ownerEmail: ownerProfile.email,
      ownerUsername: ownerProfile.username,
      reporteId: reporte.id,
      reporteTitulo: reporte.titulo,
      nuevoEstado,
      comentario: parsedBody.data.comentario,
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
    console.error("Error en API de notificación de estado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
