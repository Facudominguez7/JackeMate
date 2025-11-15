"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  ArrowLeft,
  Calendar,
  Flag,
  Share2,
  ThumbsDown,
  Trash2,
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dynamic from "next/dynamic";
import { LoadingLogo } from "@/components/loading-logo";
import { toast } from "sonner";
import {
  getReporteDetalle,
  getVotosNoExiste,
  verificarVotoUsuario,
  votarNoExiste,
  getEstadoRechazadoId,
  getVotosReparado,
  verificarVotoReparadoUsuario,
  votarReparado,
  getEstadoReparadoId,
  actualizarEstadoReporte,
  eliminarReporte,
  getComentariosReporte,
  crearComentario,
  eliminarComentario,
  getHistorialEstados,
  getUserEmail,
  type Comentario,
} from "@/database/queries/reportes/[id]/index";
import { 
  verificarEsAdmin, 
  getEstados, 
  cambiarEstadoReporteAdmin,
  eliminarReporteAdmin,
  eliminarComentarioAdmin,
  type Estado
} from "@/database/queries/admin/index";
import { getStatusVariant, getPriorityVariant, getPriorityIcon, getStatusIcon, getCategoryIcon } from "@/components/report-card";
import { PUNTOS } from "@/database/queries/puntos";
import { getUserUsername } from "@/database/queries/profiles";

dayjs.extend(utc);
dayjs.extend(timezone);

// Importar el MiniMap de forma dinámica solo en el cliente para evitar errores de SSR con Leaflet
const MiniMap = dynamic(() => import("@/components/mini-map").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
      <LoadingLogo size="sm" />
    </div>
  ),
});

type Reporte = {
  id: number;
  titulo: string;
  descripcion: string;
  lat: number;
  lon: number;
  created_at: string;
  usuario_id: string;
  estado_id: number;
  categorias: any;
  prioridades: any;
  estados: any;
  fotos_reporte: any[];
  profiles: any;
};

const getNombre = (obj: any): string => {
  if (!obj) return "N/A";
  if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A";
  if (obj.nombre) return obj.nombre;
  return "N/A";
};

const getUsername = (obj: any): string => {
  if (!obj) return "Usuario";
  if (Array.isArray(obj) && obj.length > 0) return obj[0].username || "Usuario";
  if (obj.username) return obj.username;
  return "Usuario";
};

const getUserInitials = (username: string) => {
  if (!username || username === "Usuario") return "US";
  return username.substring(0, 2).toUpperCase();
};

/**
 * Página que muestra el detalle completo de un reporte: estado, prioridad, ubicación, descripción, imágenes, comentarios y controles de interacción.
 *
 * @param params - Objeto con la propiedad `id` (cadena) del reporte a mostrar; se recibe como Promise y se resuelve internamente.
 * @returns El elemento JSX que representa la página de detalle del reporte con sus interacciones (votos, comentarios y controles administrativos).
 */
export default function ReporteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [votosCount, setVotosCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votosReparadoCount, setVotosReparadoCount] = useState(0);
  const [hasVotedReparado, setHasVotedReparado] = useState(false);
  const [isVotingReparado, setIsVotingReparado] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [fechaCambioEstado, setFechaCambioEstado] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [comentarioEstado, setComentarioEstado] = useState("");
  const [isChangingEstado, setIsChangingEstado] = useState(false);
  
  // Estados para controlar los AlertDialogs
  const [showDeleteReporteDialog, setShowDeleteReporteDialog] = useState(false);
  const [showVoteNoExisteDialog, setShowVoteNoExisteDialog] = useState(false);
  const [showVoteReparadoDialog, setShowVoteReparadoDialog] = useState(false);
  const [showPublishCommentDialog, setShowPublishCommentDialog] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [comentarioToDelete, setComentarioToDelete] = useState<number | null>(null);
  
  // Estados para controlar los AlertDialogs de Admin
  const [showAdminChangeEstadoDialog, setShowAdminChangeEstadoDialog] = useState(false);
  const [showAdminDeleteReporteDialog, setShowAdminDeleteReporteDialog] = useState(false);
  const [showAdminDeleteCommentDialog, setShowAdminDeleteCommentDialog] = useState(false);
  const [adminComentarioToDelete, setAdminComentarioToDelete] = useState<number | null>(null);
  
  const supabase = createClient();

  // IDs de estados según la base de datos: 1 = Pendiente, 2 = Reparado, 3 = Rechazado
  const ESTADO_REPARADO = 2;
  const ESTADO_RECHAZADO = 3;

  // Verificar si el reporte está cerrado (Reparado o Rechazado) usando IDs
  const isReporteCerrado = reporte && (
    reporte.estado_id === ESTADO_REPARADO || 
    reporte.estado_id === ESTADO_RECHAZADO
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Verificar si el usuario es admin
        if (user) {
          const { isAdmin: adminStatus } = await verificarEsAdmin(supabase, user.id);
          setIsAdmin(adminStatus);

          // Si es admin, cargar los estados disponibles
          if (adminStatus) {
            const { data: estadosData } = await getEstados(supabase);
            setEstados(estadosData);
          }
        }

        // Obtener reporte
        const { data, error } = await getReporteDetalle(supabase, resolvedParams.id);

        if (!error && data) {
          setReporte(data);

          // Contar votos "no existe"
          const { count } = await getVotosNoExiste(supabase, resolvedParams.id);
          setVotosCount(count);

          // Contar votos "reparado"
          const { count: countReparado } = await getVotosReparado(supabase, resolvedParams.id);
          setVotosReparadoCount(countReparado);

          // Verificar si el usuario actual ya votó
          if (user) {
            const { hasVoted } = await verificarVotoUsuario(
              supabase,
              resolvedParams.id,
              user.id
            );
            setHasVoted(hasVoted);

            const { hasVoted: hasVotedRep } = await verificarVotoReparadoUsuario(
              supabase,
              resolvedParams.id,
              user.id
            );
            setHasVotedReparado(hasVotedRep);
          }
        }

        // Obtener comentarios
        const { data: comentariosData } = await getComentariosReporte(
          supabase,
          resolvedParams.id
        );
        setComentarios(comentariosData);

        // Obtener historial de estados para encontrar cuándo cambió a Reparado (2) o Rechazado (3)
        if (data && (data.estado_id === ESTADO_REPARADO || data.estado_id === ESTADO_RECHAZADO)) {
          const { data: historial } = await getHistorialEstados(
            supabase,
            resolvedParams.id
          );
          
          // Buscar el registro donde cambió a Reparado (2) o Rechazado (3) usando IDs
          const cambio = historial?.find((h: any) => {
            return h.estado_nuevo_id === ESTADO_REPARADO || h.estado_nuevo_id === ESTADO_RECHAZADO;
          });
          
          if (cambio) {
            setFechaCambioEstado(cambio.created_at);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleVoteNoExiste = async () => {
    if (!currentUser || !reporte) return;
    setShowVoteNoExisteDialog(true);
  };

  const confirmVoteNoExiste = async () => {
    if (!currentUser || !reporte) return;

    setIsVoting(true);
    try {
      // Insertar voto
      const { success, error } = await votarNoExiste(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success || error) {
        toast.error("Error al registrar el voto");
        return;
      }

      // Actualizar contador local
      const newVotosCount = votosCount + 1;
      setVotosCount(newVotosCount);
      setHasVoted(true);

      // Mostrar mensaje de puntos ganados
      toast.success(`¡Voto registrado! +${PUNTOS.VOTAR_NO_EXISTE} punto`, {
        description: "Tu voto ha sido contabilizado correctamente"
      });

      // Si llega a 5 votos, cambiar estado a Rechazado
      if (newVotosCount >= 5 ) {
        const { estadoId } = await getEstadoRechazadoId(supabase);

        if (estadoId) {
          // Obtener el estado actual del reporte (usar estado_id directamente)
          const estadoAnteriorId = reporte.estado_id;
          
          await actualizarEstadoReporte(
            supabase, 
            reporte.id, 
            estadoId, 
            estadoAnteriorId,
            currentUser.id,
            "Rechazado automáticamente por 5 votos de 'No Existe'"
          );
          // Recargar página para mostrar el nuevo estado
          toast.success("¡Reporte rechazado automáticamente!", {
            description: "Se alcanzaron 5 votos. Redirigiendo..."
          });
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el voto", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setIsVoting(false);
      setShowVoteNoExisteDialog(false);
    }
  };

  const handleVoteReparado = async () => {
    if (!currentUser || !reporte) return;
    setShowVoteReparadoDialog(true);
  };

  const confirmVoteReparado = async () => {
    if (!currentUser || !reporte) return;

    setIsVotingReparado(true);
    try {
      // Insertar voto
      const { success, error } = await votarReparado(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success || error) {
        toast.error("Error al registrar el voto");
        return;
      }

      // Actualizar contador local
      const newVotosReparadoCount = votosReparadoCount + 1;
      setVotosReparadoCount(newVotosReparadoCount);
      setHasVotedReparado(true);

      // Mostrar mensaje de puntos ganados
      toast.success(`¡Voto registrado! +${PUNTOS.VOTAR_REPARADO} punto`, {
        description: "Gracias por mantener la información actualizada"
      });

      // Si llega a 5 votos, cambiar estado a Reparado
      if (newVotosReparadoCount >= 5) {
        const { estadoId } = await getEstadoReparadoId(supabase);

        if (estadoId) {
          // Obtener el estado actual del reporte (usar estado_id directamente)
          const estadoAnteriorId = reporte.estado_id;
          
          await actualizarEstadoReporte(
            supabase, 
            reporte.id, 
            estadoId,
            estadoAnteriorId,
            currentUser.id,
            "Marcado como reparado por 5 votos de usuarios"
          );
          // Recargar página para mostrar el nuevo estado
          toast.success("¡Reporte marcado como reparado!", {
            description: "Se alcanzaron 5 votos. Redirigiendo..."
          });
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el voto", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setIsVotingReparado(false);
      setShowVoteReparadoDialog(false);
    }
  };

  const handleDeleteReporte = async () => {
    if (!currentUser || !reporte) return;
    setShowDeleteReporteDialog(true);
  };

  const confirmDeleteReporte = async () => {
    if (!currentUser || !reporte) return;

    setIsDeleting(true);
    try {
      const { success } = await eliminarReporte(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success) {
        toast.error("Error al eliminar el reporte", {
          description: "Por favor, intenta nuevamente."
        });
        return;
      }

      toast.success(`Reporte eliminado exitosamente`, {
        description: `${PUNTOS.ELIMINAR_REPORTE_PROPIO} puntos. Redirigiendo al dashboard...`
      });
      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la eliminación", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteReporteDialog(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !reporte || !nuevoComentario.trim()) return;

    setShowPublishCommentDialog(true);
  };

  const confirmPublishComment = async () => {
    if (!currentUser || !reporte || !nuevoComentario.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await crearComentario(
        supabase,
        reporte.id,
        currentUser.id,
        nuevoComentario.trim()
      );

      if (error || !data) {
        toast.error("Error al publicar el comentario", {
          description: "Por favor, intenta nuevamente"
        });
        return;
      }

      setComentarios([...comentarios, data]);
      setNuevoComentario("");
      
      // Mostrar mensaje de puntos ganados
      toast.success(`¡Comentario publicado! +${PUNTOS.COMENTAR_REPORTE} puntos`, {
        description: "Tu comentario ha sido agregado correctamente"
      });

      // Enviar notificación por correo al dueño del reporte (solo si no es el mismo usuario)
      if (currentUser.id !== reporte.usuario_id) {
        try {
          // Obtener el email del dueño del reporte usando la query directa
          const { data: ownerEmail } = await getUserEmail(
            supabase,
            reporte.usuario_id
          );

          if (ownerEmail) {
            // Obtener el username del comentarista usando la función de queries
            const { data: commenterUsername } = await getUserUsername(
              supabase,
              currentUser.id
            );

            // Enviar la notificación
            await fetch("/api/send-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ownerEmail: ownerEmail,
                ownerUsername: getUsername(reporte.profiles),
                commenterUsername: commenterUsername || "Un usuario",
                reporteId: reporte.id,
                reporteTitulo: reporte.titulo,
                comentarioContenido: nuevoComentario.trim(),
              }),
            });
          }
        } catch (notifError) {
          // No fallar si la notificación no se envía, solo loguearlo
          console.error("Error al enviar notificación por correo:", notifError);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el comentario", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setIsSubmittingComment(false);
      setShowPublishCommentDialog(false);
    }
  };

  const handleDeleteComment = async (comentarioId: number) => {
    if (!currentUser) return;
    setComentarioToDelete(comentarioId);
    setShowDeleteCommentDialog(true);
  };

  const confirmDeleteComment = async () => {
    if (!currentUser || comentarioToDelete === null) return;

    try {
      const { success } = await eliminarComentario(
        supabase,
        comentarioToDelete,
        currentUser.id
      );

      if (!success) {
        toast.error("Error al eliminar el comentario", {
          description: "Por favor, intenta nuevamente"
        });
        return;
      }

      // Actualizar lista de comentarios (filtrar el eliminado)
      setComentarios(comentarios.filter((c) => c.id !== comentarioToDelete));
      toast.success("Comentario eliminado", {
        description: "El comentario ha sido eliminado correctamente"
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la eliminación", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setComentarioToDelete(null);
      setShowDeleteCommentDialog(false);
    }
  };

  // ===== FUNCIONES DE ADMINISTRADOR =====
  const handleAdminChangeEstado = async () => {
    if (!currentUser || !reporte || !estadoSeleccionado) return;
    setShowAdminChangeEstadoDialog(true);
  };

  const confirmAdminChangeEstado = async () => {
    if (!currentUser || !reporte || !estadoSeleccionado) return;

    setIsChangingEstado(true);
    try {
      const { success, error } = await cambiarEstadoReporteAdmin(
        supabase,
        reporte.id,
        parseInt(estadoSeleccionado),
        currentUser.id,
        comentarioEstado.trim() || undefined
      );

      if (!success || error) {
        toast.error("Error al cambiar el estado del reporte", {
          description: "Por favor, intenta nuevamente"
        });
        return;
      }

      toast.success("Estado actualizado exitosamente", {
        description: "El cambio ha sido registrado en el historial"
      });
      // Recargar la página para mostrar los cambios
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el cambio de estado", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setIsChangingEstado(false);
      setShowAdminChangeEstadoDialog(false);
    }
  };

  const handleAdminDeleteReporte = async () => {
    if (!currentUser || !reporte) return;
    setShowAdminDeleteReporteDialog(true);
  };

  const confirmAdminDeleteReporte = async () => {
    if (!currentUser || !reporte) return;

    try {
      const { success } = await eliminarReporteAdmin(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success) {
        toast.error("Error al eliminar el reporte", {
          description: "Por favor, intenta nuevamente"
        });
        return;
      }

      toast.success("Reporte eliminado exitosamente", {
        description: "Redirigiendo..."
      });
      // Redirigir al dashboard
      setTimeout(() => window.location.href = "/reportes", 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la eliminación", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setShowAdminDeleteReporteDialog(false);
    }
  };

  const handleAdminDeleteComment = async (comentarioId: number) => {
    if (!currentUser) return;
    setAdminComentarioToDelete(comentarioId);
    setShowAdminDeleteCommentDialog(true);
  };

  const confirmAdminDeleteComment = async () => {
    if (!currentUser || adminComentarioToDelete === null) return;

    try {
      const { success } = await eliminarComentarioAdmin(
        supabase,
        adminComentarioToDelete,
        currentUser.id
      );

      if (!success) {
        toast.error("Error al eliminar el comentario", {
          description: "Por favor, intenta nuevamente"
        });
        return;
      }

      // Actualizar lista de comentarios (filtrar el eliminado)
      setComentarios(comentarios.filter((c) => c.id !== adminComentarioToDelete));
      toast.success("Comentario eliminado por el administrador", {
        description: "El comentario ha sido eliminado correctamente"
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la eliminación", {
        description: "Por favor, intenta nuevamente"
      });
    } finally {
      setAdminComentarioToDelete(null);
      setShowAdminDeleteCommentDialog(false);
    }
  };

  const getComentarioUsername = (profiles: any): string => {
    if (!profiles) return "Usuario";
    if (Array.isArray(profiles) && profiles.length > 0)
      return profiles[0].username || "Usuario";
    if (profiles.username) return profiles.username;
    return "Usuario";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingLogo size="lg" text="Cargando reporte..." />
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Reporte no encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/reportes">Volver a Reportes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Acciones de la página */}
      <div className="container mx-auto px-3 md:px-4 lg:px-6 pt-3 md:pt-6 lg:pt-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Volver</span>
            </Link>
          </Button>
          
          {/* Badge de Admin y Botones de acción rápida en desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {isAdmin && (
              <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white">
                <Shield className="w-3 h-3 mr-1" />
                Administrador
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-8 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Encabezado del Reporte */}
            <Card className="lg:shadow-md">
              <CardHeader className="pb-3 md:pb-6 lg:pb-8">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 lg:space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                      <Badge
                        variant={getPriorityVariant(getNombre(reporte.prioridades))}
                        className="text-xs lg:text-sm flex items-center gap-1"
                      >
                        {getPriorityIcon(getNombre(reporte.prioridades), "w-3 h-3 lg:w-3.5 lg:h-3.5")}
                        {getNombre(reporte.prioridades)}
                      </Badge>
                      <Badge
                        variant={getStatusVariant(getNombre(reporte.estados))}
                        className="text-xs lg:text-sm flex items-center gap-1"
                      >
                        {getStatusIcon(getNombre(reporte.estados), "w-3 h-3 lg:w-3.5 lg:h-3.5")}
                        {getNombre(reporte.estados)}
                      </Badge>
                      <Badge variant="blue" className="text-xs lg:text-sm flex items-center gap-1">
                        {getCategoryIcon(getNombre(reporte.categorias), "w-3 h-3 lg:w-3.5 lg:h-3.5")}
                        {getNombre(reporte.categorias)}
                      </Badge>
                    </div>
                    {/* Mostrar fecha de cambio si está Reparado o Rechazado */}
                    {fechaCambioEstado && isReporteCerrado && (
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs md:text-sm font-medium ${
                        getNombre(reporte.estados).toLowerCase() === 'reparado'
                          ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                          : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                      }`}>
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span>
                          {getNombre(reporte.estados)} el{" "}
                          {dayjs
                            .utc(fechaCambioEstado)
                            .tz("America/Argentina/Buenos_Aires")
                            .format("DD/MM/YYYY [a las] HH:mm")}
                        </span>
                      </div>
                    )}
                    <CardTitle className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">{reporte.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 md:gap-2 text-xs lg:text-sm">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">
                        Lat: {reporte.lat.toFixed(4)}, Lon:{" "}
                        {reporte.lon.toFixed(4)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                    {/* Botón compartir en mobile */}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 md:h-9 md:w-9 lg:hidden">
                      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                    
                    {/* Botón eliminar - solo para el creador */}
                    {currentUser && currentUser.id === reporte.usuario_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 md:h-9 md:px-3 lg:h-10 lg:px-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={handleDeleteReporte}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 lg:mr-2" />
                        <span className="hidden lg:inline text-xs lg:text-sm font-medium">
                          {isDeleting ? "Eliminando..." : "Eliminar"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 lg:px-8 lg:pb-8">
                <p className="text-sm md:text-base lg:text-lg text-foreground leading-relaxed lg:leading-loose mb-4 md:mb-6 lg:mb-8">
                  {reporte.descripcion}
                </p>

                {/* Imágenes */}
                {reporte.fotos_reporte && reporte.fotos_reporte.length > 0 && (
                  <div className="flex justify-center mb-4 md:mb-6 lg:mb-8">
                    {reporte.fotos_reporte.map((foto, index) => (
                      <div
                        key={index}
                        className="w-full max-w-2xl aspect-video bg-muted rounded-md md:rounded-lg lg:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
                      >
                        <img
                          src={foto.url || "/placeholder.svg"}
                          alt={`Imagen ${index + 1} del reporte`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Autor y Fecha */}
                <div className="flex items-center justify-between text-xs md:text-sm lg:text-base text-muted-foreground flex-wrap gap-2 pt-4 lg:pt-6 border-t">
                  <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
                    <Avatar className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8">
                      <AvatarFallback className="text-[10px] md:text-xs lg:text-sm">
                        {getUserInitials(getUsername(reporte.profiles))}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">Reportado por {getUsername(reporte.profiles)}</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-1.5">
                    <Calendar className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {new Date(reporte.created_at).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección de Comentarios */}
            <Card className="lg:shadow-md">
              <CardHeader className="pb-3 md:pb-6 lg:pb-8 lg:px-8 lg:pt-8">
                <CardTitle className="text-base md:text-xl lg:text-2xl flex items-center gap-2 lg:gap-3">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span>Actualizaciones y Comentarios</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base">
                  {isReporteCerrado 
                    ? "Este reporte está cerrado. Solo se muestran comentarios anteriores."
                    : "Compartí actualizaciones sobre el estado de este reporte"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 lg:space-y-8 pt-0 lg:px-8 lg:pb-8">
                {/* Formulario para nuevo comentario - Solo si NO está cerrado */}
                {!isReporteCerrado && (
                  <form onSubmit={handleSubmitComment} className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Textarea
                      placeholder="Ej: 'Llamé a la municipalidad', 'Vi personal trabajando en el lugar', etc."
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      className="min-h-[80px] md:min-h-[100px] lg:min-h-[120px] resize-none text-sm lg:text-base"
                      disabled={isSubmittingComment}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        className="lg:h-10 lg:px-6"
                        disabled={!nuevoComentario.trim() || isSubmittingComment}
                      >
                        <Send className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        <span className="text-xs md:text-sm lg:text-base">
                          {isSubmittingComment
                            ? "Publicando..."
                            : "Publicar"}
                        </span>
                      </Button>
                    </div>
                  </form>
                )}

                {/* Lista de comentarios */}
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {comentarios.length === 0 ? (
                    <div className="text-center py-6 md:py-8 lg:py-12 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 mx-auto mb-2 md:mb-3 lg:mb-4 opacity-50" />
                      <p className="text-xs md:text-sm lg:text-base">Aún no hay comentarios</p>
                      <p className="text-[10px] md:text-xs lg:text-sm">Sé el primero en comentar</p>
                    </div>
                  ) : (
                    comentarios.map((comentario) => (
                      <div
                        key={comentario.id}
                        className="border rounded-md md:rounded-lg lg:rounded-xl p-3 md:p-4 lg:p-6 space-y-2 md:space-y-3 lg:space-y-4 hover:bg-muted/50 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-3 lg:gap-4">
                          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
                            <Avatar className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0">
                              <AvatarFallback className="text-[10px] md:text-xs lg:text-sm">
                                {getUserInitials(
                                  getComentarioUsername(comentario.profiles)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs md:text-sm lg:text-base truncate">
                                {getComentarioUsername(comentario.profiles)}
                              </p>
                              <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                                <span>
                                  {dayjs
                                    .utc(comentario.created_at)
                                    .tz("America/Argentina/Buenos_Aires")
                                    .format("DD/MM/YYYY HH:mm")}
                                </span>
                              </p>
                            </div>
                          </div>
                          {(currentUser &&
                            currentUser.id === comentario.usuario_id) || isAdmin ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  isAdmin && currentUser.id !== comentario.usuario_id
                                    ? handleAdminDeleteComment(comentario.id)
                                    : handleDeleteComment(comentario.id)
                                }
                                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title={
                                  isAdmin && currentUser.id !== comentario.usuario_id
                                    ? "Eliminar comentario (Admin)"
                                    : "Eliminar comentario"
                                }
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" />
                              </Button>
                            ) : null}
                        </div>
                        <p className="text-xs md:text-sm lg:text-base text-foreground leading-relaxed pl-9 md:pl-11 lg:pl-14">
                          {comentario.contenido}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra Lateral */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            
            {/* Panel de Administrador - Solo visible para admins */}
            {isAdmin && (
              <Card className="border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 lg:shadow-md">
                <CardHeader className="pb-3 md:pb-4 lg:pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-base md:text-lg lg:text-xl text-purple-700 dark:text-purple-400">
                      Panel de Administrador
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs md:text-sm">
                    Controles exclusivos para gestionar este reporte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* Cambiar Estado */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-foreground">
                      Cambiar Estado
                    </label>
                    <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
                      <SelectTrigger className="w-full text-xs md:text-sm">
                        <SelectValue placeholder="Seleccionar estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem key={estado.id} value={estado.id.toString()}>
                            {estado.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Descripción del cambio (opcional)"
                      value={comentarioEstado}
                      onChange={(e) => setComentarioEstado(e.target.value)}
                      className="min-h-[60px] text-xs md:text-sm resize-none"
                    />
                    <Button
                      onClick={handleAdminChangeEstado}
                      disabled={!estadoSeleccionado || isChangingEstado}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm"
                      size="sm"
                    >
                      <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      {isChangingEstado ? "Actualizando..." : "Actualizar Estado"}
                    </Button>
                  </div>

                  {/* Eliminar Reporte */}
                  <div className="pt-3 border-t border-purple-200 dark:border-purple-900">
                    <Button
                      onClick={handleAdminDeleteReporte}
                      variant="outline"
                      className="w-full text-xs md:text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Eliminar Reporte (Admin)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Botón "Marcar como Reparado" - Solo si está PENDIENTE */}
            {currentUser && !isReporteCerrado && (
              <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20 lg:shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 lg:p-6">
                  <div className="text-center space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 className="w-6 h-6 lg:w-7 lg:h-7 text-green-600 dark:text-green-500" />
                        <h3 className="font-semibold text-base md:text-lg lg:text-xl text-green-700 dark:text-green-500">
                          ¿Ya está reparado?
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        Si verificaste que este problema ya fue solucionado, marcalo como reparado.
                      </p>
                      <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                        Ayudá a mantener la información actualizada para todos.
                      </p>
                      <div className="bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-md p-2 mt-2">
                        <p className="text-[10px] md:text-xs lg:text-sm text-green-700 dark:text-green-400 font-medium">
                          ✓ Con 5 votos, el reporte se marcará como reparado
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={hasVotedReparado ? "secondary" : "default"}
                      size="sm"
                      className={`w-full h-9 md:h-10 lg:h-11 ${
                        hasVotedReparado 
                          ? "bg-gray-500 hover:bg-gray-600" 
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      onClick={handleVoteReparado}
                      disabled={hasVotedReparado || isVotingReparado}
                    >
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                      <span className="text-xs md:text-sm lg:text-base font-medium">
                        {hasVotedReparado ? "✓ Ya votaste" : "Votar como Reparado"}
                      </span>
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm lg:text-base flex-wrap">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-950/40 rounded-md border border-green-200 dark:border-green-900">
                        <span className="font-bold text-green-700 dark:text-green-400">
                          {votosReparadoCount} / 5
                        </span>
                        <span className="text-green-600 dark:text-green-500">votos</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Faltan <span className="font-semibold text-green-600 dark:text-green-500">{5 - votosReparadoCount}</span> para marcar como reparado
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Botón "No Existe" - Solo si está PENDIENTE y no es el creador */}
            {currentUser && currentUser.id !== reporte.usuario_id && !isReporteCerrado && (
              <Card className="border-2 border-red-500/30 bg-red-50/50 dark:bg-red-950/20 lg:shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 lg:p-6">
                  <div className="text-center space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ThumbsDown className="w-6 h-6 lg:w-7 lg:h-7 text-red-600 dark:text-red-500" />
                        <h3 className="font-semibold text-base md:text-lg lg:text-xl text-red-700 dark:text-red-500">
                          ¿Este reporte no existe?
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        Si verificaste que este problema <span className="font-semibold text-red-600 dark:text-red-500">nunca existió</span> o fue reportado por error, marcalo.
                      </p>
                      <div className="bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md p-2 mt-2">
                        <p className="text-[10px] md:text-xs lg:text-sm text-red-700 dark:text-red-400 font-medium">
                          ⚠️ Con 5 votos, el reporte será rechazado permanentemente
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={hasVoted ? "secondary" : "default"}
                      size="sm"
                      className={`w-full h-9 md:h-10 lg:h-11 ${
                        hasVoted 
                          ? "bg-gray-500 hover:bg-gray-600" 
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                      onClick={handleVoteNoExiste}
                      disabled={hasVoted || isVoting}
                    >
                      <ThumbsDown className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                      <span className="text-xs md:text-sm lg:text-base font-medium">
                        {hasVoted ? "✓ Ya votaste" : "Votar: No Existe"}
                      </span>
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm lg:text-base flex-wrap">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-950/40 rounded-md border border-red-200 dark:border-red-900">
                        <span className="font-bold text-red-700 dark:text-red-400">
                          {votosCount} / 5
                        </span>
                        <span className="text-red-600 dark:text-red-500">votos</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Faltan <span className="font-semibold text-red-600 dark:text-red-500">{5 - votosCount}</span> para rechazar
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marcador de Posición del Mapa */}
            <Card className="lg:shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 md:pb-6 lg:pb-4">
                <CardTitle className="text-base md:text-lg lg:text-xl">Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 lg:px-6 lg:pb-6">
                <Link href="/mapa" className="block group">
                  <div className="relative aspect-square rounded-md md:rounded-lg lg:rounded-xl overflow-hidden border-2 shadow-sm group-hover:shadow-md transition-all">
                    <MiniMap lat={reporte.lat} lon={reporte.lon} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 md:bottom-3 lg:bottom-4 left-2 md:left-3 lg:left-4 right-2 md:right-3 lg:right-4 bg-background/95 backdrop-blur-sm border rounded-md lg:rounded-lg shadow-lg p-2 lg:p-3">
                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs lg:text-sm text-foreground">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Ver en mapa completo</p>
                          <p className="text-muted-foreground truncate text-[9px] lg:text-xs">
                            Lat {reporte.lat.toFixed(4)}, Lon {reporte.lon.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AlertDialog - Eliminar Reporte */}
      <AlertDialog open={showDeleteReporteDialog} onOpenChange={setShowDeleteReporteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este reporte?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por eliminar permanentemente este reporte:</p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{reporte?.descripcion}</p>
                </div>
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Esta acción no se puede deshacer
                </p>
                <p className="text-xs text-muted-foreground">
                  Perderás <span className="font-bold text-destructive">{PUNTOS.ELIMINAR_REPORTE_PROPIO} puntos</span> al eliminar este reporte.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReporte}
              disabled={isDeleting}
              className="bg-destructive text-accent-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Reporte
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Votar No Existe */}
      <AlertDialog open={showVoteNoExisteDialog} onOpenChange={setShowVoteNoExisteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar voto "No Existe"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por votar que este reporte NO existe o fue reportado por error:</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold text-foreground mb-1">{reporte?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Votantes actuales: {votosCount} / 5
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    ⚠️ Con 5 votos, el reporte será <span className="font-bold">rechazado automáticamente</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ganarás <span className="font-bold text-primary">{PUNTOS.VOTAR_NO_EXISTE} punto</span> por votar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoteNoExiste}
              disabled={isVoting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isVoting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Votando...
                </>
              ) : (
                <>
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Confirmar Voto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Votar Reparado */}
      <AlertDialog open={showVoteReparadoDialog} onOpenChange={setShowVoteReparadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar que está reparado?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por confirmar que este problema ya fue solucionado:</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold text-foreground mb-1">{reporte?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Votantes actuales: {votosReparadoCount} / 5
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✓ Con 5 votos, el reporte se marcará como <span className="font-bold">Reparado</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ganarás <span className="font-bold text-primary">{PUNTOS.VOTAR_REPARADO} punto</span> por votar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVotingReparado}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoteReparado}
              disabled={isVotingReparado}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isVotingReparado ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Votando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Voto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Publicar Comentario */}
      <AlertDialog open={showPublishCommentDialog} onOpenChange={setShowPublishCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar comentario?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por publicar el siguiente comentario:</p>
                <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{nuevoComentario}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ganarás <span className="font-bold text-primary">{PUNTOS.COMENTAR_REPORTE} puntos</span> por comentar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingComment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublishComment} disabled={isSubmittingComment}>
              {isSubmittingComment ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publicar Comentario
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Eliminar Comentario */}
      <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por eliminar este comentario:</p>
                <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comentarios.find(c => c.id === comentarioToDelete)?.contenido}
                  </p>
                </div>
                <p className="text-sm text-destructive">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Admin: Cambiar Estado */}
      <AlertDialog open={showAdminChangeEstadoDialog} onOpenChange={setShowAdminChangeEstadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              ¿Cambiar estado del reporte?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por cambiar el estado de este reporte como administrador:</p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Estado actual:</span>
                    <Badge variant={getStatusVariant(getNombre(reporte?.estados))}>
                      {getNombre(reporte?.estados)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Nuevo estado:</span>
                    <Badge variant="default">
                      {estados.find(e => e.id.toString() === estadoSeleccionado)?.nombre || "N/A"}
                    </Badge>
                  </div>
                  {comentarioEstado.trim() && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Descripción:</p>
                      <p className="text-sm text-foreground">{comentarioEstado}</p>
                    </div>
                  )}
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-md p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    ℹ️ Esta acción quedará registrada en el historial del reporte
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingEstado}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAdminChangeEstado}
              disabled={isChangingEstado}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isChangingEstado ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Confirmar Cambio
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Admin: Eliminar Reporte */}
      <AlertDialog open={showAdminDeleteReporteDialog} onOpenChange={setShowAdminDeleteReporteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              ¿Eliminar reporte como administrador?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por eliminar permanentemente este reporte como administrador:</p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{reporte?.descripcion}</p>
                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Estado actual:</span>
                    <Badge variant={getStatusVariant(getNombre(reporte?.estados))}>
                      {getNombre(reporte?.estados)}
                    </Badge>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    ⚠️ Esta acción no se puede deshacer
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                    El reporte y todos sus comentarios serán eliminados permanentemente
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAdminDeleteReporte}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Reporte (Admin)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Admin: Eliminar Comentario */}
      <AlertDialog open={showAdminDeleteCommentDialog} onOpenChange={setShowAdminDeleteCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              ¿Eliminar comentario como administrador?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás por eliminar este comentario como administrador:</p>
                <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comentarios.find(c => c.id === adminComentarioToDelete)?.contenido}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <span>Autor:</span>
                    <span className="font-medium">
                      {getComentarioUsername(comentarios.find(c => c.id === adminComentarioToDelete)?.profiles)}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    ⚠️ Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAdminDeleteComment}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar (Admin)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}