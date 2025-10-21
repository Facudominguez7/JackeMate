/**
 * Página de listado de reportes públicos
 * 
 * Server Component que consulta y muestra todos los reportes de problemas
 * públicos en Posadas desde Supabase.
 * 
 * Características:
 * - Renderizado en el servidor (RSC - React Server Component)
 * - Consulta a Supabase con relaciones (joins)
 * - Manejo de estados de error y datos vacíos
 * - Optimización con lazy loading de imágenes
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/server"
import { Calendar, MapPin, Plus, Search, User } from "lucide-react"
import Link from "next/link"

/**
 * Fuerza el renderizado dinámico en cada petición
 * Evita que Next.js cachee esta página para mostrar siempre datos actualizados
 */
/**
 * Fuerza el renderizado dinámico en cada petición
 * Evita que Next.js cachee esta página para mostrar siempre datos actualizados
 */
export const dynamic = "force-dynamic"

type ReportRow = {
  id: number
  titulo: string
  descripcion: string | null
  created_at: string
  lat: number | null
  lon: number | null
  categoria: { nombre: string } | null
  prioridad: { nombre: string } | null
  estado: { nombre: string } | null
  autor: { username: string | null } | null
  fotos: { url: string | null }[] | null
}

/**
 * Tipo simplificado para renderizar las tarjetas de reportes
 * Transforma los datos de la base de datos a un formato más amigable para la UI
 */
/**
 * Tipo simplificado para renderizar las tarjetas de reportes
 * Transforma los datos de la base de datos a un formato más amigable para la UI
 */
type ReportCardData = {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  location: string
  author: string
  createdAt: string
  image: string | null
}

/**
 * Variantes válidas para el componente Badge de shadcn/ui
 * Se usa para garantizar type-safety en los colores de prioridad
 */
type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

/**
 * Obtiene las clases CSS según el nombre del estado
 * 
 * @param status - Nombre del estado (ej: "Reparado", "Pendiente", "Rechazado")
 * @returns String con clases Tailwind CSS o vacío si no hay match
 */
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

/**
 * Obtiene la variante de Badge según el nombre de la prioridad
 * 
 * @param priority - Nombre de la prioridad (ej: "Alta", "Media", "Baja")
 * @returns Variante de Badge correspondiente o "outline" por defecto
 */
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

/**
 * Formatea las coordenadas geográficas para mostrar en la UI
 * 
 * @param lat - Latitud
 * @param lon - Longitud
 * @returns String formateado con coordenadas o mensaje de no disponible
 */
const formatLocation = (lat: number | null, lon: number | null) => {
  if (lat === null || lon === null) return "Ubicación no disponible"
  return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`
}

/**
 * Componente principal de la página de reportes
 * Server Component que se ejecuta en el servidor de Next.js
 */
export default async function ReportesPage() {
  // Crear cliente de Supabase para server components
  const supabase = await createClient()

  /**
   * Consulta a Supabase para obtener los reportes con sus relaciones
   * 
   * - Se filtran reportes no eliminados (deleted_at IS NULL)
   * - Se ordenan por fecha de creación descendente (más recientes primero)
   * - Se limita a 12 resultados para optimizar rendimiento
   * - Se incluyen las relaciones mediante foreign keys explícitas
   */
  const { data, error } = await supabase
    .from("reportes")
    .select(
      `id,
      titulo,
      descripcion,
      created_at,
      lat,
      lon,
      categoria:categorias!reportes_categoria_id_fkey(nombre),
      prioridad:prioridades!reportes_prioridad_id_fkey(nombre),
      estado:estados!reportes_estado_id_fkey(nombre),
      autor:profiles!reportes_usuario_id_fkey(username),
      fotos:fotos_reporte(url)`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<ReportRow[]>()

  /**
   * Transformación de datos de BD a formato de UI
   * Normaliza los datos y proporciona valores por defecto usando nullish coalescing (??)
   */
  const reports: ReportCardData[] = (data ?? []).map((report) => ({
    id: report.id,
    title: report.titulo,
    description: report.descripcion ?? "",
    category: report.categoria?.nombre ?? "Sin categoría",
    priority: report.prioridad?.nombre ?? "Sin prioridad",
    status: report.estado?.nombre ?? "Sin estado",
    location: formatLocation(report.lat, report.lon),
    author: report.autor?.username ?? "Anónimo",
    createdAt: report.created_at,
    image: report.fotos?.[0]?.url ?? null,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Sección de acciones: botón para crear nuevo reporte */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-end gap-3">
          <Button asChild size="sm">
            <Link href="/reportes/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Reporte
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Encabezado de la página */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Reportes Públicos</h2>
          <p className="text-muted-foreground">Explora todos los reportes de problemas públicos en Posadas</p>
        </div>

        {/* Sección de filtros (UI únicamente, sin funcionalidad implementada) */}
        <div className="mb-8 p-6 bg-card rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar reportes..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="vialidad">Vialidad</SelectItem>
                <SelectItem value="transito">Tránsito</SelectItem>
                <SelectItem value="alumbrado">Alumbrado</SelectItem>
                <SelectItem value="limpieza">Limpieza</SelectItem>
                <SelectItem value="seguridad">Seguridad</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="reportado">Reportado</SelectItem>
                <SelectItem value="en-progreso">En Progreso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mensaje de error si falla la consulta a Supabase */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
            <AlertDescription>Intenta nuevamente en unos minutos.</AlertDescription>
          </Alert>
        )}

        {/* Renderizado condicional: Grid de reportes, mensaje vacío, o nada si hay error */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Link key={report.id} href={`/reportes/${report.id}`} className="hover:text-primary">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      {/* Título del reporte con enlace a la página de detalle */}
                      <CardTitle className="text-lg">

                        {report.title}
                      </CardTitle>
                      {/* Badge de prioridad con color dinámico */}
                      <Badge variant={getPriorityColor(report.priority)}>{report.priority}</Badge>
                    </div>
                    {/* Ubicación del reporte */}
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {report.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Imagen del reporte con lazy loading para optimización */}
                    <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                      <img
                        src={report.image ?? "/placeholder.svg"}
                        alt={report.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Descripción con límite de 2 líneas */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{report.description}</p>
                    <div className="space-y-3">
                      {/* Badges de estado y categoría */}
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        <Badge variant="outline">{report.category}</Badge>
                      </div>
                      {/* Metadata: autor y fecha de creación */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {report.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.createdAt).toLocaleDateString("es-AR")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

            ))}
          </div>
        ) : !error ? (
          // Mensaje cuando no hay reportes y no hubo error
          <Alert className="mt-6">
            <AlertTitle>No hay reportes publicados</AlertTitle>
            <AlertDescription>
              Creá el primero para ayudar a mejorar tu comunidad.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Botón para cargar más reportes (UI únicamente, sin funcionalidad) */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Cargar Más Reportes
          </Button>
        </div>
      </div>
    </div>
  )
}
