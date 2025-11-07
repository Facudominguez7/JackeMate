import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { 
      ownerEmail, 
      ownerUsername, 
      reporteId, 
      reporteTitulo, 
      nuevoEstado,
      comentario 
    } = await request.json();

    // Validar que tenemos todos los datos necesarios
    if (!ownerEmail || !reporteId || !reporteTitulo || !nuevoEstado) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Determinar si es Reparado o Rechazado
    const esReparado = nuevoEstado === "Reparado";
    const esRechazado = nuevoEstado === "Rechazado";

    // Definir colores y textos según el estado
    const estadoColor = esReparado ? '#16a34a' : '#dc2626';
    const estadoColorLight = esReparado ? '#f8fef9' : '#fef2f2';
    const estadoEmoji = esReparado ? '✅' : '❌';
    const estadoTexto = esReparado 
      ? 'Tu reporte ha sido marcado como <strong style="color: #16a34a;">Reparado</strong>' 
      : 'Tu reporte ha sido <strong style="color: #dc2626;">Rechazado</strong>';

    const mensajeAdicional = esReparado
      ? '¡Gracias por tu contribución! Tu reporte ayudó a mejorar la comunidad.'
      : 'Lamentamos informarte que tu reporte no cumplió con los criterios de validación o fue marcado como "No Existe" por otros usuarios.';

    // Enviar el correo
    const { data, error } = await resend.emails.send({
      from: "JackeMate <team@notificaciones.octavioduarte.com.ar>",
      to: [ownerEmail],
      subject: `${estadoEmoji} Tu reporte "${reporteTitulo}" cambió de estado`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cambio de estado en tu reporte</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <!-- Encabezado con colores de marca verde -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 35px 30px; border-radius: 12px 12px 0 0; text-align: center; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">JackeMate</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">Sistema de Reportes Ciudadanos</p>
            </div>
            
            <!-- Contenido principal -->
            <div style="background: #ffffff; padding: 35px 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #1a1a1a; margin-top: 0; font-size: 22px; font-weight: 600;">¡Hola ${ownerUsername || "Usuario"}! 👋</h2>
              
              <p style="font-size: 16px; color: #404040; line-height: 1.6; margin: 20px 0;">
                ${estadoTexto}
              </p>
              
              <!-- Tarjeta del reporte -->
              <div style="background: ${estadoColorLight}; padding: 24px; border-left: 5px solid ${estadoColor}; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <h3 style="margin: 0; color: ${estadoColor}; font-size: 18px; font-weight: 600;">${reporteTitulo}</h3>
                </div>
                
                <div style="background: white; padding: 18px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 15px;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Nuevo Estado</p>
                  <p style="margin: 0; color: ${estadoColor}; font-size: 18px; font-weight: 700;">${estadoEmoji} ${nuevoEstado}</p>
                  ${comentario ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">Comentario:</p>
                      <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${comentario}</p>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
                ${mensajeAdicional}
              </p>
              
              <!-- Botón de acción -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reportes/${reporteId}" 
                   style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); transition: all 0.3s ease;">
                  Ver Detalles del Reporte
                </a>
              </div>
              
              <!-- Información adicional -->
              <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #f0f0f0; font-size: 14px; color: #666;">
                ${esReparado ? `
                  <p style="margin: 0 0 12px 0; padding: 12px; background: #f8fef9; border-radius: 6px; border-left: 3px solid #16a34a;">
                    <strong style="color: #15803d;">🎉 ¡Excelente trabajo!</strong> Tu reporte contribuyó a resolver un problema en la comunidad.
                  </p>
                ` : `
                  <p style="margin: 0 0 12px 0; padding: 12px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #dc2626;">
                    <strong style="color: #dc2626;">💡 ¿Qué puedes hacer?</strong> Revisá los criterios de validación antes de crear nuevos reportes.
                  </p>
                `}
                <p style="margin: 15px 0 0 0; font-size: 12px; color: #999; text-align: center;">
                  Si no querés recibir estas notificaciones, podés ajustar tus preferencias en tu perfil.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 25px; padding: 25px 20px; color: #999; font-size: 12px; background: white; border-radius: 8px; border: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #666;">© ${new Date().getFullYear()} JackeMate. Todos los derechos reservados.</p>
              <p style="margin: 0; color: #999;">Sistema de reportes ciudadanos para una comunidad mejor 🌱</p>
            </div>
          </body>
        </html>
      `,
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
