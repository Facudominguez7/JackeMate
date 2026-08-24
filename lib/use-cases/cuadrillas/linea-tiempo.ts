import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { getHistorialEstados } from "@/database/queries/reportes/[id]/historial-estados"
import {
  listarAsignacionesDeReporte,
  listarEventosOperativosPublicos,
  listarObservacionesDeReporte,
  type AsignacionCuadrilla,
  type EventoOperativoPublico,
  type ObservacionCuadrilla,
} from "@/database/queries/cuadrillas"
import {
  ETIQUETAS_ESTADO_OPERATIVO,
  ETIQUETAS_MOTIVO_CIERRE,
  type EstadoOperativo,
  type MotivoCierre,
} from "@/lib/authz/catalog"
import { puedeOperarCuadrillas } from "@/lib/authz/roles"

/** Evento normalizado de la línea de tiempo combinada (historial ciudadano + eventos de cuadrillas) de un reporte. */
export type EventoLineaTiempo = {
  id: string
  origen: "ciudadano" | "operativo"
  tipo: "estado_reporte" | "asignacion" | "observacion" | "cierre"
  ocurridoAt: string
  titulo: string
  detalle: string | null
  cuadrillaNombre: string | null
  esInterna: boolean
  autor: string | null
}

/**
 * Combina la línea de tiempo ciudadana con la operativa en un único arreglo ordenado de más
 * reciente a más antiguo (con `id` como criterio de desempate estable). Función PURA.
 */
export function fusionarLineaTiempo(
  eventosCiudadanos: EventoLineaTiempo[],
  eventosOperativos: EventoLineaTiempo[],
): EventoLineaTiempo[] {
  return [...eventosCiudadanos, ...eventosOperativos].sort((a, b) => {
    const diferencia = new Date(b.ocurridoAt).getTime() - new Date(a.ocurridoAt).getTime()
    return diferencia !== 0 ? diferencia : b.id.localeCompare(a.id)
  })
}

async function construirEventosCiudadanos(supabase: SupabaseClient, reporteId: number): Promise<EventoLineaTiempo[]> {
  const { data } = await getHistorialEstados(supabase, String(reporteId))

  return data.map((entry) => ({
    id: `ciudadano:estado_reporte:${entry.id}`,
    origen: "ciudadano" as const,
    tipo: "estado_reporte" as const,
    ocurridoAt: entry.created_at,
    titulo: `Estado cambiado a "${entry.estado_nuevo?.nombre ?? "—"}"`,
    detalle: entry.comentario ?? null,
    cuadrillaNombre: null,
    esInterna: false,
    autor: entry.usuario?.username ?? null,
  }))
}

function eventosDeAsignaciones(asignaciones: AsignacionCuadrilla[]): EventoLineaTiempo[] {
  const eventos: EventoLineaTiempo[] = []

  for (const asignacion of asignaciones) {
    eventos.push({
      id: `operativo:asignacion:${asignacion.id}`,
      origen: "operativo",
      tipo: "asignacion",
      ocurridoAt: asignacion.createdAt,
      titulo: asignacion.cuadrillaNombre
        ? `Cuadrilla asignada: ${asignacion.cuadrillaNombre}`
        : "Cuadrilla asignada",
      detalle: null,
      cuadrillaNombre: asignacion.cuadrillaNombre,
      esInterna: false,
      autor: null,
    })

    if (asignacion.estadoOperativo === "cerrada" && asignacion.cerradaAt && asignacion.motivoCierre) {
      eventos.push({
        id: `operativo:cierre:${asignacion.id}`,
        origen: "operativo",
        tipo: "cierre",
        ocurridoAt: asignacion.cerradaAt,
        titulo: ETIQUETAS_MOTIVO_CIERRE[asignacion.motivoCierre],
        detalle: null,
        cuadrillaNombre: asignacion.cuadrillaNombre,
        esInterna: false,
        autor: null,
      })
    }
  }

  return eventos
}

function eventosDeObservaciones(observaciones: ObservacionCuadrilla[]): EventoLineaTiempo[] {
  return observaciones.map((observacion) => ({
    id: `operativo:observacion:${observacion.id}`,
    origen: "operativo",
    tipo: "observacion",
    ocurridoAt: observacion.createdAt,
    titulo: observacion.estadoOperativoResultante
      ? ETIQUETAS_ESTADO_OPERATIVO[observacion.estadoOperativoResultante]
      : "Observación registrada",
    detalle: observacion.contenido,
    cuadrillaNombre: null,
    esInterna: !observacion.observacionPublica,
    autor: observacion.autorUsername,
  }))
}

/**
 * Clasifica una fila de la vista pública `reportes_linea_tiempo_operativa_publica`.
 *
 * La vista emite `tipo_evento` como un literal cerrado (`asignacion`, `cierre`, `observacion`,
 * ver la migración `20260423110000_cuadrillas_rls_and_public_projections.sql`), así que esa
 * columna es la autoridad para el tipo. Las demás columnas solo aportan el título legible.
 * Si apareciera un `tipo_evento` desconocido se degrada a `observacion` en vez de romper.
 */
function clasificarEventoPublico(evento: EventoOperativoPublico): {
  tipo: EventoLineaTiempo["tipo"]
  titulo: string
} {
  if (evento.tipoEvento === "cierre") {
    const motivo = evento.motivoCierre as MotivoCierre | null
    return {
      tipo: "cierre",
      titulo: (motivo && ETIQUETAS_MOTIVO_CIERRE[motivo]) ?? "Intervención cerrada",
    }
  }

  if (evento.tipoEvento === "asignacion") {
    const estado = evento.estadoOperativo as EstadoOperativo | null
    return {
      tipo: "asignacion",
      titulo: (estado && ETIQUETAS_ESTADO_OPERATIVO[estado]) ?? "Cuadrilla asignada",
    }
  }

  const estado = evento.estadoOperativo as EstadoOperativo | null
  return {
    tipo: "observacion",
    titulo: (estado && ETIQUETAS_ESTADO_OPERATIVO[estado]) ?? "Observación registrada",
  }
}

function eventosOperativosPublicos(eventos: EventoOperativoPublico[]): EventoLineaTiempo[] {
  return eventos.map((evento, indice) => {
    const { tipo, titulo } = clasificarEventoPublico(evento)

    return {
      id: `operativo:${tipo}:${indice}:${evento.ocurridoAt}`,
      origen: "operativo",
      tipo,
      ocurridoAt: evento.ocurridoAt,
      titulo,
      // La vista ya filtró: `contenido` solo viene con texto cuando la observación fue
      // publicada explícitamente (`observacion_publica = true`); en cualquier otro caso
      // llega en null. Descartarlo acá dejaría al ciudadano sin ver las observaciones
      // que el operador marcó como públicas a propósito.
      detalle: evento.contenido,
      cuadrillaNombre: evento.cuadrillaNombre,
      esInterna: false,
      autor: null,
    }
  })
}

/**
 * Arma la línea de tiempo combinada (ciudadana + operativa) de un reporte. La fuente de los
 * eventos operativos se elige ACÁ según el rol, nunca en un componente: el personal que puede
 * operar cuadrillas (ADMIN, OPERADOR) lee las tablas base y ve observaciones internas,
 * nombres de autor y todos los motivos de cierre; cualquier otro usuario lee la vista pública
 * y siempre recibe `autor: null` y `esInterna: false`.
 */
export async function obtenerLineaTiempoWorkflow(
  supabase: SupabaseClient,
  reporteId: number,
  roleId: number | null,
): Promise<EventoLineaTiempo[]> {
  const eventosCiudadanos = await construirEventosCiudadanos(supabase, reporteId)

  if (puedeOperarCuadrillas(roleId)) {
    const [{ data: asignaciones }, { data: observaciones }] = await Promise.all([
      listarAsignacionesDeReporte(supabase, reporteId),
      listarObservacionesDeReporte(supabase, reporteId),
    ])

    const eventosOperativos = [...eventosDeAsignaciones(asignaciones), ...eventosDeObservaciones(observaciones)]
    return fusionarLineaTiempo(eventosCiudadanos, eventosOperativos)
  }

  const eventosPublicos = await listarEventosOperativosPublicos(supabase, reporteId)
  return fusionarLineaTiempo(eventosCiudadanos, eventosOperativosPublicos(eventosPublicos))
}
