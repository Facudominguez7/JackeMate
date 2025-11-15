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
import { useCallback, useTransition, useState, useEffect, useRef, type TransitionStartFunction } from "react"

type FiltrosReportesProps = {
  categorias?: { id: number; nombre: string }[]
  estados?: { id: number; nombre: string }[]
  prioridades?: { id: number; nombre: string }[]
  onFilterApplied?: () => void
  externalIsPending?: boolean
  externalStartTransition?: TransitionStartFunction
}

/**
 * Panel de controles para filtrar reportes sincronizado con los parámetros de la URL.
 *
 * Sincroniza los valores de filtros (`search`, `categoria`, `estado`, `prioridad`) con los query params,
 * permite aplicar y limpiar filtros, gestiona un input de búsqueda con debounce y usa transiciones para las actualizaciones
 * de URL. Invoca `onFilterApplied` tras aplicar filtros distintos de la búsqueda cuando se proporciona.
 *
 * @param categorias - Array de categorías disponibles ({ id, nombre }) para poblar el selector de categoría.
 * @param estados - Array de estados disponibles ({ id, nombre }) para poblar el selector de estado.
 * @param prioridades - Array de prioridades disponibles ({ id, nombre }) para poblar el selector de prioridad.
 * @param onFilterApplied - Callback opcional que se invoca después de aplicar un filtro distinto de la búsqueda.
 * @param externalIsPending - Indicador externo opcional de estado pendiente; si se proporciona, se usa en lugar del interno.
 * @param externalStartTransition - Función externa opcional para iniciar transiciones; si se proporciona, se usa en lugar de la interna.
 * @returns El elemento React que renderiza la interfaz de filtros.
 */
export function FiltrosReportes({ 
  categorias = [], 
  estados = [], 
  prioridades = [], 
  onFilterApplied,
  externalIsPending,
  externalStartTransition 
}: FiltrosReportesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [internalIsPending, internalStartTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(true)
  
  // Usar el isPending y startTransition externos si están disponibles, sino usar los internos
  const isPending = externalIsPending ?? internalIsPending
  const startTransition = externalStartTransition ?? internalStartTransition
  
  // Estado local para el input de búsqueda (para debounce)
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const lastSearchValueRef = useRef("")

  // Obtener valores actuales de los filtros desde la URL
  const searchValue = searchParams.get("search") ?? ""
  const categoriaValue = searchParams.get("categoria") ?? "all"
  const estadoValue = searchParams.get("estado") ?? "all"
  const prioridadValue = searchParams.get("prioridad") ?? "all"

  // Sincronizar el estado local con el valor de la URL solo cuando NO estamos escribiendo
  useEffect(() => {
    if (!isTypingRef.current) {
      setSearchInput(searchValue)
    }
  }, [searchValue])

  /**
   * Actualiza los parámetros de búsqueda en la URL
   */
  const actualizarFiltros = useCallback(
    (key: string, value: string, silent = false) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Solo usar startTransition para filtros que NO son búsqueda (para evitar indicador de carga)
      if (silent || key === "search") {
        router.replace(`${pathname}?${params.toString()}`)
      } else {
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`)
        })
      }

      // Llamar al callback después de aplicar el filtro con un pequeño delay
      // para dar tiempo a que el select se cierre correctamente
      // NO cerrar el panel cuando es búsqueda de texto
      if (onFilterApplied && !silent && key !== "search") {
        setTimeout(() => {
          onFilterApplied()
        }, 150)
      }
    },
    [pathname, router, searchParams, onFilterApplied]
  )

  /**
   * Maneja el cambio en el input de búsqueda con debounce
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      // Marcar que estamos escribiendo
      isTypingRef.current = true
      
      // Actualizar el estado local inmediatamente para una UI responsiva
      setSearchInput(value)

      // Limpiar el timer anterior si existe
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Crear un nuevo timer para actualizar la URL después de 300ms
      debounceTimerRef.current = setTimeout(() => {
        // Solo actualizar si el valor cambió realmente
        if (value !== lastSearchValueRef.current) {
          lastSearchValueRef.current = value
          isTypingRef.current = false
          
          const params = new URLSearchParams(window.location.search)
          
          if (value && value !== "") {
            params.set("search", value)
          } else {
            params.delete("search")
          }
          
          router.replace(`${pathname}?${params.toString()}`)
        } else {
          isTypingRef.current = false
        }
      }, 300)
    },
    [pathname, router]
  )

  /**
   * Limpia el timer cuando el componente se desmonta
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Limpia todos los filtros activos
   */
  const limpiarFiltros = useCallback(() => {
    // Limpiar también el estado local del input
    isTypingRef.current = false
    lastSearchValueRef.current = ""
    setSearchInput("")
    
    // Limpiar el timer de debounce si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
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
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isPending}
              />
              {searchInput && (
                <button
                  onClick={() => {
                    isTypingRef.current = false
                    lastSearchValueRef.current = ""
                    setSearchInput("")
                    
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current)
                    }
                    
                    const params = new URLSearchParams(window.location.search)
                    params.delete("search")
                    router.replace(`${pathname}?${params.toString()}`)
                  }}
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
    </div>
  )
}