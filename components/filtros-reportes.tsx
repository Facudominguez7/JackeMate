"use client"

import { useCallback, useEffect, useRef, useState, useTransition, type TransitionStartFunction } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter, Search, SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type FiltrosReportesProps = {
  categorias?: { id: number; nombre: string }[]
  estados?: { id: number; nombre: string }[]
  prioridades?: { id: number; nombre: string }[]
  onFilterApplied?: () => void
  externalIsPending?: boolean
  externalStartTransition?: TransitionStartFunction
  variant?: "default" | "sheet"
  titleId?: string
  onApply?: () => void
  deferUpdates?: boolean
}

const EMPTY_FILTERS = {
  search: "",
  categoria: "all",
  estado: "all",
  prioridad: "all",
} as const

type FilterChipOptionProps = {
  label: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

export function FilterChipOption({ label, selected, onSelect, disabled = false }: FilterChipOptionProps) {
  return (
    <Button
      type="button"
      variant="filter"
      size="sm"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
    >
      {label}
    </Button>
  )
}

type SheetFilterGroupProps = {
  label: string
  allLabel: string
  options: { id: number; nombre: string }[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function SheetFilterGroup({ label, allLabel, options, value, onChange, disabled = false }: SheetFilterGroupProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</h4>
        {value !== "all" && <span className="text-xs font-medium text-muted-foreground">1 seleccionado</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChipOption label={allLabel} selected={value === "all"} onSelect={() => onChange("all")} disabled={disabled} />
        {options.map((option) => {
          const optionValue = option.nombre.toLowerCase()

          return (
            <FilterChipOption
              key={option.id}
              label={option.nombre}
              selected={value === optionValue}
              onSelect={() => onChange(optionValue)}
              disabled={disabled}
            />
          )
        })}
      </div>
    </section>
  )
}

export function FiltrosReportes({
  categorias = [],
  estados = [],
  prioridades = [],
  onFilterApplied,
  externalIsPending,
  externalStartTransition,
  variant = "default",
  titleId,
  onApply,
  deferUpdates,
}: FiltrosReportesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [internalIsPending, internalStartTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(true)
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "")
  const [draftFilters, setDraftFilters] = useState(() => ({
    search: searchParams.get("search") ?? EMPTY_FILTERS.search,
    categoria: searchParams.get("categoria") ?? EMPTY_FILTERS.categoria,
    estado: searchParams.get("estado") ?? EMPTY_FILTERS.estado,
    prioridad: searchParams.get("prioridad") ?? EMPTY_FILTERS.prioridad,
  }))

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const lastSearchValueRef = useRef("")

  const isPending = externalIsPending ?? internalIsPending
  const startTransition = externalStartTransition ?? internalStartTransition
  const isSheet = variant === "sheet"
  const shouldDeferUpdates = deferUpdates ?? isSheet

  const searchValue = searchParams.get("search") ?? ""
  const categoriaValue = searchParams.get("categoria") ?? "all"
  const estadoValue = searchParams.get("estado") ?? "all"
  const prioridadValue = searchParams.get("prioridad") ?? "all"
  const hasAppliedFilters = searchValue !== "" || categoriaValue !== "all" || estadoValue !== "all" || prioridadValue !== "all"
  const hasDraftFilters =
    draftFilters.search !== EMPTY_FILTERS.search ||
    draftFilters.categoria !== EMPTY_FILTERS.categoria ||
    draftFilters.estado !== EMPTY_FILTERS.estado ||
    draftFilters.prioridad !== EMPTY_FILTERS.prioridad
  const currentSearchValue = shouldDeferUpdates ? draftFilters.search : searchValue
  const currentCategoriaValue = shouldDeferUpdates ? draftFilters.categoria : categoriaValue
  const currentEstadoValue = shouldDeferUpdates ? draftFilters.estado : estadoValue
  const currentPrioridadValue = shouldDeferUpdates ? draftFilters.prioridad : prioridadValue

  useEffect(() => {
    if (!isTypingRef.current) {
      setSearchInput(searchValue)
    }
  }, [searchValue])

  const applyParams = useCallback(
    (params: URLSearchParams, onComplete?: () => void) => {
      const queryString = params.toString()
      const href = queryString ? `${pathname}?${queryString}` : pathname

      startTransition(() => {
        router.replace(href)
        onComplete?.()
      })
    },
    [pathname, router, startTransition]
  )

  const actualizarFiltros = useCallback(
    (key: string, value: string, silent = false) => {
      if (shouldDeferUpdates) {
        setDraftFilters((prev) => ({ ...prev, [key]: value }))
        return
      }

      const params = new URLSearchParams(searchParams.toString())

      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      const navigate = () => router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)

      if (silent || key === "search") {
        navigate()
      } else {
        startTransition(navigate)
      }

      if (onFilterApplied && !silent && key !== "search") {
        setTimeout(() => onFilterApplied(), 150)
      }
    },
    [onFilterApplied, pathname, router, searchParams, shouldDeferUpdates, startTransition]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      isTypingRef.current = true
      setSearchInput(value)

      if (shouldDeferUpdates) {
        setDraftFilters((prev) => ({ ...prev, search: value }))
        return
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      debounceTimerRef.current = setTimeout(() => {
        if (value !== lastSearchValueRef.current) {
          lastSearchValueRef.current = value
          isTypingRef.current = false

          const params = new URLSearchParams(window.location.search)
          if (value) params.set("search", value)
          else params.delete("search")

          router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
        } else {
          isTypingRef.current = false
        }
      }, 300)
    },
    [pathname, router, shouldDeferUpdates]
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
    setDraftFilters({ ...EMPTY_FILTERS })

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (shouldDeferUpdates && !hasAppliedFilters) {
      return
    }

    applyParams(new URLSearchParams(), onFilterApplied)
  }, [applyParams, hasAppliedFilters, onFilterApplied, shouldDeferUpdates])

  const aplicarFiltros = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    isTypingRef.current = false
    lastSearchValueRef.current = draftFilters.search

    const params = new URLSearchParams(searchParams.toString())
    const entries = Object.entries(draftFilters)

    for (const [key, value] of entries) {
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
    }

    applyParams(params, onApply)
  }, [applyParams, draftFilters, onApply, searchParams])

  const hayFiltrosActivos = shouldDeferUpdates ? hasAppliedFilters || hasDraftFilters : hasAppliedFilters

  const contadorFiltros = [
    currentSearchValue !== "",
    currentCategoriaValue !== "all",
    currentEstadoValue !== "all",
    currentPrioridadValue !== "all",
  ].filter(Boolean).length

  return (
    <div className={isSheet ? "bg-card text-foreground" : "rounded-xl border border-border bg-card"}>
      <div className={cn("border-b border-border", isSheet ? "px-3 pb-3" : "px-4 py-4 md:px-6")}>
        <div className={cn("flex justify-between gap-3", isSheet ? "items-start" : "flex-wrap items-center")}>
        <div className="flex items-center gap-3">
          {!isSheet && <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </div>}
          <div>
            {isSheet ? (
              <DrawerTitle className="text-sm font-semibold tracking-tight md:text-base">Filtros</DrawerTitle>
            ) : (
              <h3 id={titleId} className="text-sm font-semibold tracking-tight md:text-base">Filtrar reportes</h3>
            )}
            {isSheet ? (
              <DrawerDescription className="text-xs text-muted-foreground md:text-sm">
                Filtrá reportes por categoría, estado o prioridad.
              </DrawerDescription>
            ) : (
              <p className="text-xs text-muted-foreground md:text-sm">Buscá por texto, categoría, estado o prioridad.</p>
            )}
          </div>
          {!isSheet && contadorFiltros > 0 && (
            <Badge variant="secondary">
              {contadorFiltros} activos
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSheet && hayFiltrosActivos && (
            <Button variant="secondary" size="sm" onClick={limpiarFiltros} disabled={isPending}>
              <X className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          )}

          {!isSheet && hayFiltrosActivos && (
            <Button variant="secondary" size="sm" onClick={limpiarFiltros} disabled={isPending}>
              <X className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          )}

          {!isSheet && <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="size-4" aria-hidden="true" />
            {showFilters ? "Ocultar" : "Mostrar"}
          </Button>}
        </div>
        </div>

        {isSheet && contadorFiltros > 0 && (
          <p className="pt-2 text-xs font-medium text-muted-foreground">
            {contadorFiltros} {contadorFiltros === 1 ? "filtro activo" : "filtros activos"}
          </p>
        )}
      </div>

      <div className={`${showFilters || isSheet ? "block" : "hidden"} ${isSheet ? "space-y-5 py-2" : "p-4 md:block md:p-6"}`}>
        <div className={isSheet ? "space-y-5 px-3 pb-24" : "grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]"}>
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Título, descripción o referencia"
                className="pl-10 pr-12"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isPending}
              />
              {searchInput && (
                <Button
                   type="button"
                   variant="muted"
                   size="icon-sm"
                  onClick={() => {
                    isTypingRef.current = false
                    lastSearchValueRef.current = ""
                    setSearchInput("")
                    if (shouldDeferUpdates) {
                      setDraftFilters((prev) => ({ ...prev, search: "" }))
                      return
                    }
                    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
                    const params = new URLSearchParams(window.location.search)
                    params.delete("search")
                    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {isSheet ? (
            <>
              <SheetFilterGroup
                label="Categoría"
                allLabel="Todas"
                options={categorias}
                value={currentCategoriaValue}
                onChange={(value) => actualizarFiltros("categoria", value)}
                disabled={isPending}
              />
              <SheetFilterGroup
                label="Estado"
                allLabel="Todos"
                options={estados}
                value={currentEstadoValue}
                onChange={(value) => actualizarFiltros("estado", value)}
                disabled={isPending}
              />
              <SheetFilterGroup
                label="Prioridad"
                allLabel="Todas"
                options={prioridades}
                value={currentPrioridadValue}
                onChange={(value) => actualizarFiltros("prioridad", value)}
                disabled={isPending}
              />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categoría</label>
                <Select value={currentCategoriaValue} onValueChange={(value) => actualizarFiltros("categoria", value)} disabled={isPending}>
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
                <Select value={currentEstadoValue} onValueChange={(value) => actualizarFiltros("estado", value)} disabled={isPending}>
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
                <Select value={currentPrioridadValue} onValueChange={(value) => actualizarFiltros("prioridad", value)} disabled={isPending}>
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
            </>
          )}
        </div>

        {isSheet && (
          <div className="sticky bottom-0 z-10 mt-1 border-t border-border bg-card px-3 pb-[calc(max(env(safe-area-inset-bottom),1rem))] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-5 -translate-y-full bg-gradient-to-t from-card via-card/90 to-transparent" aria-hidden="true" />
            <Button type="button" size="lg" onClick={aplicarFiltros} disabled={isPending} className="w-full">
              Aplicar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
