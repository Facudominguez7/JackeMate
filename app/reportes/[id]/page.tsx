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
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dynamic from "next/dynamic";
import {
  getReporteDetalle,
  getVotosNoExiste,
  verificarVotoUsuario,
  votarNoExiste,
  getEstadoRechazadoId,
  actualizarEstadoReporte,
  eliminarReporte,
  getComentariosReporte,
  crearComentario,
  eliminarComentario,
  type Comentario,
} from "@/utils/supabase/queries/reportes/[id]/index";
import { getStatusColor, getPriorityColor } from "@/components/report-card";

dayjs.extend(utc);
dayjs.extend(timezone);

// Importar el MiniMap de forma dinámica solo en el cliente para evitar errores de SSR con Leaflet
const MiniMap = dynamic(() => import("@/components/mini-map").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Cargando mapa…</p>
      </div>
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Obtener reporte
        const { data, error } = await getReporteDetalle(supabase, resolvedParams.id);

        if (!error && data) {
          setReporte(data);

          // Contar votos "no existe"
          const { count } = await getVotosNoExiste(supabase, resolvedParams.id);
          setVotosCount(count);

          // Verificar si el usuario actual ya votó
          if (user) {
            const { hasVoted } = await verificarVotoUsuario(
              supabase,
              resolvedParams.id,
              user.id
            );
            setHasVoted(hasVoted);
          }
        }

        // Obtener comentarios
        const { data: comentariosData } = await getComentariosReporte(
          supabase,
          resolvedParams.id
        );
        setComentarios(comentariosData);
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

    setIsVoting(true);
    try {
      // Insertar voto
      const { success, error } = await votarNoExiste(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success || error) {
        alert("Error al registrar el voto");
        return;
      }

      // Actualizar contador local
      const newVotosCount = votosCount + 1;
      setVotosCount(newVotosCount);
      setHasVoted(true);

      // Si llega a 5 votos, cambiar estado a Rechazado
      if (newVotosCount >= 5) {
        const { estadoId } = await getEstadoRechazadoId(supabase);

        if (estadoId) {
          await actualizarEstadoReporte(supabase, reporte.id, estadoId);
          // Recargar página para mostrar el nuevo estado
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar el voto");
    } finally {
      setIsVoting(false);
    }
  };

  const handleDeleteReporte = async () => {
    if (!currentUser || !reporte) return;

    // Confirmar antes de borrar
    const confirmDelete = window.confirm(
      "¿Estás seguro de que querés eliminar este reporte? Esta acción no se puede deshacer."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { success } = await eliminarReporte(
        supabase,
        reporte.id,
        currentUser.id
      );

      if (!success) {
        alert("Error al eliminar el reporte. Por favor, intenta nuevamente.");
        return;
      }

      alert("Reporte eliminado exitosamente");
      // Redirigir al dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la eliminación");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !reporte || !nuevoComentario.trim()) return;

    // Confirmar antes de publicar
    const confirmPublish = window.confirm(
      "¿Estás seguro de que querés publicar este comentario?"
    );

    if (!confirmPublish) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await crearComentario(
        supabase,
        reporte.id,
        currentUser.id,
        nuevoComentario.trim()
      );

      if (error || !data) {
        alert("Error al publicar el comentario");
        return;
      }

      setComentarios([...comentarios, data]);
      setNuevoComentario("");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar el comentario");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (comentarioId: number) => {
    if (!currentUser) return;

    const confirmDelete = window.confirm(
      "¿Estás seguro de que querés eliminar este comentario?"
    );

    if (!confirmDelete) return;

    try {
      const { success } = await eliminarComentario(
        supabase,
        comentarioId,
        currentUser.id
      );

      if (!success) {
        alert("Error al eliminar el comentario");
        return;
      }

      // Actualizar lista de comentarios (filtrar el eliminado)
      setComentarios(comentarios.filter((c) => c.id !== comentarioId));
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la eliminación");
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
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
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
          
          {/* Botones de acción rápida en desktop */}
          <div className="hidden lg:flex items-center gap-2">
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
                        variant={
                          getPriorityColor(
                            getNombre(reporte.prioridades)
                          ) as any
                        }
                        className="text-xs lg:text-sm"
                      >
                        {getNombre(reporte.prioridades)}
                      </Badge>
                      <Badge
                        className={`${getStatusColor(getNombre(reporte.estados))} text-xs lg:text-sm`}
                      >
                        {getNombre(reporte.estados)}
                      </Badge>
                      <Badge variant="blue" className="text-xs lg:text-sm">
                        {getNombre(reporte.categorias)}
                      </Badge>
                    </div>
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
                  Compartí actualizaciones sobre el estado de este reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 lg:space-y-8 pt-0 lg:px-8 lg:pb-8">
                {/* Formulario para nuevo comentario */}
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
                          {currentUser &&
                            currentUser.id === comentario.usuario_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteComment(comentario.id)
                                }
                                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" />
                              </Button>
                            )}
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
            
            {/* Botón "Marcar como Reparado" - Para cualquier usuario autenticado */}
            {currentUser && (
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
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-9 md:h-10 lg:h-11 bg-green-600 hover:bg-green-700 text-white"
                      disabled
                    >
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                      <span className="text-xs md:text-sm lg:text-base font-medium">
                        Votar como Reparado
                      </span>
                    </Button>
                    <p className="text-[10px] lg:text-xs text-muted-foreground italic">
                      Próximamente disponible
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Botón "No Existe" */}
            {currentUser && currentUser.id !== reporte.usuario_id && (
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
    </div>
  );
}
