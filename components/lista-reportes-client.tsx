"use client"

/**
 * Componente cliente para la lista de reportes con funcionalidad "Cargar Más"
 * 
 * Maneja el estado de los reportes y permite cargar más vía API
 * respetando los filtros activos en la URL
 */

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ReportCard } from "@/components/report-card"
import { Loader2 } from "lucide-react"

export type ReportCardData = {
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

type ListaReportesClientProps = {
    initialReports: ReportCardData[]
    initialHasMore: boolean
}

/**
 * Lista de reportes con paginación infinita
 * 
 * @param initialReports - Reportes iniciales obtenidos del servidor (SSR)
 * @param initialHasMore - Indica si hay más reportes para cargar
 */
export function ListaReportesClient({
    initialReports,
    initialHasMore
}: ListaReportesClientProps) {
    const searchParams = useSearchParams()
    const [reports, setReports] = useState<ReportCardData[]>(initialReports)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoading, setIsLoading] = useState(false)
    const [offset, setOffset] = useState(initialReports.length)

    // Resetear cuando cambian los filtros (los searchParams cambian)
    useEffect(() => {
        setReports(initialReports)
        setHasMore(initialHasMore)
        setOffset(initialReports.length)
    }, [initialReports, initialHasMore, searchParams])

    /**
     * Cargar más reportes desde la API
     */
    const cargarMas = useCallback(async () => {
        if (isLoading || !hasMore) return

        setIsLoading(true)

        try {
            // Construir URL con los filtros actuales
            const params = new URLSearchParams()
            params.set("offset", offset.toString())
            params.set("limite", "12")

            // Pasar los filtros activos
            const search = searchParams.get("search")
            const categoria = searchParams.get("categoria")
            const estado = searchParams.get("estado")
            const prioridad = searchParams.get("prioridad")

            if (search) params.set("search", search)
            if (categoria) params.set("categoria", categoria)
            if (estado) params.set("estado", estado)
            if (prioridad) params.set("prioridad", prioridad)

            const response = await fetch(`/api/reportes?${params.toString()}`)

            if (!response.ok) {
                throw new Error("Error al cargar reportes")
            }

            const result = await response.json()

            // Agregar nuevos reportes a la lista existente
            setReports(prev => [...prev, ...result.data])
            setHasMore(result.hasMore)
            setOffset(prev => prev + result.data.length)
        } catch (error) {
            console.error("Error al cargar más reportes:", error)
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, hasMore, offset, searchParams])

    return (
        <>
            {/* Grid de reportes */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            id={report.id}
                            titulo={report.title}
                            descripcion={report.description}
                            categoria={report.category}
                            prioridad={report.priority}
                            estado={report.status}
                            imageUrl={report.image}
                            createdAt={report.createdAt}
                            autor={report.author}
                        />
                    ))}
                </div>
            )}

            {/* Botón para cargar más reportes */}
            {reports.length > 0 && (
                <div className="text-center mt-12">
                    {hasMore ? (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={cargarMas}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                "Cargar Más Reportes"
                            )}
                        </Button>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No hay más reportes para mostrar
                        </p>
                    )}
                </div>
            )}
        </>
    )
}
