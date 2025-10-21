"use client";

import { useState, useEffect } from "react";
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
import {
  MapPin,
  Plus,
  Search,
  Map,
  Users,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type RecentReport = {
  id: number;
  titulo: string;
  descripcion: string;
  created_at: string;
  lat: number;
  lon: number;
  categorias: any;
  prioridades: any;
  estados: any;
  fotos_reporte: any;
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

const getNombre = (obj: any): string => {
  if (!obj) return "N/A";
  if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A";
  if (obj.nombre) return obj.nombre;
  return "N/A";
};

const getImageUrl = (fotos: any): string => {
  if (!fotos) return "/placeholder.svg";
  if (Array.isArray(fotos) && fotos.length > 0 && fotos[0].url)
    return fotos[0].url;
  return "/placeholder.svg";
};

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Hace menos de 1 hora";
  if (diffInHours < 24)
    return `Hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
  if (diffInDays === 1) return "Hace 1 día";
  return `Hace ${diffInDays} días`;
};

export default function HomePage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Contar usuarios activos (profiles)
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Contar reportes totales (no eliminados)
        const { count: reportsCount } = await supabase
          .from("reportes")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null);

        // Contar reportes resueltos (estado_id = 2 que es "Reparado")
        const { count: resolvedCount } = await supabase
          .from("reportes")
          .select("*", { count: "exact", head: true })
          .eq("estado_id", 2)
          .is("deleted_at", null);

        setStats({
          totalUsers: usersCount || 0,
          totalReports: reportsCount || 0,
          resolvedReports: resolvedCount || 0,
        });

        // Obtener los últimos 3 reportes
        const { data: reportes, error: reportesError } = await supabase
          .from("reportes")
          .select(
            `
            id,
            titulo,
            descripcion,
            created_at,
            lat,
            lon,
            categorias (nombre),
            prioridades (nombre),
            estados (nombre),
            fotos_reporte (url)
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!reportesError && reportes) {
          setRecentReports(reportes);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sección Hero - Pantalla Completa */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/background_inicio/Posadas.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/70 to-background/50 pointer-events-none" />
        <div className="container mx-auto text-center max-w-5xl relative z-10">

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-8 leading-tight">
            Mejoremos <span className="text-primary">Posadas</span>
            <br />
            <span className="text-3xl md:text-5xl text-foreground">
              entre todos
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            Reportá problemas urbanos, seguí su progreso y ayudá a construir una
            ciudad mejor para todos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link href="/reportes/nuevo">
                <Plus className="w-6 h-6 mr-2" />
                Reportar Problema
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-10 py-6"
              asChild
            >
              <Link href="/reportes">
                <Search className="w-6 h-6 mr-2" />
                Ver Reportes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas - Nuevo */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center border-primary/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {loading ? "..." : `${stats.totalUsers}`}
                </h3>
                <p className="text-muted-foreground">Usuarios Activos</p>
              </CardContent>
            </Card>
            <Card className="text-center border-primary/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {loading ? "..." : `${stats.totalReports}`}
                </h3>
                <p className="text-muted-foreground">Reportes Creados</p>
              </CardContent>
            </Card>
            <Card className="text-center border-primary/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {loading ? "..." : `${stats.resolvedReports}`}
                </h3>
                <p className="text-muted-foreground">Problemas Resueltos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reportes Recientes */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                Últimos reportes
              </h3>
              <p className="text-muted-foreground">
                Los problemas más recientes reportados por la comunidad
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reportes">Ver Todos</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Cargando reportes recientes...
              </p>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aún no hay reportes creados
              </p>
              <Button asChild>
                <Link href="/reportes/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear el Primer Reporte
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReports.map((report) => (
                <Link key={report.id} href={`/reportes/${report.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">
                          {report.titulo}
                        </CardTitle>
                        <Badge
                          variant={
                            getPriorityColor(
                              getNombre(report.prioridades)
                            ) as any
                          }
                        >
                          {getNombre(report.prioridades)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {getNombre(report.categorias)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img
                          src={
                            getImageUrl(report.fotos_reporte) ||
                            "/placeholder.svg"
                          }
                          alt={report.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {report.descripcion || "Sin descripción"}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getTimeAgo(report.created_at)}
                        </span>
                        <Badge
                          variant="outline"
                          className={getStatusColor(getNombre(report.estados))}
                        >
                          {getNombre(report.estados)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sección de Llamado a la Acción */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            ¿Encontraste un problema en tu barrio?
          </h3>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Únete a miles de posadeños que están ayudando a mejorar nuestra
            ciudad.
            <br />
            <span className="font-semibold">
              Tu voz importa, tu reporte hace la diferencia.
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-10 py-6 shadow-lg" asChild>
              <Link href="/reportes/nuevo">
                <Plus className="w-6 h-6 mr-2" />
                Crear mi Primer Reporte
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-10 py-6"
              asChild
            >
              <Link href="/mapa">
                <Map className="w-6 h-6 mr-2" />
                Explorar el Mapa
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pie de Página - Simplificado */}
      <footer className="border-t py-12 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground text-xl">
                  JackeMate
                </span>
                <p className="text-sm text-muted-foreground">
                  Plataforma ciudadana de Posadas
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground mb-2">
                Hecho con ❤️ para la comunidad posadeña
              </p>
              <p className="text-xs text-muted-foreground">
                &copy; 2025 JackeMate. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
