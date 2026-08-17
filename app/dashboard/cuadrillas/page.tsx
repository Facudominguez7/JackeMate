import { redirect } from "next/navigation"

import { PanelCuadrillas } from "@/components/cuadrillas/panel-cuadrillas"
import { Badge } from "@/components/ui/badge"
import {
  listarAsignacionesAbiertasConReporte,
  listarColaCierreAdministrativo,
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

  const [cuadrillasResultado, asignacionesResultado, reportesResultado, colaCierreResultado, mapaResultado] =
    await Promise.all([
      listarCuadrillas(supabase),
      listarAsignacionesAbiertasConReporte(supabase),
      listarReportesAsignables(supabase),
      listarColaCierreAdministrativo(supabase),
      // Se reutiliza la misma consulta que alimenta `/mapa` en lugar de crear una query
      // paralela: ya devuelve exactamente la forma que consume `MapContainer`.
      getReportMapData({ estado: "Pendiente" }),
    ])

  const cuadrillas = cuadrillasResultado.data
  const cuadrillasActivas = cuadrillas.filter((cuadrilla) => cuadrilla.activa).length
  const asignaciones = asignacionesResultado.data
  const reportesAsignables = reportesResultado.data
  const colaCierre = colaCierreResultado.data

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

  // Para la cola de cierre y para los reportes sin asignar el cálculo no depende de una
  // asignación abierta, así que se resuelve una sola vez.
  const accionesSinAsignacion = calcularAccionesDisponibles({
    roleId,
    estadoReporteId: 1,
    reporteEliminado: false,
    asignacionAbierta: null,
  })

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        {/*
          El padding del panel lo aporta `page-hero-grid`, no `page-hero-panel` (que solo pone
          borde, radio y fondo). Sin el grid el contenido queda pegado al borde de la tarjeta.
        */}
        <section className="page-hero-panel">
          <div className="page-hero-grid lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div className="section-stack">
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-eyebrow">Gestión operativa</span>
                <Badge variant="admin">Cuadrillas</Badge>
              </div>
              {/* `section-title` en lugar de `hero-title`: esto es un panel interno, no una portada. */}
              <h1 className="section-title max-w-2xl">Cuadrillas municipales y seguimiento de intervenciones</h1>
              <p className="section-copy">
                Administrá el catálogo de cuadrillas, asigná reportes pendientes y seguí el avance de cada
                intervención hasta su cierre.
              </p>
            </div>

            <div className="page-meta-grid sm:grid-cols-2 xl:grid-cols-2">
              <div className="page-meta-card">
                <p className="page-meta-label">Cuadrillas activas</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{cuadrillasActivas}</p>
              </div>
              <div className="page-meta-card">
                <p className="page-meta-label">Intervenciones abiertas</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{asignaciones.length}</p>
              </div>
              <div className="page-meta-card">
                <p className="page-meta-label">Sin asignar</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{reportesAsignables.length}</p>
              </div>
              <div className="page-meta-card">
                <p className="page-meta-label">Esperando cierre</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{colaCierre.length}</p>
              </div>
            </div>
          </div>
        </section>

        <PanelCuadrillas
          cuadrillas={cuadrillas}
          abiertasPorCuadrilla={Object.fromEntries(abiertasPorCuadrilla)}
          asignaciones={asignaciones}
          accionesPorAsignacion={accionesPorAsignacion}
          reportesAsignables={reportesAsignables}
          reportesEnMapa={reportesEnMapa}
          cuadrillasOcupadas={cuadrillasOcupadas}
          colaCierre={colaCierre}
          accionesSinAsignacion={accionesSinAsignacion}
          puedeGestionarCatalogo={puedeGestionarCuadrillas(roleId)}
        />
      </div>
    </div>
  )
}
