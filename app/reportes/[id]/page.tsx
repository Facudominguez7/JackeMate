"use client";

import { use, useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Trash2,
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
import { LoadingState } from "@/components/loading-state";
import { toast } from "sonner";
import {
  getReporteDetalle,
  getComentariosReporte,
  getHistorialEstados,
  type Comentario,
  type ReporteDetalle,
} from "@/database/queries/reportes/[id]/index";
import {
  verificarEsAdmin,
  getEstados,
  type Estado
} from "@/database/queries/admin/index";
import { getStatusVariant, getPriorityVariant, getPriorityIcon, getStatusIcon, getCategoryIcon } from "@/components/report-card";
import { PUNTOS } from "@/database/queries/puntos";
import { REPORT_STATE_IDS } from "@/lib/authz/catalog";
import { getNameFromRelation, getUserInitials, getUsernameFromRelation } from "@/lib/identity/display";
import { CommentsSection } from "@/components/report-detail/comments-section";
import {
  cambiarEstadoAdminAction,
  crearComentarioAction,
  eliminarComentarioAdminAction,
  eliminarComentarioPropioAction,
  eliminarReporteAdminAction,
  eliminarReportePropioAction,
  votarNoExisteAction,
  votarReparadoAction,
} from "./actions";

dayjs.extend(utc);
dayjs.extend(timezone);

// Importar el MiniMap de forma dinámica solo en el cliente para evitar errores de SSR con Leaflet
const MiniMap = dynamic(() => import("@/components/mini-map").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
      <LoadingState text="Cargando mapa..." />
    </div>
  ),
});

type HistorialEstadoItem = {
  created_at: string;
  estado_nuevo_id: number | null;
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
  const [reporte, setReporte] = useState<ReporteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [votosCount, setVotosCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votosReparadoCount, setVotosReparadoCount] = useState(0);
  const [hasVotedReparado, setHasVotedReparado] = useState(false);
  const [isVotingReparado, setIsVotingReparado] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
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

  // Estados para controlar los AlertDialogs de Admin
  const [showAdminChangeEstadoDialog, setShowAdminChangeEstadoDialog] = useState(false);
  const [showAdminDeleteReporteDialog, setShowAdminDeleteReporteDialog] = useState(false);
  const [showAdminPanelDialog, setShowAdminPanelDialog] = useState(false);

  const supabase = createClient();

  // IDs de estados según la base de datos: 1 = Pendiente, 2 = Reparado, 3 = Rechazado
  // Verificar si el reporte está cerrado (Reparado o Rechazado) usando IDs
  const isReporteCerrado = reporte && (
    reporte.estado_id === REPORT_STATE_IDS.REPARADO ||
    reporte.estado_id === REPORT_STATE_IDS.RECHAZADO
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
        const { data, error } = await getReporteDetalle(supabase, resolvedParams.id, user?.id);

        if (!error && data) {
          setReporte(data);
          setVotosCount(data.votos.noExiste.count);
          setVotosReparadoCount(data.votos.reparado.count);
          setHasVoted(data.votos.noExiste.hasVoted);
          setHasVotedReparado(data.votos.reparado.hasVoted);
        }

        // Obtener comentarios
        const { data: comentariosData } = await getComentariosReporte(
          supabase,
          resolvedParams.id
        );
        setComentarios(comentariosData);

        // Obtener historial de estados para encontrar cuándo cambió a Reparado (2) o Rechazado (3)
        if (data && (data.estado_id === REPORT_STATE_IDS.REPARADO || data.estado_id === REPORT_STATE_IDS.RECHAZADO)) {
          const { data: historial } = await getHistorialEstados(
            supabase,
            resolvedParams.id
          );

          // Buscar el registro donde cambió a Reparado (2) o Rechazado (3) usando IDs
          const cambio = historial?.find((h: HistorialEstadoItem) => {
            return h.estado_nuevo_id === REPORT_STATE_IDS.REPARADO || h.estado_nuevo_id === REPORT_STATE_IDS.RECHAZADO;
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
      const result = await votarNoExisteAction(reporte.id);

      if (!result.success) {
        toast.error(result.error || "Error al registrar el voto");
        return;
      }

      const newVotosCount = result.data.count;
      setVotosCount(newVotosCount);
      setHasVoted(true);

      // Mostrar mensaje de puntos ganados
      toast.success(`¡Voto registrado! +${PUNTOS.VOTAR_NO_EXISTE} punto`, {
        description: "Tu voto ha sido contabilizado correctamente"
      });

      if (result.data.stateChangedTo) {
        toast.success("¡Reporte rechazado automáticamente!", {
          description: "Se alcanzó 1 voto. Redirigiendo..."
        });
        setTimeout(() => window.location.reload(), 1500);
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
      const result = await votarReparadoAction(reporte.id);

      if (!result.success) {
        toast.error(result.error || "Error al registrar el voto");
        return;
      }

      const newVotosReparadoCount = result.data.count;
      setVotosReparadoCount(newVotosReparadoCount);
      setHasVotedReparado(true);

      // Mostrar mensaje de puntos ganados
      toast.success(`¡Voto registrado! +${PUNTOS.VOTAR_REPARADO} punto`, {
        description: "Gracias por mantener la información actualizada"
      });

      if (result.data.stateChangedTo) {
        toast.success("¡Reporte marcado como reparado!", {
          description: "Se alcanzó 1 voto. Redirigiendo..."
        });
        setTimeout(() => window.location.reload(), 1500);
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
      const result = await eliminarReportePropioAction(reporte.id);

      if (!result.success) {
        toast.error("Error al eliminar el reporte", {
          description: result.error || "Por favor, intenta nuevamente."
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

  // ===== FUNCIONES DE ADMINISTRADOR =====
  const handleAdminChangeEstado = async () => {
    if (!currentUser || !reporte || !estadoSeleccionado) return;
    setShowAdminChangeEstadoDialog(true);
  };

  const confirmAdminChangeEstado = async () => {
    if (!currentUser || !reporte || !estadoSeleccionado) return;

    setIsChangingEstado(true);
    try {
      const result = await cambiarEstadoAdminAction(
        reporte.id,
        parseInt(estadoSeleccionado),
        comentarioEstado.trim() || undefined
      );

      if (!result.success) {
        toast.error("Error al cambiar el estado del reporte", {
          description: result.error || "Por favor, intenta nuevamente"
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
      const result = await eliminarReporteAdminAction(reporte.id);

      if (!result.success) {
        toast.error("Error al eliminar el reporte", {
          description: result.error || "Por favor, intenta nuevamente"
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

  if (loading) {
    return (
      <div className="page-shell flex flex-1 items-center justify-center">
        <LoadingState text="Cargando reporte..." />
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
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
    <div className="page-shell">
      <div className="page-container page-stack">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Contenido Principal */}
          <div className="space-y-4 lg:col-span-8">
            {/* Encabezado del Reporte */}
            <Card className="gap-0">
              <CardHeader className="pb-3">
                <div className="flex w-full flex-wrap items-center gap-1.5">
                  <Badge
                    variant={getPriorityVariant(getNameFromRelation(reporte.prioridades))}
                    className="flex items-center gap-1 text-xs"
                  >
                    {getPriorityIcon(getNameFromRelation(reporte.prioridades), "size-3")}
                    {getNameFromRelation(reporte.prioridades)}
                  </Badge>
                  <Badge
                    variant={getStatusVariant(getNameFromRelation(reporte.estados))}
                    className="flex items-center gap-1 text-xs"
                  >
                    {getStatusIcon(getNameFromRelation(reporte.estados), "size-3")}
                    {getNameFromRelation(reporte.estados)}
                  </Badge>
                  <Badge variant="category" className="flex items-center gap-1 text-xs">
                    {getCategoryIcon(getNameFromRelation(reporte.categorias), "size-3")}
                    {getNameFromRelation(reporte.categorias)}
                  </Badge>
                </div>
                <div className="flex min-w-0 items-start gap-3">
                  <CardTitle className="min-w-0 flex-1 break-words text-xl font-bold tracking-tight md:text-2xl">{reporte.titulo}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1.5">
                  {currentUser && !isReporteCerrado && (
                    <>
                      <Button
                        variant={hasVotedReparado ? "secondary" : "default"}
                        size="icon"
                        className="size-8"
                        onClick={handleVoteReparado}
                        disabled={hasVotedReparado || isVotingReparado}
                        aria-label={`${hasVotedReparado ? "Ya votaste que está reparado" : "Votar que está reparado"}. ${votosReparadoCount} votos`}
                        title={`${hasVotedReparado ? "Ya votaste: reparado" : "Votar reparado"} (${votosReparadoCount} / 1)`}
                      >
                        <ThumbsUp className="size-4" />
                      </Button>
                      {currentUser.id !== reporte.usuario_id && (
                        <Button
                          variant={hasVoted ? "secondary" : "destructive"}
                          size="icon"
                          className="size-8"
                          onClick={handleVoteNoExiste}
                          disabled={hasVoted || isVoting}
                          aria-label={`${hasVoted ? "Ya votaste que no existe" : "Votar que no existe"}. ${votosCount} votos`}
                          title={`${hasVoted ? "Ya votaste: no existe" : "Votar no existe"} (${votosCount} / 1)`}
                        >
                          <ThumbsDown className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="border-[var(--semantic-admin)]/40 text-[var(--semantic-admin)] hover:bg-[var(--semantic-admin)]/10 hover:text-[var(--semantic-admin)]"
                      onClick={() => setShowAdminPanelDialog(true)}
                      aria-label="Abrir herramientas de administrador"
                      title="Herramientas de administrador"
                    >
                      <Shield className="size-4" />
                    </Button>
                  )}

                  {currentUser && !isAdmin && currentUser.id === reporte.usuario_id && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={handleDeleteReporte}
                      disabled={isDeleting}
                      aria-label={isDeleting ? "Eliminando reporte" : "Eliminar reporte"}
                      title="Eliminar reporte"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-4 text-sm leading-relaxed text-foreground md:text-base">
                  {reporte.descripcion}
                </p>

                {/* Imágenes */}
                {reporte.fotos_reporte && reporte.fotos_reporte.length > 0 && (
                  <div className="flex justify-center mb-4 md:mb-6 lg:mb-8">
                    {reporte.fotos_reporte.map((foto, index) => (
                      <div
                        key={index}
                        className="flex aspect-video w-full max-w-2xl items-center justify-center overflow-hidden rounded-md bg-[var(--surface-subtle)] md:rounded-lg lg:rounded-xl"
                      >
                        <img
                          src={foto.publicUrl || foto.url || "/placeholder.svg"}
                          alt={`Imagen ${index + 1} del reporte`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Autor y Fecha */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(getUsernameFromRelation(reporte.profiles))}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">Reportado por {getUsernameFromRelation(reporte.profiles)}</span>
                  </div>
                 <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {new Date(reporte.created_at).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                     })}
                   </span>
                 </div>
               </div>
                {fechaCambioEstado && isReporteCerrado && (
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium ${getNameFromRelation(reporte.estados).toLowerCase() === 'reparado'
                    ? 'tone-success-inline'
                    : 'tone-danger-inline'
                  }`}>
                    <Clock className="size-3.5 shrink-0" />
                    <span>
                      {getNameFromRelation(reporte.estados)} el{" "}
                      {dayjs
                        .utc(fechaCambioEstado)
                        .tz("America/Argentina/Buenos_Aires")
                        .format("DD/MM/YYYY [a las] HH:mm")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <CommentsSection
              comments={comentarios}
              currentUser={currentUser}
              reportOwnerId={reporte.usuario_id}
              isAdmin={isAdmin}
              isClosed={Boolean(isReporteCerrado)}
              onSubmitComment={(content) => crearComentarioAction(reporte.id, content)}
              onDeleteComment={async (commentId) => {
                const result = await eliminarComentarioPropioAction(commentId)
                return result.success ? { success: true } : { success: false, error: String(result.error || "") }
              }}
              onAdminDeleteComment={async (commentId) => {
                const result = await eliminarComentarioAdminAction(commentId)
                return result.success ? { success: true } : { success: false, error: String(result.error || "") }
              }}
            />
          </div>

          {/* Barra Lateral */}
          <div className="space-y-4 lg:col-span-4">

            {/* Marcador de Posición del Mapa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/mapa" className="block group">
                  <div className="group relative aspect-square overflow-hidden rounded-md border shadow-sm transition-all group-hover:shadow-md md:rounded-lg">
                    {reporte.lat !== null && reporte.lon !== null ? (
                      <MiniMap lat={reporte.lat} lon={reporte.lon} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
                        Ubicación no disponible
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-x-2 bottom-2 rounded-md border bg-background/95 p-2 shadow-lg backdrop-blur-sm md:inset-x-3 md:bottom-3">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <MapPin className="size-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">Ver en mapa completo</p>
                          {reporte.lat === null || reporte.lon === null ? (
                            <p className="truncate text-xs text-muted-foreground">Ubicación no disponible</p>
                          ) : null}
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

      {isAdmin && (
        <Dialog open={showAdminPanelDialog} onOpenChange={setShowAdminPanelDialog}>
          <DialogContent>
            <DialogHeader className="pr-8">
              <DialogTitle className="flex items-center gap-2 text-[var(--semantic-admin)]">
                <Shield className="size-5" />
                Panel de Administrador
              </DialogTitle>
              <DialogDescription>
                Controles exclusivos para gestionar este reporte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 rounded-xl border border-border p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cambiar Estado</label>
                <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
                  <SelectTrigger className="w-full text-sm">
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
                  className="min-h-[60px] resize-none text-sm"
                />
                <Button
                  onClick={handleAdminChangeEstado}
                  disabled={!estadoSeleccionado || isChangingEstado}
                  className="w-full text-sm"
                  size="sm"
                >
                  <Settings className="size-4" />
                  {isChangingEstado ? "Actualizando..." : "Actualizar Estado"}
                </Button>
              </div>
              <div className="border-t border-border pt-3">
                <Button
                  onClick={handleAdminDeleteReporte}
                  variant="destructive"
                  className="w-full text-sm"
                  size="sm"
                >
                  <Trash2 className="size-4" />
                  Eliminar Reporte (Admin)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog - Eliminar Reporte */}
      <AlertDialog open={showDeleteReporteDialog} onOpenChange={setShowDeleteReporteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
              </span>
              ¿Eliminar este reporte?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Se eliminará permanentemente este reporte.</p>
                <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/60 p-3">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{reporte?.descripcion}</p>
                </div>
                <p className="text-sm font-medium text-destructive">
                  Esta acción no se puede deshacer.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <ThumbsDown className="size-4" aria-hidden="true" />
              </span>
              ¿Confirmar voto «No existe»?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirmá que el reporte no existe o fue enviado por error.</p>
                <div className="rounded-xl border border-border/70 bg-muted/60 p-3">
                  <p className="font-semibold text-foreground mb-1">{reporte?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Votantes actuales: {votosCount} / 1
                  </p>
                </div>
                <div className="tone-danger-soft-inline rounded-xl p-3">
                  <p className="text-sm">
                    Con 1 voto, el reporte será <span className="font-bold">rechazado automáticamente</span>.
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-4" aria-hidden="true" />
              </span>
              ¿Confirmar que está reparado?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirmá que este problema ya fue solucionado.</p>
                <div className="rounded-xl border border-border/70 bg-muted/60 p-3">
                  <p className="font-semibold text-foreground mb-1">{reporte?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Votantes actuales: {votosReparadoCount} / 1
                  </p>
                </div>
                <div className="tone-success-soft-inline rounded-xl p-3">
                  <p className="text-sm">
                    Con 1 voto, el reporte se marcará como <span className="font-bold">Reparado</span>.
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

      {/* AlertDialog - Admin: Cambiar Estado */}
      <AlertDialog open={showAdminChangeEstadoDialog} onOpenChange={setShowAdminChangeEstadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--semantic-admin)]/10 text-[var(--semantic-admin)]">
                <Shield className="size-4" aria-hidden="true" />
              </span>
              ¿Cambiar estado del reporte?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Elegí el nuevo estado para este reporte.</p>
                <div className="space-y-2 rounded-xl border border-border/70 bg-muted/60 p-3">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Estado actual:</span>
                    <Badge variant={getStatusVariant(getNameFromRelation(reporte?.estados))}>
                      {getNameFromRelation(reporte?.estados)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Nuevo estado:</span>
                    <Badge
                      variant={getStatusVariant(
                        estados.find(e => e.id.toString() === estadoSeleccionado)?.nombre || ""
                      )}
                    >
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
                <div className="rounded-xl border border-[var(--semantic-admin)]/25 bg-[var(--semantic-admin)]/10 p-3 text-[var(--semantic-admin)]">
                  <p className="text-sm">
                    Esta acción quedará registrada en el historial del reporte.
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
                className="bg-foreground text-background hover:bg-foreground/88"
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
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--semantic-admin)]/10 text-[var(--semantic-admin)]">
                <Shield className="size-4" aria-hidden="true" />
              </span>
              ¿Eliminar reporte como administrador?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Se eliminará permanentemente este reporte y sus comentarios.</p>
                <div className="space-y-2 rounded-xl border border-border/70 bg-muted/60 p-3">
                  <p className="font-semibold text-foreground">{reporte?.titulo}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{reporte?.descripcion}</p>
                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Estado actual:</span>
                    <Badge variant={getStatusVariant(getNameFromRelation(reporte?.estados))}>
                      {getNameFromRelation(reporte?.estados)}
                    </Badge>
                  </div>
                </div>
                <div className="tone-danger-soft-inline rounded-xl p-3">
                  <p className="text-sm font-medium">
                    Esta acción no se puede deshacer.
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

    </div>
  );
}
