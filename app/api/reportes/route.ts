/**
 * API Route para obtener reportes con paginación
 * 
 * Permite cargar más reportes dinámicamente respetando filtros
 * GET /api/reportes?offset=12&limite=12&search=...&categoria=...&estado=...&prioridad=...
 */

import { NextRequest, NextResponse } from "next/server"
import { getReportCardData } from "@/database/queries/reportes/get-reportes"

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
        const { data, error, hasMore, count } = await getReportCardData({
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

        return NextResponse.json({
            data,
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
