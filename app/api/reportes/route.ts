/**
 * API Route para obtener reportes con paginación
 * 
 * Permite cargar más reportes dinámicamente respetando filtros
 * GET /api/reportes?offset=12&limite=12&search=...&categoria=...&estado=...&prioridad=...
 */

import { NextRequest, NextResponse } from "next/server"
import { getReportes, type ReporteDB } from "@/database/queries/reportes/get-reportes"

/**
 * Transforma un reporte de BD al formato de UI
 */
function transformReport(report: ReporteDB) {
    return {
        id: report.id,
        title: report.titulo,
        description: report.descripcion ?? "",
        category: report.categoria?.nombre ?? "Sin categoría",
        priority: report.prioridad?.nombre ?? "Sin prioridad",
        status: report.estado?.nombre ?? "Sin estado",
        location: report.lat !== null && report.lon !== null
            ? `Lat ${report.lat.toFixed(4)}, Lon ${report.lon.toFixed(4)}`
            : "Ubicación no disponible",
        author: report.autor?.username ?? "Anónimo",
        createdAt: report.created_at,
        image: report.fotos?.[0]?.url ?? null,
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        // Extraer parámetros de la URL
        const offset = parseInt(searchParams.get("offset") ?? "0", 10)
        const limite = parseInt(searchParams.get("limite") ?? "12", 10)
        const search = searchParams.get("search") ?? undefined
        const categoria = searchParams.get("categoria") ?? undefined
        const estado = searchParams.get("estado") ?? undefined
        const prioridad = searchParams.get("prioridad") ?? undefined

        // Obtener reportes con los filtros aplicados
        const { data, error, hasMore, count } = await getReportes({
            search,
            categoria,
            estado,
            prioridad,
            limite,
            offset
        })

        if (error) {
            return NextResponse.json(
                { error: "Error al obtener reportes" },
                { status: 500 }
            )
        }

        // Transformar reportes al formato de UI
        const reports = (data ?? []).map(transformReport)

        return NextResponse.json({
            data: reports,
            hasMore,
            count,
            offset,
            limite
        })
    } catch (error) {
        console.error("Error en API /api/reportes:", error)
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
