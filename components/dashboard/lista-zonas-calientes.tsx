"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZonaConReportes } from "@/database/queries/interesado"
import { MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
    color: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : index === 2 ? '#eab308' : '#3b82f6'
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
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
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Top 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Top 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>Top 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Otras zonas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mantener compatibilidad con el nombre anterior
export const ListaZonasCalientes = GraficoZonasCalientes
