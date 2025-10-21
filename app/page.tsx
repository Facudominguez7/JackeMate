"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Search, Map, Users, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Contar usuarios activos (profiles)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Contar reportes totales (no eliminados)
        const { count: reportsCount } = await supabase
          .from('reportes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)

        // Contar reportes resueltos (estado_id = 2 que es "Reparado")
        const { count: resolvedCount } = await supabase
          .from('reportes')
          .select('*', { count: 'exact', head: true })
          .eq('estado_id', 2)
          .is('deleted_at', null)

        setStats({
          totalUsers: usersCount || 0,
          totalReports: reportsCount || 0,
          resolvedReports: resolvedCount || 0
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Sección Hero - Mejorado */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat "
          style={{ backgroundImage: "url('/background_inicio/Posadas.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/70 to-background/50 pointer-events-none" />
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <Badge className="mb-6 text-base px-6 py-2" variant="secondary">
            🏙️ Plataforma Ciudadana de Posadas
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-8 leading-tight">
            Mejoremos <span className="text-primary">Posadas</span>
            <br />
            <span className="text-3xl md:text-5xl text-foreground">entre todos</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            Reportá problemas urbanos, seguí su progreso y ayudá a construir una ciudad mejor para todos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all" asChild>
              <Link href="/reportes/nuevo">
                <Plus className="w-6 h-6 mr-2" />
                Reportar Problema
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-6" asChild>
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
              <h3 className="text-3xl font-bold text-foreground mb-2">Reportes Recientes</h3>
              <p className="text-muted-foreground">Los problemas más recientes reportados por la comunidad</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reportes">
                Ver Todos
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tarjetas de Reportes de Ejemplo */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Bache en Av. Quaranta</CardTitle>
                  <Badge variant="destructive">Urgente</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Centro, Posadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src="/bache-en-calle-de-posadas.png"
                    alt="Bache reportado"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Bache de gran tamaño que dificulta el tránsito vehicular...
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hace 2 horas</span>
                  <Badge variant="outline">En Progreso</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Semáforo Descompuesto</CardTitle>
                  <Badge variant="secondary">Media</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Villa Cabello, Posadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src="/semaforo-roto-en-interseccion.png"
                    alt="Semáforo descompuesto"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  El semáforo de la intersección no funciona desde ayer...
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hace 1 día</span>
                  <Badge variant="outline">Reportado</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Alumbrado Público</CardTitle>
                  <Badge>Baja</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  San Roque, Posadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src="/farola-de-luz-publica-apagada-de-noche.png"
                    alt="Alumbrado público defectuoso"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Varias farolas sin funcionar en la cuadra...</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hace 3 días</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Resuelto
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
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
            Únete a miles de posadeños que están ayudando a mejorar nuestra ciudad.
            <br />
            <span className="font-semibold">Tu voz importa, tu reporte hace la diferencia.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-10 py-6 shadow-lg" asChild>
              <Link href="/reportes/nuevo">
                <Plus className="w-6 h-6 mr-2" />
                Crear mi Primer Reporte
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-6" asChild>
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
                <span className="font-bold text-foreground text-xl">JackeMate</span>
                <p className="text-sm text-muted-foreground">Plataforma ciudadana de Posadas</p>
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
  )
}
