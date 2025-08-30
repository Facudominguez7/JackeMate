"use client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Search, Filter, Map } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

export default function HomePage() {
  const { user, loading } = useAuth()
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PosaCalles</h1>
                <p className="text-sm text-muted-foreground">Mejoremos nuestra ciudad juntos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
        {!loading && user && (
                <>
                  <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                    <Link href="/dashboard">Mi Dashboard</Link>
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
                    <Link href="/reportes/nuevo">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Reporte
                    </Link>
                  </Button>
          <LogoutButton size="sm" />
                </>
              )}
              {!loading && !user && (
                <>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
                    <Link href="/auth">
                      <span className="hidden sm:inline">Iniciar Sesión</span>
                      <span className="sm:hidden">Entrar</span>
                    </Link>
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
                    <Link href="/auth">
                      <span className="hidden sm:inline">Registrarse</span>
                      <span className="sm:hidden">Registro</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Reporta problemas públicos en <span className="text-primary">Posadas</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Ayuda a mejorar nuestra ciudad reportando baches, semáforos rotos, alumbrado público defectuoso y otros
            problemas urbanos. Tu participación hace la diferencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/reportes/nuevo">
                <Plus className="w-5 h-5 mr-2" />
                Reportar Problema
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/mapa">
                <Map className="w-5 h-5 mr-2" />
                Ver Mapa
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/reportes">
                <Search className="w-5 h-5 mr-2" />
                Ver Reportes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-16 px-4">
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
            {/* Sample Report Cards */}
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

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-3xl font-bold text-foreground mb-4">¿Encontraste un problema en tu barrio?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Únete a miles de posadeños que ya están ayudando a mejorar nuestra ciudad. Reporta problemas, sigue su
            progreso y construyamos juntos una Posadas mejor.
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link href="/reportes/nuevo">
              <Plus className="w-5 h-5 mr-2" />
              Crear mi Primer Reporte
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">PosaCalles</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma ciudadana para reportar y dar seguimiento a problemas públicos en Posadas, Misiones.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Reportes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/reportes/nuevo" className="hover:text-primary">
                    Crear Reporte
                  </Link>
                </li>
                <li>
                  <Link href="/mapa" className="hover:text-primary">
                    Ver Mapa
                  </Link>
                </li>
                <li>
                  <Link href="/reportes" className="hover:text-primary">
                    Mis Reportes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Comunidad</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Cómo Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Guías
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 PosaCalles. Hecho con ❤️ para la comunidad posadeña.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
