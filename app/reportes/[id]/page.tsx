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
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dynamic from "next/dynamic";

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

type Comentario = {
  id: number;
  reporte_id: number;
  usuario_id: string;
  contenido: string;
  created_at: string;
  profiles:
    | {
        username: string;
      }
    | {
        username: string;
      }[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Reparado":
      return "bg-green-50 text-green-700 border-green-200";
    case "Pendiente":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Rechazado":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "";
  }
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
        const { data, error } = await supabase
          .from("reportes")
          .select(
            `
            id,
            titulo,
            descripcion,
            lat,
            lon,
            created_at,
            usuario_id,
            categorias (nombre),
            prioridades (nombre),
            estados (nombre),
            fotos_reporte (url),
            profiles (username)
          `
          )
          .eq("id", resolvedParams.id)
          .is("deleted_at", null)
          .single();

        if (!error && data) {
          setReporte(data);

          // Contar votos "no existe"
          const { count } = await supabase
            .from("votos_no_existe")
            .select("*", { count: "exact", head: true })
            .eq("reporte_id", resolvedParams.id);

          setVotosCount(count || 0);

          // Verificar si el usuario actual ya votó
          if (user) {
            const { data: votoData } = await supabase
              .from("votos_no_existe")
              .select("id")
              .eq("reporte_id", resolvedParams.id)
              .eq("usuario_id", user.id)
              .single();

            setHasVoted(!!votoData);
          }
        }

        // Obtener comentarios
        const { data: comentariosData, error: comentariosError } =
          await supabase
            .from("comentarios_reporte")
            .select(
              `
            id,
            reporte_id,
            usuario_id,
            contenido,
            created_at,
            profiles (username)
          `
            )
            .eq("reporte_id", resolvedParams.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (!comentariosError && comentariosData) {
          setComentarios(comentariosData);
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

    setIsVoting(true);
    try {
      // Insertar voto
      const { error: votoError } = await supabase
        .from("votos_no_existe")
        .insert({
          reporte_id: reporte.id,
          usuario_id: currentUser.id,
        });

      if (votoError) {
        console.error("Error al votar:", votoError);
        alert("Error al registrar el voto");
        return;
      }

      // Actualizar contador local
      const newVotosCount = votosCount + 1;
      setVotosCount(newVotosCount);
      setHasVoted(true);

      // Si llega a 5 votos, cambiar estado a Rechazado
      if (newVotosCount >= 5) {
        // Obtener el ID del estado "Rechazado"
        const { data: estadoRechazado } = await supabase
          .from("estados")
          .select("id")
          .eq("nombre", "Rechazado")
          .single();

        if (estadoRechazado) {
          await supabase
            .from("reportes")
            .update({ estado_id: estadoRechazado.id })
            .eq("id", reporte.id);

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
      // Realizar soft delete (marcar como eliminado)
      const { error } = await supabase
        .from("reportes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", reporte.id);

      if (error) {
        console.error("Error al eliminar el reporte:", error);
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
      const { data, error } = await supabase
        .from("comentarios_reporte")
        .insert({
          reporte_id: reporte.id,
          usuario_id: currentUser.id,
          contenido: nuevoComentario.trim(),
        })
        .select(
          `
          id,
          reporte_id,
          usuario_id,
          contenido,
          created_at,
          profiles (username)
        `
        )
        .single();

      if (error) {
        console.error("Error al crear comentario:", error);
        alert("Error al publicar el comentario");
        return;
      }

      if (data) {
        setComentarios([...comentarios, data]);
        setNuevoComentario("");
      }
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
      // Realizar soft delete (marcar como eliminado)
      const { error } = await supabase
        .from("comentarios_reporte")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", comentarioId)
        .eq("usuario_id", currentUser.id); // Solo el autor puede eliminar

      if (error) {
        console.error("Error al eliminar comentario:", error);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive";
      case "Media":
        return "secondary";
      case "Baja":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Acciones de la página */}
      <div className="container mx-auto px-4 pt-6 max-w-4xl">
        <Button variant="outline" asChild>
          <Link href="/reportes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Encabezado del Reporte */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          getPriorityColor(
                            getNombre(reporte.prioridades)
                          ) as any
                        }
                      >
                        {getNombre(reporte.prioridades)}
                      </Badge>
                      <Badge
                        className={getStatusColor(getNombre(reporte.estados))}
                      >
                        {getNombre(reporte.estados)}
                      </Badge>
                      <Badge variant="outline">
                        {getNombre(reporte.categorias)}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{reporte.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Lat: {reporte.lat.toFixed(6)}, Lon:{" "}
                      {reporte.lon.toFixed(6)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed mb-6">
                  {reporte.descripcion}
                </p>

                {/* Imágenes */}
                {reporte.fotos_reporte && reporte.fotos_reporte.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {reporte.fotos_reporte.map((foto, index) => (
                      <div
                        key={index}
                        className="aspect-video bg-muted rounded-lg overflow-hidden"
                      >
                        <img
                          src={foto.url || "/placeholder.svg"}
                          alt={`Imagen ${index + 1} del reporte`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Autor y Fecha */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(getUsername(reporte.profiles))}
                      </AvatarFallback>
                    </Avatar>
                    <span>Reportado por {getUsername(reporte.profiles)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(reporte.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección de Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Actualizaciones y Comentarios
                </CardTitle>
                <CardDescription>
                  Compartí actualizaciones sobre el estado de este reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulario para nuevo comentario */}
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    placeholder="Ej: 'Llamé a la municipalidad', 'Vi personal trabajando en el lugar', etc."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!nuevoComentario.trim() || isSubmittingComment}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmittingComment
                        ? "Publicando..."
                        : "Publicar Comentario"}
                    </Button>
                  </div>
                </form>

                {/* Lista de comentarios */}
                <div className="space-y-4">
                  {comentarios.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Aún no hay comentarios</p>
                      <p className="text-xs">Sé el primero en comentar</p>
                    </div>
                  ) : (
                    comentarios.map((comentario) => (
                      <div
                        key={comentario.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(
                                  getComentarioUsername(comentario.profiles)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {getComentarioUsername(comentario.profiles)}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {dayjs
                                  .utc(comentario.created_at)
                                  .tz("America/Argentina/Buenos_Aires")
                                  .format("DD/MM/YYYY HH:mm")}
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
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed pl-11">
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
          <div className="space-y-6">
            {/* Botón "Eliminar Reporte" - Solo para el creador */}
            {currentUser && currentUser.id === reporte.usuario_id && (
              <Card className="border-2 border-destructive/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        Eliminar Reporte
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Como creador de este reporte, podés eliminarlo si lo
                        considerás necesario.
                      </p>
                      <p className="text-xs text-destructive">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      onClick={handleDeleteReporte}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      {isDeleting ? "Eliminando..." : "Eliminar Reporte"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón "No Existe" */}
            {currentUser && currentUser.id !== reporte.usuario_id && (
              <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        ¿Este reporte no existe?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Si verificaste que este problema ya no existe o nunca
                        existió, podés reportarlo.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Con 5 votos de "No Existe", el reporte será marcado como
                        rechazado.
                      </p>
                    </div>
                    <Button
                      variant={hasVoted ? "secondary" : "destructive"}
                      size="lg"
                      className="w-full"
                      onClick={handleVoteNoExiste}
                      disabled={hasVoted || isVoting}
                    >
                      <ThumbsDown className="w-5 h-5 mr-2" />
                      {hasVoted ? "Ya votaste" : "Marcar como No Existe"}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">
                        {votosCount} {votosCount === 1 ? "voto" : "votos"}
                      </span>
                      <span>•</span>
                      <span>
                        {5 - votosCount}{" "}
                        {5 - votosCount === 1 ? "restante" : "restantes"} para
                        rechazar
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marcador de Posición del Mapa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/mapa" className="block group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                    <MiniMap lat={reporte.lat} lon={reporte.lon} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-background/90 border rounded-md px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>
                          Lat {reporte.lat.toFixed(4)}, Lon {reporte.lon.toFixed(4)}
                        </span>
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
