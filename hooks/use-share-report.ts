import { useState } from "react";
import { toast } from "sonner";
import { generateReportImage } from "@/lib/generate-report-image";

interface ReporteData {
  id: number;
  titulo: string;
  descripcion: string;
  lat: number;
  lon: number;
  created_at: string;
  estados: any;
  categorias: any;
  profiles?: any;
}

interface UseShareReportProps {
  reporte: ReporteData | null;
  usuarioPuntos?: number;
}

/**
 * Hook personalizado para manejar la funcionalidad de compartir reportes
 */
export function useShareReport({ reporte, usuarioPuntos }: UseShareReportProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const getNombre = (obj: any): string => {
    if (!obj) return "N/A";
    if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A";
    if (obj.nombre) return obj.nombre;
    return "N/A";
  };

  const getUsername = (obj: any): string => {
    if (!obj) return "";
    if (Array.isArray(obj) && obj.length > 0) return obj[0].username || "";
    if (obj.username) return obj.username;
    return "";
  };

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const getShareMessage = () => {
    if (!reporte) return "";

    const estado = getNombre(reporte.estados);
    const categoria = getNombre(reporte.categorias);

    let mensaje = "";

    if (estado.toLowerCase() === "reparado") {
      mensaje = `✅ ¡Buenas noticias! Este problema ya fue reparado:\n\n`;
    } else if (estado.toLowerCase() === "rechazado") {
      mensaje = `❌ Este reporte fue marcado como inexistente:\n\n`;
    } else {
      mensaje = `🚨 Problema reportado en nuestra ciudad:\n\n`;
    }

    mensaje += `📍 ${reporte.titulo}\n`;
    mensaje += `🏷️ Categoría: ${categoria}\n`;
    mensaje += `📊 Estado: ${estado}\n\n`;

    if (estado.toLowerCase() === "pendiente") {
      mensaje += `¡Ayudá a visibilizar este problema! 👇\n\n`;
    }
    
    mensaje += `Reportado en JackeMate 🌱\n`;

    return mensaje;
  };

  const handleGenerateImage = async () => {
    if (!reporte) return;

    setIsGeneratingImage(true);
    try {
      const username = getUsername(reporte.profiles);
      
      await generateReportImage({
        id: reporte.id,
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        lat: reporte.lat,
        lon: reporte.lon,
        created_at: reporte.created_at,
        estado: getNombre(reporte.estados),
        categoria: getNombre(reporte.categorias),
        usuarioPuntos: usuarioPuntos,
        usuarioUsername: username || undefined,
      });

      toast.success("¡Imagen generada! Se descargó automáticamente", {
        description: "Ahora podés compartirla en Instagram Stories",
      });
    } catch (error) {
      console.error("Error al generar imagen:", error);
      toast.error("Error al generar la imagen");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return {
    showShareDialog,
    setShowShareDialog,
    isGeneratingImage,
    shareUrl: getShareUrl(),
    shareMessage: getShareMessage(),
    handleGenerateImage,
  };
}
