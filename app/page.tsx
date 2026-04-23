"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Map,
  MapPin,
  Plus,
  Trophy,
  Users,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportCard } from "@/components/report-card";
import { getTopUsuarios } from "@/database/queries/puntos";
import { getEstadisticas } from "@/database/queries/estadisticas";
import { getReportesRecientes, type ReporteReciente } from "@/database/queries/reportes-recientes";
import { createClient } from "@/utils/supabase/client";

const getRankingVariant = (index: number) => {
  if (index === 0) return "oro" as const;
  if (index === 1) return "plata" as const;
  if (index === 2) return "bronce" as const;
  return "secondary" as const;
};

const getRankingAccent = (index: number) => {
  if (index === 0) return "bg-[var(--rank-gold-soft)] text-[var(--rank-gold)]";
  if (index === 1) return "bg-[var(--rank-silver-soft)] text-[var(--rank-silver)]";
  if (index === 2) return "bg-[var(--rank-bronze-soft)] text-[var(--rank-bronze)]";
  return "bg-[var(--surface-subtle)] text-primary";
};

type RecentReport = ReporteReciente;

const getNombre = (obj: any): string => {
  if (!obj) return "N/A";
  if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A";
  if (obj.nombre) return obj.nombre;
  return "N/A";
};

const getImageUrl = (fotos: any): string => {
  if (!fotos) return "/placeholder.svg";
  if (Array.isArray(fotos) && fotos.length > 0 && fotos[0].url) return fotos[0].url;
  return "/placeholder.svg";
};

const getUsername = (profiles: any): string => {
  if (!profiles) return "Anónimo";
  if (Array.isArray(profiles) && profiles.length > 0) return profiles[0].username || "Anónimo";
  if (profiles.username) return profiles.username;
  return "Anónimo";
};

export default function HomePage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRolId, setUserRolId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("rol_id").eq("id", user.id).single();
          setUserRolId(profileData?.rol_id ?? null);
        }

        const estadisticas = await getEstadisticas(supabase);
        setStats(estadisticas);

        const reportes = await getReportesRecientes(supabase, 3);
        setRecentReports(reportes);

        const { data: topUsers } = await getTopUsuarios(supabase, 3);
        if (topUsers) setTopUsuarios(topUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const canCreate = userRolId === 1 || userRolId === 2;
  const readOnly = userRolId === null || userRolId === 3;

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card">
          <div className="grid items-stretch lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[30rem] overflow-hidden">
              <Image
                src="/background_inicio/Posadas.jpeg"
                alt="Vista de Posadas"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8 lg:p-10">
                <div className="space-y-6">
                  <Badge variant="secondary" className="border-white/20 bg-white/10 text-white">
                    Plataforma ciudadana independiente
                  </Badge>
                  <div className="space-y-4">
                    <h1 className="hero-title max-w-3xl text-white">
                      Reportá problemas urbanos de Posadas con claridad.
                    </h1>
                    <p className="hero-copy max-w-2xl text-white/82">
                      JackeMate ayuda a visibilizar baches, semáforos rotos, alumbrado deficiente y otros reclamos públicos con una interfaz simple, ordenada y útil para la comunidad.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/78">
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Cobertura comunitaria</div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Seguimiento transparente</div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Diseñado para mobile</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 p-6 md:p-8 lg:p-10">
              <div className="section-stack">
                <span className="section-eyebrow">Acciones rápidas</span>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Un producto cívico, no una vitrina.
                </h2>
                <p className="section-copy max-w-none">
                  Priorizamos reportar, consultar y entender el estado de la ciudad. Menos ruido visual. Más contexto útil para tomar acción.
                </p>
              </div>

              <div className="grid gap-3">
                {canCreate && (
                  <>
                    <Button size="lg" className="justify-between" asChild>
                      <Link href="/reportes/nuevo">
                        <span className="flex items-center gap-2">
                          <Plus className="size-4" />
                          Crear nuevo reporte
                        </span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="secondary" size="lg" className="justify-between" asChild>
                      <Link href="/reportes">
                        <span>Ver reportes públicos</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="secondary" size="lg" className="justify-between" asChild>
                      <Link href="/mapa">
                        <span className="flex items-center gap-2">
                          <Map className="size-4" />
                          Explorar en mapa
                        </span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </>
                )}

                {readOnly && (
                  <>
                    <Button size="lg" className="justify-between" asChild>
                      <Link href="/mapa">
                        <span className="flex items-center gap-2">
                          <Map className="size-4" />
                          Explorar en mapa
                        </span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Card className="surface-subtle">
                      <CardContent className="space-y-3 pt-6">
                        <p className="text-sm font-medium tracking-tight">
                          {userRolId === null ? "¿Querés participar activamente?" : "Tu cuenta tiene acceso de consulta."}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {userRolId === null
                            ? "Creá una cuenta para reportar incidentes y sumar evidencia ciudadana en tu barrio."
                            : "Podés revisar reportes y mapa. Para crear nuevos reportes necesitás permisos de ciudadano o administrador."}
                        </p>
                        {userRolId === null && (
                          <Button asChild>
                            <Link href="/auth">Crear cuenta</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section-stack">
          <div>
            <span className="section-eyebrow">Indicadores</span>
            <h2 className="section-title mt-3">Estado actual de la comunidad</h2>
            <p className="section-copy mt-3">
              Cada dato muestra participación real de vecinos y trazabilidad del trabajo que se reporta en la plataforma.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="kpi-card">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-primary">
                <Users className="size-5" />
              </div>
              <p className="kpi-value">{loading ? "..." : stats.totalUsers}</p>
              <p className="mt-2 text-sm text-muted-foreground">Usuarios activos</p>
            </div>
            <div className="kpi-card">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-primary">
                <AlertTriangle className="size-5" />
              </div>
              <p className="kpi-value">{loading ? "..." : stats.totalReports}</p>
              <p className="mt-2 text-sm text-muted-foreground">Reportes registrados</p>
            </div>
            <div className="kpi-card">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-primary">
                <CheckCircle className="size-5" />
              </div>
              <p className="kpi-value">{loading ? "..." : stats.resolvedReports}</p>
              <p className="mt-2 text-sm text-muted-foreground">Casos marcados como resueltos</p>
            </div>
          </div>
        </section>

        <section className="section-stack">
          <div>
            <span className="section-eyebrow">Comunidad</span>
            <h2 className="section-title mt-3">Personas que sostienen el movimiento</h2>
            <p className="section-copy mt-3">
              Reconocemos a quienes más reportan y ayudan a mantener información útil para toda Posadas.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">Cargando ranking...</CardContent>
              </Card>
            ) : topUsuarios.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">Aún no hay usuarios en el ranking.</CardContent>
              </Card>
            ) : (
              topUsuarios.map((usuario, index) => (
                <Card key={usuario.username ?? index} className={index === 0 ? "border-foreground/15" : undefined}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge variant={getRankingVariant(index)}>{`${index + 1}° puesto`}</Badge>
                        <h3 className="text-xl font-semibold tracking-tight">{usuario.username || "Usuario"}</h3>
                        <p className="text-sm text-muted-foreground">Participación destacada dentro de la plataforma.</p>
                      </div>
                      <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${getRankingAccent(index)}`}>
                        <Trophy className="size-6" />
                      </div>
                    </div>
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-3xl font-semibold tracking-tight">{usuario.puntos}</p>
                      <p className="mt-1 text-sm text-muted-foreground">puntos acumulados</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="section-stack">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">Actividad reciente</span>
              <h2 className="section-title mt-3">Últimos reportes publicados</h2>
              <p className="section-copy mt-3">Una vista rápida de lo que está ocurriendo en los barrios y corredores urbanos.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reportes">Ver todos los reportes</Link>
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Cargando reportes recientes...</CardContent>
            </Card>
          ) : recentReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <p>Aún no hay reportes cargados.</p>
                {canCreate && (
                  <Button asChild>
                    <Link href="/reportes/nuevo">Crear el primero</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-[var(--surface-subtle)] p-6 md:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <span className="section-eyebrow">Participación ciudadana</span>
              <h2 className="section-title">Si algo está mal en tu barrio, que se vea.</h2>
              <p className="section-copy max-w-3xl">
                JackeMate está pensado para registrar problemas públicos con evidencia, ubicación y seguimiento. El diseño acompaña esa tarea: superficies limpias, foco claro y navegación consistente.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              {canCreate ? (
                <>
                  <Button size="lg" asChild>
                    <Link href="/reportes/nuevo">Crear reporte</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/mapa">Abrir mapa</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/mapa">Explorar el mapa</Link>
                  </Button>
                  {userRolId === null && (
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/auth">Registrarme</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-border py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">JackeMate</p>
              <p>Iniciativa ciudadana para Posadas, Misiones.</p>
            </div>
          </div>
          <div className="space-y-1 text-left md:text-right">
            <p>Plataforma cívica, simple y orientada a evidencia.</p>
            <p>Sin build automático. Sin ruido visual. Con foco en la tarea.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
