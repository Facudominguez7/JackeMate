import { redirect } from "next/navigation"

import { PanelCuadrillas } from "@/components/cuadrillas/panel-cuadrillas"
import {
  listarAsignacionesAbiertasConReporte,
  listarCuadrillas,
  listarReportesAsignables,
} from "@/database/queries/cuadrillas"
import { getReportMapData } from "@/database/queries/reportes/get-reportes"
import { getUserRoleContext, puedeGestionarCuadrillas, puedeOperarCuadrillas } from "@/lib/authz/roles"
import { calcularAccionesDisponibles } from "@/lib/use-cases/cuadrillas"
import { createClient } from "@/utils/supabase/server"

/**
 * Panel de gestión operativa de cuadrillas municipales.
 *
 * Server Component: resuelve la sesión y el rol antes de renderizar nada. Esta guarda es
 * deliberadamente redundante con la del middleware (`utils/supabase/middleware.ts`): el
 * middleware puede no ejecutarse en todos los escenarios de caché o navegación cliente, así
 * que la autorización se vuelve a verificar acá contra `profiles.rol_id`.
 */
export default async function CuadrillasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const { data: contextoRol } = await getUserRoleContext(supabase, user.id)
  const roleId = contextoRol?.roleId ?? null

  if (!puedeOperarCuadrillas(roleId)) {
    redirect("/dashboard")
  }

  const [cuadrillasResultado, asignacionesResultado, reportesResultado, mapaResultado] = await Promise.all([
    listarCuadrillas(supabase),
    listarAsignacionesAbiertasConReporte(supabase),
    listarReportesAsignables(supabase),
    // Se reutiliza la misma consulta que alimenta `/mapa` en lugar de crear una query
    // paralela: ya devuelve exactamente la forma que consume `MapContainer`.
    getReportMapData({ estado: "Pendiente" }),
  ])

  const cuadrillas = cuadrillasResultado.data
  const asignaciones = asignacionesResultado.data
  const reportesAsignables = reportesResultado.data

  // Al mapa van TODOS los reportes pendientes con coordenadas, no solo los asignables: el
  // operador necesita ver qué zonas ya están cubiertas para decidir. Cada ítem trae adjunto su
  // `estadoOperativo` y `cuadrillaNombre` (los adjunta `adjuntarEstadoOperativo` leyendo la
  // vista pública), así que el panel distingue asignados de libres con el dato que ya viaja.
  const reportesEnMapa = mapaResultado.data ?? []

  // Qué cuadrilla está ocupada y en qué reporte, para avisarlo en el selector antes de que el
  // operador intente una asignación que el índice único va a rechazar.
  const cuadrillasOcupadas = Object.fromEntries(
    asignaciones.map((asignacion) => [
      asignacion.cuadrillaId,
      { reporteId: asignacion.reporteId, reporteTitulo: asignacion.reporteTitulo },
    ]),
  )

  // El conteo de trabajos abiertos por cuadrilla se deriva de las asignaciones ya leídas
  // cuando alcanza; para las cuadrillas sin asignación en esa lista el conteo es 0, así que
  // no hace falta una consulta por cuadrilla.
  const abiertasPorCuadrilla = new Map<number, number>()
  for (const asignacion of asignaciones) {
    abiertasPorCuadrilla.set(asignacion.cuadrillaId, (abiertasPorCuadrilla.get(asignacion.cuadrillaId) ?? 0) + 1)
  }

  // Las acciones disponibles se calculan en el servidor con la misma función pura que los
  // workflows reinvocan antes de mutar: la interfaz nunca decide permisos por su cuenta.
  const accionesPorAsignacion = Object.fromEntries(
    asignaciones.map((asignacion) => [
      asignacion.id,
      calcularAccionesDisponibles({
        roleId,
        estadoReporteId: asignacion.reporteEstadoId,
        reporteEliminado: asignacion.reporteEliminado,
        asignacionAbierta: asignacion,
      }),
    ]),
  )

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        {/*
          Sin encabezado ni tarjetas de métricas: esta es una pantalla de trabajo y el operador
          entra directo a operar. El titulo y los contadores solo empujaban el mapa fuera de la
          primera pantalla, obligando a hacer scroll antes de poder hacer nada.
        */}
        <PanelCuadrillas
          cuadrillas={cuadrillas}
          abiertasPorCuadrilla={Object.fromEntries(abiertasPorCuadrilla)}
          asignaciones={asignaciones}
          accionesPorAsignacion={accionesPorAsignacion}
          reportesAsignables={reportesAsignables}
          reportesEnMapa={reportesEnMapa}
          cuadrillasOcupadas={cuadrillasOcupadas}
          puedeGestionarCatalogo={puedeGestionarCuadrillas(roleId)}
        />
      </div>
    </div>
  )
}
