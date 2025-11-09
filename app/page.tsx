"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Map,
  Users,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Medal,
  Award,
  Crown,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { ReportCard } from "@/components/report-card";
import { getTopUsuarios } from "@/database/queries/puntos";
import { getEstadisticas } from "@/database/queries/estadisticas";
import { getReportesRecientes, type ReporteReciente } from "@/database/queries/reportes-recientes";

type RecentReport = ReporteReciente;

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

const getUsername = (profiles: any): string => {
  if (!profiles) return "Anónimo";
  if (Array.isArray(profiles) && profiles.length > 0)
    return profiles[0].username || "Anónimo";
  if (profiles.username) return profiles.username;
  return "Anónimo";
};

/**
 * Componente de la página principal que muestra estadísticas del sitio, el ranking de colaboradores y los reportes recientes.
 *
 * Realiza la carga inicial de datos (estadísticas, últimos reportes y top usuarios) y renderiza las secciones: hero, estadísticas, top colaboradores, reportes recientes, llamado a la acción y pie de página.
 *
 * @returns El elemento JSX que representa la página principal de la aplicación.
 */
export default function HomePage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener estadísticas generales usando la query
        const estadisticas = await getEstadisticas(supabase);
        setStats(estadisticas);

        // Obtener los últimos 3 reportes usando la query
        const reportes = await getReportesRecientes(supabase, 3);
        setRecentReports(reportes);

        // Obtener top 3 usuarios con más puntos
        const { data: topUsers } = await getTopUsuarios(supabase, 3);
        if (topUsers) {
          setTopUsuarios(topUsers);
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
      {/* Sección Hero - Pantalla Completa Modernizada con Header Transparente */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-[88px]">
        {/* Video de fondo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source
            src="/background_inicio/videoplaybackk.mp4"
            type="video/mp4"
          />
        </video>

        {/* Overlays graduales */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/10" />

        {/* Elementos decorativos flotantes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute bottom-32 right-16 w-24 h-24 bg-primary/20 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-md animate-ping"
          style={{ animationDelay: "2s", animationDuration: "4s" }}
        />

        {/* Contenido principal */}
        <div className="container mx-auto relative z-10 px-4 sm:px-6 lg:px-8 pt-24">
          <div className="max-w-7xl mx-auto">
            {/* Contenedor principal con glassmorphism */}
            <div className="backdrop-blur-xs bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
              {/* Badge superior */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/90 backdrop-blur-sm rounded-full text-white font-semibold text-sm sm:text-base shadow-lg border border-primary/50">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Plataforma Ciudadana Independiente
                </div>
              </div>

              {/* Título principal */}
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-4xl sm:text-6xl lg:text-8xl xl:text-9xl font-black text-white mb-6 leading-none">
                  <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
                    JACKE
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent drop-shadow-2xl">
                    MATE
                  </span>
                </h1>
              </div>

              {/* Grid de contenido */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Columna izquierda - Texto */}
                <div className="space-y-6 lg:space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl text-white font-bold leading-tight">
                      Reportá problemas urbanos y
                      <span className="block text-primary drop-shadow-lg">
                        hacé la diferencia
                      </span>
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed">
                      Una plataforma creada por vecinos, para vecinos. Sin
                      intermediarios políticos, con total transparencia.
                    </p>
                  </div>

                </div>

                {/* Columna derecha - Acciones */}
                <div className="space-y-6">
                  {/* Botón principal */}
                  <Button
                    size="lg"
                    className="w-full text-lg px-10 py-6 shadow-lg"
                    asChild
                  >
                    <Link href="/reportes/nuevo">
                      <Plus className="w-6 h-6 mr-2" />
                      Reportar Problema
                    </Link>
                  </Button>

                  {/* Botones secundarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-base px-6 py-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                      asChild
                    >
                      <Link href="/reportes">
                        <Search className="w-5 h-5 mr-2" />
                        Ver Reportes
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="text-base px-6 py-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                      asChild
                    >
                      <Link href="/mapa">
                        <Map className="w-5 h-5 mr-2" />
                        Ver Mapa
                      </Link>
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas - Modernizada */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 via-white to-white dark:from-primary/5 dark:via-background dark:to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nuestra Comunidad en Números
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cada número representa vecinos comprometidos con mejorar nuestra ciudad
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-white to-primary/5 dark:from-background dark:to-primary/10">
              <CardContent className="pt-10 pb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-5xl font-black text-primary mb-3">
                  {loading ? "..." : `${stats.totalUsers}`}
                </h3>
                <p className="text-lg font-semibold text-muted-foreground">Usuarios Activos</p>
              </CardContent>
            </Card>
            <Card className="text-center border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-white to-primary/5 dark:from-background dark:to-primary/10">
              <CardContent className="pt-10 pb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                  <AlertTriangle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-5xl font-black text-primary mb-3">
                  {loading ? "..." : `${stats.totalReports}`}
                </h3>
                <p className="text-lg font-semibold text-muted-foreground">Reportes Creados</p>
              </CardContent>
            </Card>
            <Card className="text-center border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-white to-primary/5 dark:from-background dark:to-primary/10">
              <CardContent className="pt-10 pb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-5xl font-black text-primary mb-3">
                  {loading ? "..." : `${stats.resolvedReports}`}
                </h3>
                <p className="text-lg font-semibold text-muted-foreground">Problemas Resueltos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Top 3 Usuarios - Modernizado con Verde y Blanco */}
      <section className="py-28 px-4 bg-gradient-to-br from-white via-primary/5 to-white dark:from-background dark:via-primary/5 dark:to-background relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Crown className="w-12 h-12 text-amber-500 animate-bounce" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Top Colaboradores
              </h2>
              <Crown className="w-12 h-12 text-amber-500 animate-bounce" style={{animationDelay: '0.5s'}} />
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Los usuarios más activos que están haciendo la diferencia en nuestra comunidad
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando ranking...</p>
            </div>
          ) : topUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aún no hay usuarios en el ranking
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Segundo Lugar - Plata con toques verdes */}
              {topUsuarios[1] && (
                <div className="flex flex-col items-center md:mt-12">
                  <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-gray-900 dark:to-primary/10 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300" />
                    <CardContent className="pt-10 pb-8 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-xl group-hover:scale-110 transition-transform">
                          <Medal className="w-14 h-14 text-gray-600 dark:text-gray-200" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 dark:bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white dark:border-gray-800">
                          2
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-foreground mb-3">
                        {topUsuarios[1].username || "Usuario"}
                      </h4>
                      <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:bg-gray-700 rounded-full shadow-md">
                        <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                          {topUsuarios[1].puntos}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                          puntos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Primer Lugar */}
              {topUsuarios[0] && (
                <div className="flex flex-col items-center md:-mt-4">
                  <Card className="w-full border-4 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-900 shadow-2xl hover:shadow-3xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 animate-pulse" />
                    <CardContent className="pt-10 pb-8 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-full flex items-center justify-center border-4 border-amber-300 dark:border-amber-600 shadow-2xl animate-pulse">
                          <Crown className="w-16 h-16 text-amber-900 dark:text-amber-100" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white dark:border-gray-800">
                          1
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="px-3 py-1 bg-amber-500 dark:bg-amber-600 rounded-full text-white text-xs font-bold shadow-lg">
                            👑 CAMPEÓN
                          </div>
                        </div>
                      </div>
                      <h4 className="text-3xl font-bold text-foreground mb-3">
                        {topUsuarios[0].username || "Usuario"}
                      </h4>
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800 dark:to-yellow-800 rounded-full shadow-lg">
                        <Trophy className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                        <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                          {topUsuarios[0].puntos}
                        </span>
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                          puntos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tercer Lugar - Bronce con toques verdes */}
              {topUsuarios[2] && (
                <div className="flex flex-col items-center md:mt-12">
                  <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-orange-950 dark:to-orange-900 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300" />
                    <CardContent className="pt-10 pb-8 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-800 rounded-full flex items-center justify-center border-4 border-white dark:border-orange-600 shadow-xl group-hover:scale-110 transition-transform">
                          <Award className="w-14 h-14 text-orange-600 dark:text-orange-200" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white dark:border-gray-800">
                          3
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-foreground mb-3">
                        {topUsuarios[2].username || "Usuario"}
                      </h4>
                      <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-100 to-orange-200 dark:bg-orange-800 rounded-full shadow-md">
                        <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                        <span className="text-2xl font-bold text-orange-700 dark:text-orange-200">
                          {topUsuarios[2].puntos}
                        </span>
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                          puntos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-16">
            <p className="text-lg text-muted-foreground italic font-medium">
              ¡Sigue reportando y colaborando para escalar posiciones! 🚀
            </p>
          </div>
        </div>
      </section>

      {/* Reportes Recientes - Modernizado */}
      <section className="py-28 px-4 bg-gradient-to-b from-primary/5 via-white to-white dark:from-primary/5 dark:via-background dark:to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                Últimos Reportes
              </h2>
              <p className="text-xl text-muted-foreground">
                Los problemas más recientes reportados por la comunidad
              </p>
            </div>
            <Button variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-all" asChild>
              <Link href="/reportes">Ver Todos los Reportes</Link>
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
                <ReportCard
                  key={report.id}
                  id={report.id}
                  titulo={report.titulo}
                  descripcion={report.descripcion}
                  categoria={getNombre(report.categorias)}
                  prioridad={getNombre(report.prioridades)}
                  estado={getNombre(report.estados)}
                  imageUrl={getImageUrl(report.fotos_reporte)}
                  createdAt={report.created_at}
                  autor={getUsername(report.profiles)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sección de Llamado a la Acción - Modernizado con Verde */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary/10 via-primary/20 to-primary/10 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/30 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <div className="bg-white/50 dark:bg-background/50 backdrop-blur-sm rounded-3xl p-12 md:p-16 shadow-2xl border border-primary/20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8">
              ¿Encontraste un problema en tu barrio?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
              Únete a miles de posadeños que están ayudando a mejorar nuestra
              ciudad de manera independiente.
            </p>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-12">
              Tu voz importa, tu reporte hace la diferencia.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="text-lg px-12 py-7 shadow-xl hover:shadow-2xl transition-all hover:scale-105" asChild>
                <Link href="/reportes/nuevo">
                  <Plus className="w-6 h-6 mr-2" />
                  Crear mi Primer Reporte
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-12 py-7 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/50 dark:bg-background/50"
                asChild
              >
                <Link href="/mapa">
                  <Map className="w-6 h-6 mr-2" />
                  Explorar el Mapa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pie de Página - Modernizado con Verde */}
      <footer className="border-t border-primary/20 py-16 px-4 bg-gradient-to-b from-white to-primary/5 dark:from-background dark:to-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground text-2xl">
                  JackeMate
                </span>
                <p className="text-base text-muted-foreground">
                  Iniciativa ciudadana independiente
                </p>
              </div>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p className="text-base text-muted-foreground font-medium">
                Hecho con ❤️ por y para la comunidad posadeña
              </p>
              <p className="text-sm text-muted-foreground">
                Plataforma ciudadana sin afiliación gubernamental
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
