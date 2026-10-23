"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReportesSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(() => searchParams.get("search") ?? "")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const updateSearch = (nextValue: string) => {
    setValue(nextValue)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextValue.trim()) params.set("search", nextValue.trim())
      else params.delete("search")
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
    }, 250)
  }

  const clearSearch = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(event) => updateSearch(event.target.value)}
        placeholder="Buscar reportes..."
        aria-label="Buscar reportes"
        className="h-11 rounded-full border-border/70 bg-card/80 pl-11 pr-11 shadow-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
