/**
 * Componente de filtros para reportes
 * 
 * Client Component que maneja los filtros de búsqueda y categorización
 * Usa searchParams de Next.js para sincronizar con la URL
 */

"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, SlidersHorizontal } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition, useState } from "react"

type FiltrosReportesProps = {
  categorias?: { id: number; nombre: string }[]
  estados?: { id: number; nombre: string }[]
  prioridades?: { id: number; nombre: string }[]
  onFilterApplied?: () => void
}

/**
 * Renders a responsive filter panel for report lists and keeps filter state synchronized with the URL query string.
 *
 * The component reads initial filter values from the current URL, updates query parameters when filters change,
 * supports clearing all filters, shows an active-filter count, and displays a loading state while applying updates.
 *
 * @param categorias - Array of category objects ({ id, nombre }) used to populate the "Categoría" select.
 * @param estados - Array of state objects ({ id, nombre }) used to populate the "Estado" select.
 * @param prioridades - Array of priority objects ({ id, nombre }) used to populate the "Prioridad" select.
 * @param onFilterApplied - Optional callback invoked after a filter change is applied.
 * @returns The filter panel UI element that syncs its controls (search, category, state, priority) with the URL.
 */
export function FiltrosReportes({ categorias = [], estados = [], prioridades = [], onFilterApplied }: FiltrosReportesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(true)

  // Obtener valores actuales de los filtros desde la URL
  const searchValue = searchParams.get("search") ?? ""
  const categoriaValue = searchParams.get("categoria") ?? "all"
  const estadoValue = searchParams.get("estado") ?? "all"
  const prioridadValue = searchParams.get("prioridad") ?? "all"

  /**
   * Actualiza los parámetros de búsqueda en la URL
   */
  const actualizarFiltros = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })

      // Llamar al callback después de aplicar el filtro
      if (onFilterApplied) {
        onFilterApplied()
      }
    },
    [pathname, router, searchParams, onFilterApplied]
  )

  /**
   * Limpia todos los filtros activos
   */
  const limpiarFiltros = useCallback(() => {
    startTransition(() => {
      router.replace(pathname)
    })
  }, [pathname, router])

  // Verificar si hay filtros activos
  const hayFiltrosActivos = searchValue !== "" || categoriaValue !== "all" || estadoValue !== "all" || prioridadValue !== "all"
  
  // Contar filtros activos
  const contadorFiltros = [
    searchValue !== "",
    categoriaValue !== "all",
    estadoValue !== "all",
    prioridadValue !== "all"
  ].filter(Boolean).length

  return (
    <div className="mb-6 bg-gradient-to-br from-card to-card/50 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
      {/* Encabezado de filtros */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Filtros de Búsqueda</h3>
          </div>
          {contadorFiltros > 0 && (
            <Badge variant="default" className="h-6 px-2 text-xs font-medium">
              {contadorFiltros} activo{contadorFiltros > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hayFiltrosActivos && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
              disabled={isPending}
              className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Limpiar todo
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 w-8 p-0 md:hidden"
          >
            <Filter className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Contenedor de filtros */}
      <div className={`transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100 overflow-hidden'}`}>
        <div className="p-6 space-y-4">
          {/* Búsqueda de texto - Destacada */}
          <div className="relative group">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Búsqueda por texto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-hover:text-primary" />
              <Input
                placeholder="Buscar en título o descripción..."
                className="pl-10 h-11 border-2 focus:border-primary transition-all bg-background/50 hover:bg-background"
                value={searchValue}
                onChange={(e) => actualizarFiltros("search", e.target.value)}
                disabled={isPending}
              />
              {searchValue && (
                <button
                  onClick={() => actualizarFiltros("search", "")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de categoría */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Categoría
              </label>
              <Select
                value={categoriaValue}
                onValueChange={(value) => actualizarFiltros("categoria", value)}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 border-2 focus:border-primary transition-all bg-background/50 hover:bg-background">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">
                    📋 Todas las categorías
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nombre.toLowerCase()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de estado */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Estado
              </label>
              <Select
                value={estadoValue}
                onValueChange={(value) => actualizarFiltros("estado", value)}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 border-2 focus:border-primary transition-all bg-background/50 hover:bg-background">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">
                    🔄 Todos los estados
                  </SelectItem>
                  {estados.map((est) => (
                    <SelectItem key={est.id} value={est.nombre.toLowerCase()}>
                      {est.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de prioridad */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Prioridad
              </label>
              <Select
                value={prioridadValue}
                onValueChange={(value) => actualizarFiltros("prioridad", value)}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 border-2 focus:border-primary transition-all bg-background/50 hover:bg-background">
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">
                    ⚡ Todas las prioridades
                  </SelectItem>
                  {prioridades.map((pri) => (
                    <SelectItem key={pri.id} value={pri.nombre.toLowerCase()}>
                      {pri.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Indicador de carga */}
      {isPending && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2">Aplicando filtros...</span>
          </div>
        </div>
      )}
    </div>
  )
}