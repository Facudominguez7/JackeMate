/**
 * Utilidad para generar imágenes de reportes para compartir en redes sociales
 */

interface ReporteData {
  id: number;
  titulo: string;
  descripcion: string;
  lat: number;
  lon: number;
  created_at: string;
  estado: string;
  categoria: string;
  usuarioPuntos?: number;
  usuarioUsername?: string;
}

/**
 * Dibuja un rectángulo con bordes redondeados en el canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Divide un texto en múltiples líneas según el ancho máximo
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Genera una imagen optimizada para Instagram Stories (1080x1920)
 * del reporte para compartir en redes sociales
 */
export async function generateReportImage(reporte: ReporteData): Promise<void> {
  // Crear canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo obtener el contexto del canvas");
  }

  // Colores de JackeMate (del CSS)
  const greenPrimary = "#22c55e"; // green-500/600 más cercano al oklch(0.58 0.15 160)
  const greenSecondary = "#16a34a"; // green-600
  const greenDark = "#15803d"; // green-700
  const white = "#ffffff";
  const black = "#1a1a1a";
  const lightBg = "#f8fef9";
  const textGray = "#404040";
  const textMuted = "#666";

  // Cargar el logo
  const logo = new Image();
  logo.crossOrigin = "anonymous";
  
  // Crear una promesa para esperar a que cargue el logo
  await new Promise<void>((resolve, reject) => {
    logo.onload = () => resolve();
    logo.onerror = () => resolve(); // Continuar aunque falle la carga
    logo.src = "/logo/logoJackeMate.png";
    
    // Timeout de seguridad
    setTimeout(() => resolve(), 2000);
  });

  // ===== FONDO BLANCO =====
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, 1080, 1920);

  // ===== CARD PRINCIPAL CON DEGRADADO VERDE =====
  const cardY = 80;
  const cardHeight = 1760;
  
  const gradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardHeight);
  gradient.addColorStop(0, greenPrimary);
  gradient.addColorStop(1, greenSecondary);
  ctx.fillStyle = gradient;
  roundRect(ctx, 60, cardY, 960, cardHeight, 40);
  ctx.fill();

  // ===== HEADER: LOGO =====
  ctx.fillStyle = white;
  ctx.font = "bold 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JackeMate", 540, cardY + 80);

  ctx.font = "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText("Sistema de Reportes Ciudadanos", 540, cardY + 120);

  // ===== CARD DE INFORMACIÓN DEL USUARIO (si hay puntos) =====
  let contentY = cardY + 160;
  
  if (reporte.usuarioPuntos !== undefined && reporte.usuarioUsername) {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundRect(ctx, 120, contentY, 840, 90, 20);
    ctx.fill();
    
    // Avatar placeholder
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(170, contentY + 45, 32, 0, Math.PI * 2);
    ctx.fill();
    
    // Iniciales del usuario
    ctx.fillStyle = greenPrimary;
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    const initials = reporte.usuarioUsername.substring(0, 2).toUpperCase();
    ctx.fillText(initials, 170, contentY + 52);
    
    // Username
    ctx.fillStyle = white;
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(reporte.usuarioUsername, 220, contentY + 38);
    
    // Puntos
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(`⭐ ${reporte.usuarioPuntos} puntos`, 220, contentY + 65);
    
    contentY += 110;
  }

  // ===== CONTENEDOR BLANCO PARA EL REPORTE =====
  const containerY = contentY;
  const containerHeight = 880; // Altura fija más compacta
  
  ctx.fillStyle = white;
  roundRect(ctx, 120, containerY, 840, containerHeight, 30);
  ctx.fill();

  // ===== BADGES =====
  let badgesY = containerY + 35;
  
  // Badge de estado
  const estado = reporte.estado;
  let badgeColor = greenSecondary;
  if (estado.toLowerCase() === "reparado") badgeColor = greenPrimary;
  if (estado.toLowerCase() === "rechazado") badgeColor = black;
  if (estado.toLowerCase() === "pendiente") badgeColor = greenDark;

  ctx.fillStyle = badgeColor;
  roundRect(ctx, 160, badgesY, 180, 45, 22);
  ctx.fill();

  ctx.fillStyle = white;
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(estado, 250, badgesY + 32);

  // Badge de categoría
  const categoria = reporte.categoria;
  ctx.fillStyle = greenDark;
  roundRect(ctx, 360, badgesY, 220, 45, 22);
  ctx.fill();

  ctx.fillStyle = white;
  ctx.fillText(categoria, 470, badgesY + 32);

  // ===== TÍTULO DEL REPORTE =====
  ctx.fillStyle = black;
  ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";

  const tituloLines = wrapText(ctx, reporte.titulo, 720);
  let y = badgesY + 90;

  for (let i = 0; i < Math.min(tituloLines.length, 2); i++) {
    ctx.fillText(tituloLines[i], 160, y);
    y += 50;
  }

  // ===== DESCRIPCIÓN =====
  ctx.fillStyle = textGray;
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  y += 20;

  const descLines = wrapText(ctx, reporte.descripcion, 720);

  for (let i = 0; i < Math.min(descLines.length, 4); i++) {
    ctx.fillText(descLines[i], 160, y);
    y += 36;
  }

  // Si la descripción es muy larga, agregar "..."
  if (descLines.length > 4) {
    const lastLine = descLines[3];
    if (lastLine.length > 70) {
      ctx.fillText(lastLine.substring(0, 67) + "...", 160, y - 36);
    }
  }

  // ===== LÍNEA DECORATIVA =====
  y += 30;
  ctx.strokeStyle = lightBg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, y);
  ctx.lineTo(800, y);
  ctx.stroke();

  // ===== INFORMACIÓN ADICIONAL =====
  y += 40;
  
  // Ubicación
  ctx.fillStyle = textMuted;
  ctx.font = "23px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(
    `📍 Lat: ${reporte.lat.toFixed(4)}, Lon: ${reporte.lon.toFixed(4)}`,
    160,
    y
  );

  // Fecha
  y += 40;
  const fecha = new Date(reporte.created_at).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillText(`📅 ${fecha}`, 160, y);

  // ===== CALL TO ACTION EN EL FONDO VERDE =====
  y = containerY + containerHeight + 50;
  
  ctx.fillStyle = white;
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";

  let callToAction = "";
  if (estado.toLowerCase() === "reparado") {
    callToAction = "✅ ¡Este problema ya fue solucionado!";
  } else if (estado.toLowerCase() === "rechazado") {
    callToAction = "❌ Marcado como inexistente";
  } else {
    callToAction = "🚨 ¡Ayudá a visibilizar este problema!";
  }

  ctx.fillText(callToAction, 540, y);

  // ===== LOGO DE JACKEMATE =====
  y += 60;
  
  // Fondo semi-transparente blanco para el logo
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  roundRect(ctx, 420, y, 240, 240, 20);
  ctx.fill();
  
  // Borde blanco
  ctx.strokeStyle = white;
  ctx.lineWidth = 3;
  roundRect(ctx, 420, y, 240, 240, 20);
  ctx.stroke();

  // Dibujar el logo si se cargó correctamente
  if (logo.complete && logo.naturalHeight !== 0) {
    const logoSize = 180;
    const logoX = 540 - logoSize / 2;
    const logoY = y + 30;
    
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  } else {
    // Fallback si el logo no cargó
    ctx.fillStyle = white;
    ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("JackeMate", 540, y + 110);
    ctx.fillText("🌱", 540, y + 145);
  }

  // ===== FOOTER =====
  ctx.fillStyle = black; // Cambiado a negro
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("JackeMate - Mejorando nuestra ciudad juntos 🌱", 540, 1840);

  // ===== CONVERTIR A BLOB Y DESCARGAR =====
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jackemate-reporte-${reporte.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      } else {
        reject(new Error("No se pudo generar el blob de la imagen"));
      }
    }, "image/png");
  });
}
