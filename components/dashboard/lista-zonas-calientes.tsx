"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZonaConReportes } from "@/database/queries/interesado"
import { MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ZONE_COLORS = [
  "var(--map-heat-high)",
  "var(--semantic-warning)",
  "var(--semantic-info)",
  "var(--foreground)",
]

type Props = {
  zonas: ZonaConReportes[]
}

/**
 * Componente que muestra un gráfico de barras horizontales con las zonas que tienen más reportes.
 * 
 * @param zonas - Array de zonas con coordenadas y cantidad de reportes
 */
export function GraficoZonasCalientes({ zonas }: Props) {
  if (!zonas || zonas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zonas con Más Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay datos disponibles
          </p>
        </CardContent>
      </Card>
    )
  }

  // Preparar datos para el gráfico
  const data = zonas.map((zona, index) => ({
    nombre: `Zona ${index + 1}`,
    cantidad: zona.cantidad,
    coordenadas: `${zona.lat.toFixed(4)}, ${zona.lon.toFixed(4)}`,
    color: ZONE_COLORS[index % ZONE_COLORS.length]
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3">
          <p className="font-semibold text-sm mb-1">{data.nombre}</p>
          <p className="text-xs text-muted-foreground mb-1">
            {data.coordenadas}
          </p>
          <p className="text-sm font-bold text-primary">
            {data.cantidad} {data.cantidad === 1 ? 'reporte' : 'reportes'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Zonas con Más Reportes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              className="text-xs"
              label={{ value: 'Cantidad de Reportes', position: 'insideBottom', offset: -5, className: 'text-xs' }}
            />
            <YAxis 
              type="category" 
              dataKey="nombre" 
              className="text-xs"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="cantidad" 
              radius={[0, 8, 8, 0]}
              label={{ position: 'right', className: 'text-xs font-semibold' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--map-heat-high)" }}></div>
            <span>Top 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--semantic-warning)" }}></div>
            <span>Top 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--semantic-info)" }}></div>
            <span>Top 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--foreground)" }}></div>
            <span>Otras zonas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mantener compatibilidad con el nombre anterior
export const ListaZonasCalientes = GraficoZonasCalientes
