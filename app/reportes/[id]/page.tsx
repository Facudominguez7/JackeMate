"use client"

import { use, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, ArrowLeft, Calendar, Flag, Share2, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"

type Reporte = {
  id: number
  titulo: string
  descripcion: string
  lat: number
  lon: number
  created_at: string
  categorias: any
  prioridades: any
  estados: any
  fotos_reporte: any[]
  profiles: any
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Reparado":
      return "bg-green-50 text-green-700 border-green-200"
    case "Pendiente":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    case "Rechazado":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return ""
  }
}

const getNombre = (obj: any): string => {
  if (!obj) return "N/A"
  if (Array.isArray(obj) && obj.length > 0) return obj[0].nombre || "N/A"
  if (obj.nombre) return obj.nombre
  return "N/A"
}

const getUsername = (obj: any): string => {
  if (!obj) return "Usuario"
  if (Array.isArray(obj) && obj.length > 0) return obj[0].username || "Usuario"
  if (obj.username) return obj.username
  return "Usuario"
}

const getUserInitials = (username: string) => {
  if (!username || username === "Usuario") return "US"
  return username.substring(0, 2).toUpperCase()
}


export default function ReporteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const { data, error } = await supabase
          .from('reportes')
          .select(`
            id,
            titulo,
            descripcion,
            lat,
            lon,
            created_at,
            categorias (nombre),
            prioridades (nombre),
            estados (nombre),
            fotos_reporte (url),
            profiles (username)
          `)
          .eq('id', resolvedParams.id)
          .is('deleted_at', null)
          .single()

        if (!error && data) {
          setReporte(data)
        }
      } catch (error) {
        console.error("Error fetching reporte:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReporte()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
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
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive"
      case "Media":
        return "secondary"
      case "Baja":
        return "outline"
      default:
        return "outline"
    }
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Page actions */}
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(getNombre(reporte.prioridades)) as any}>
                        {getNombre(reporte.prioridades)}
                      </Badge>
                      <Badge className={getStatusColor(getNombre(reporte.estados))}>
                        {getNombre(reporte.estados)}
                      </Badge>
                      <Badge variant="outline">{getNombre(reporte.categorias)}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{reporte.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Lat: {reporte.lat.toFixed(6)}, Lon: {reporte.lon.toFixed(6)}
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
                <p className="text-foreground leading-relaxed mb-6">{reporte.descripcion}</p>

                {/* Imagenes */}
                {reporte.fotos_reporte && reporte.fotos_reporte.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {reporte.fotos_reporte.map((foto, index) => (
                      <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={foto.url || "/placeholder.svg"}
                          alt={`Imagen ${index + 1} del reporte`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Author and Date */}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado Actual</p>
                  <Badge className={getStatusColor(getNombre(reporte.estados))}>
                    {getNombre(reporte.estados)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                  <Badge variant={getPriorityColor(getNombre(reporte.prioridades)) as any}>
                    {getNombre(reporte.prioridades)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                  <Badge variant="outline">{getNombre(reporte.categorias)}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="text-sm">{new Date(reporte.created_at).toLocaleDateString("es-AR")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Mapa Interactivo</p>
                    <p className="text-xs text-muted-foreground">Próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
