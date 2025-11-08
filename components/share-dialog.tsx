"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Share2, Copy, Check, Download, X } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  shareMessage: string;
  onGenerateImage: () => Promise<void>;
  isGeneratingImage: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  shareUrl,
  shareMessage,
  onGenerateImage,
  isGeneratingImage,
}: ShareDialogProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + shareUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareTwitter = () => {
    // Extraer el título del mensaje (primera línea después del emoji)
    const lines = shareMessage.split("\n");
    const titulo = lines.find((line) => line.includes("📍"))?.replace("📍 ", "") || shareMessage;
    const texto = shareMessage.includes("✅")
      ? `✅ ¡Buenas noticias! ${titulo} #JackeMate #CiudadMejor 🌱`
      : `🚨 ${titulo} #JackeMate #ReporteCiudadano 🌱`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartir Reporte
          </AlertDialogTitle>
          <AlertDialogDescription>
            Elegí cómo querés compartir este reporte
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {/* WhatsApp */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-200 dark:border-green-900"
            onClick={handleShareWhatsApp}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Compartir por mensaje</p>
              </div>
            </div>
          </Button>

          {/* Twitter/X */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-900"
            onClick={handleShareTwitter}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">X (Twitter)</p>
                <p className="text-xs text-muted-foreground">Publicar en tu timeline</p>
              </div>
            </div>
          </Button>

          {/* Copiar enlace */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-purple-200 dark:border-purple-900"
            onClick={handleCopyLink}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                {linkCopied ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">
                  {linkCopied ? "¡Enlace copiado!" : "Copiar enlace"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {linkCopied ? "Listo para pegar" : "Compartir en cualquier lugar"}
                </p>
              </div>
            </div>
          </Button>

          {/* Generar imagen */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-950/20 dark:hover:to-purple-950/20 border-pink-200 dark:border-pink-900"
            onClick={onGenerateImage}
            disabled={isGeneratingImage}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">
                  {isGeneratingImage ? "Generando..." : "Descargar imagen"}
                </p>
                <p className="text-xs text-muted-foreground">Para Instagram Stories</p>
              </div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
