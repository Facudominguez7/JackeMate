"use client"

import { useCallback, useEffect, useRef, useState, useTransition, type TransitionStartFunction } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter, Search, SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FiltrosReportesProps = {
  categorias?: { id: number; nombre: string }[]
  estados?: { id: number; nombre: string }[]
  prioridades?: { id: number; nombre: string }[]
  onFilterApplied?: () => void
  externalIsPending?: boolean
  externalStartTransition?: TransitionStartFunction
}

export function FiltrosReportes({
  categorias = [],
  estados = [],
  prioridades = [],
  onFilterApplied,
  externalIsPending,
  externalStartTransition,
}: FiltrosReportesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [internalIsPending, internalStartTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(true)
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "")

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const lastSearchValueRef = useRef("")

  const isPending = externalIsPending ?? internalIsPending
  const startTransition = externalStartTransition ?? internalStartTransition

  const searchValue = searchParams.get("search") ?? ""
  const categoriaValue = searchParams.get("categoria") ?? "all"
  const estadoValue = searchParams.get("estado") ?? "all"
  const prioridadValue = searchParams.get("prioridad") ?? "all"

  useEffect(() => {
    if (!isTypingRef.current) {
      setSearchInput(searchValue)
    }
  }, [searchValue])

  const actualizarFiltros = useCallback(
    (key: string, value: string, silent = false) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      const navigate = () => router.replace(`${pathname}?${params.toString()}`)

      if (silent || key === "search") {
        navigate()
      } else {
        startTransition(navigate)
      }

      if (onFilterApplied && !silent && key !== "search") {
        setTimeout(() => onFilterApplied(), 150)
      }
    },
    [onFilterApplied, pathname, router, searchParams, startTransition]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      isTypingRef.current = true
      setSearchInput(value)

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      debounceTimerRef.current = setTimeout(() => {
        if (value !== lastSearchValueRef.current) {
          lastSearchValueRef.current = value
          isTypingRef.current = false

          const params = new URLSearchParams(window.location.search)
          if (value) params.set("search", value)
          else params.delete("search")

          router.replace(`${pathname}?${params.toString()}`)
        } else {
          isTypingRef.current = false
        }
      }, 300)
    },
    [pathname, router]
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const limpiarFiltros = useCallback(() => {
    isTypingRef.current = false
    lastSearchValueRef.current = ""
    setSearchInput("")

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    startTransition(() => {
      router.replace(pathname)
    })
  }, [pathname, router, startTransition])

  const hayFiltrosActivos =
    searchValue !== "" || categoriaValue !== "all" || estadoValue !== "all" || prioridadValue !== "all"

  const contadorFiltros = [searchValue !== "", categoriaValue !== "all", estadoValue !== "all", prioridadValue !== "all"].filter(Boolean).length

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-[var(--surface-subtle)] text-foreground">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight md:text-base">Filtrar reportes</h3>
            <p className="text-xs text-muted-foreground md:text-sm">Buscá por texto, categoría, estado o prioridad.</p>
          </div>
          {contadorFiltros > 0 && <Badge variant="secondary">{contadorFiltros} activos</Badge>}
        </div>

        <div className="flex items-center gap-2">
          {hayFiltrosActivos && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros} disabled={isPending}>
              <X className="size-4" />
              Limpiar
            </Button>
          )}

          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="size-4" />
            {showFilters ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
      </div>

      <div className={`${showFilters ? "block" : "hidden"} p-4 md:block md:p-6`}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Título, descripción o referencia"
                className="pl-10 pr-10"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isPending}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    isTypingRef.current = false
                    lastSearchValueRef.current = ""
                    setSearchInput("")
                    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
                    const params = new URLSearchParams(window.location.search)
                    params.delete("search")
                    router.replace(`${pathname}?${params.toString()}`)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categoría</label>
            <Select value={categoriaValue} onValueChange={(value) => actualizarFiltros("categoria", value)} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre.toLowerCase()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estado</label>
            <Select value={estadoValue} onValueChange={(value) => actualizarFiltros("estado", value)} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {estados.map((item) => (
                  <SelectItem key={item.id} value={item.nombre.toLowerCase()}>
                    {item.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prioridad</label>
            <Select value={prioridadValue} onValueChange={(value) => actualizarFiltros("prioridad", value)} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                {prioridades.map((item) => (
                  <SelectItem key={item.id} value={item.nombre.toLowerCase()}>
                    {item.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
