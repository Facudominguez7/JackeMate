"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Upload, Camera, ArrowLeft, Send } from "lucide-react"
import Link from "next/link"

export default function NuevoReportePage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    images: [] as File[],
    lat: null as number | null,
    lon: null as number | null,
  })

  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [prioridades, setPrioridades] = useState<{ id: number; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [geoStatus, setGeoStatus] = useState<"pending" | "ok" | "error">("pending")

  const supabase = createClient()
  
  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        // Verificar autenticación del usuario
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setLoading(false)
          return
        }

        setUser(user)

        // Cargar categorías
        const { data: categoriasData, error: categoriasError } = await supabase
          .from('categorias')
          .select('id, nombre')
          .order('nombre')

        if (!categoriasError) {
          setCategorias(categoriasData || [])
        }

        // Cargar prioridades
        const { data: prioridadesData, error: prioridadesError } = await supabase
          .from('prioridades')
          .select('id, nombre')
          .order('nombre')

        if (!prioridadesError) {
          setPrioridades(prioridadesData || [])
        }
      } catch (error) {
        // Manejar error silenciosamente
      } finally {
        setLoading(false)
      }
    }

    checkUserAndLoadData()
  }, [])

  // Obtener ubicación automáticamente del dispositivo del usuario
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("geolocation" in navigator)) {
      setGeoStatus("error")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }))
        setGeoStatus("ok")
      },
      () => {
        setGeoStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Mantener solo una imagen como máximo
      setFormData((prev) => ({
        ...prev,
        images: [file],
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos requeridos
    if (!formData.title || !formData.description || !formData.category || !formData.priority) {
      alert("Por favor, completa todos los campos obligatorios")
      return
    }

    try {
      setLoading(true)

      // 0. Asegurarse de que el usuario tenga un perfil en la tabla profiles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Si no existe el perfil, crearlo
      if (!existingProfile) {
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'usuario',
            rol_id: 2, // 2 = ciudadano
            puntos: 0
          })

        if (profileCreateError) {
          console.error("Error al crear el perfil:", profileCreateError)
          alert("Error al crear el perfil de usuario. Por favor, contacta al administrador.")
          return
        }
      }

      // 1. Insertar el reporte en la base de datos
      const { data: reporteData, error: reporteError } = await supabase
        .from('reportes')
        .insert({
          usuario_id: user.id,
          titulo: formData.title,
          descripcion: formData.description,
          categoria_id: parseInt(formData.category),
          prioridad_id: parseInt(formData.priority),
          estado_id: 1, // 1 = Pendiente
          lat: formData.lat,
          lon: formData.lon
        })
        .select()
        .single()

      if (reporteError) {
        console.error("Error al crear el reporte:", reporteError)
        alert("Error al crear el reporte. Por favor, intenta nuevamente.")
        return
      }

      // 2. Si hay una imagen, subirla al storage y guardar la URL
      if (formData.images.length > 0) {
        const image = formData.images[0]
        const fileExt = image.name.split('.').pop()
        const fileName = `${reporteData.id}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Subir imagen al bucket 'reportes'
        const { error: uploadError } = await supabase.storage
          .from('reportes')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error("Error al subir la imagen:", uploadError)
          // El reporte ya fue creado, solo notificar del error de la imagen
          alert("Reporte creado, pero hubo un error al subir la imagen.")
        } else {
          // Obtener URL pública de la imagen
          const { data: { publicUrl } } = supabase.storage
            .from('reportes')
            .getPublicUrl(filePath)

          // Guardar la foto en la tabla fotos_reporte
          const { error: fotoError } = await supabase
            .from('fotos_reporte')
            .insert({
              reporte_id: reporteData.id,
              url: publicUrl
            })

          if (fotoError) {
            console.error("Error al guardar la URL de la foto:", fotoError)
          }
        }
      }

      alert("¡Reporte creado exitosamente!")
      
      // Redirigir a la página de reportes
      window.location.href = "/reportes"
      
    } catch (error) {
      console.error("Error inesperado:", error)
      alert("Ocurrió un error inesperado. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  // Mostrar mensaje de carga o error de autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Page actions */}
      <div className="container mx-auto px-4 pt-6 max-w-2xl">
        <Button variant="outline" asChild>
          <Link href="/reportes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Crear Nuevo Reporte</h2>
          <p className="text-muted-foreground">Ayuda a mejorar Posadas reportando problemas públicos en tu barrio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Problema</CardTitle>
            <CardDescription>Completa todos los campos para crear un reporte detallado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título del Reporte *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Bache en Av. Quaranta"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Categoría *</Label>
                  <div className="w-full">
                    <Select
                      disabled={loading}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={categorias.length > 0 ? "Selecciona una categoría" : "Cargando categorías..."} />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Prioridad *</Label>
                  <div className="w-full">
                    <Select
                      disabled={loading}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={prioridades.length > 0 ? "Nivel de urgencia" : "Cargando prioridades..."} />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {prioridades.map((prioridad) => (
                          <SelectItem key={prioridad.id} value={prioridad.id.toString()}>
                            {prioridad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location (auto) */}
              <div className="space-y-2">
                <Label>Ubicación (automática)</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {geoStatus === "ok" && (
                    <span>
                      Lat: {formData.lat?.toFixed(5)}, Lon: {formData.lon?.toFixed(5)}
                    </span>
                  )}
                  {geoStatus === "pending" && <span>Detectando ubicación…</span>}
                  {geoStatus === "error" && (
                    <span>No se pudo obtener tu ubicación. Permití el acceso al GPS.</span>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Fotografía</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sube una foto del problema</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG hasta 10MB (máximo 1 imagen)</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label htmlFor="images" className="cursor-pointer">
                          <Camera className="w-4 h-4 mr-2" />
                          Seleccionar Foto
                        </label>
                      </Button>
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={geoStatus !== "ok" || loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Enviando..." : "Enviar Reporte"}
                </Button>
                <Button type="button" variant="outline" asChild disabled={loading}>
                  <Link href="/reportes">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
