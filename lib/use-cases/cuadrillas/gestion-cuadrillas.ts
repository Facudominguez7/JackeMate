import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import {
  actualizarCuadrilla,
  cambiarActivacionCuadrilla,
  contarAsignacionesAbiertasDeCuadrilla,
  crearCuadrilla,
  obtenerCuadrilla,
  type Cuadrilla,
} from "@/database/queries/cuadrillas"
import { isDuplicateRowError } from "@/lib/use-cases/reportes/detail-mutations"

import { asegurarGestorDeCuadrillas, type ResultadoAccion } from "./guardias"

type DatosCuadrilla = {
  nombre: string
  descripcion?: string | null
  telefono?: string | null
}

/**
 * Da de alta una cuadrilla nueva en el catálogo. Requiere permisos de gestión de cuadrillas.
 */
export async function crearCuadrillaWorkflow(
  supabase: SupabaseClient,
  actorUserId: string,
  datos: DatosCuadrilla,
): Promise<ResultadoAccion<Cuadrilla>> {
  const guardia = await asegurarGestorDeCuadrillas(supabase, actorUserId)
  if (!guardia.success) {
    return guardia
  }

  const { data, error } = await crearCuadrilla(supabase, datos)

  if (isDuplicateRowError(error)) {
    return { success: false, error: "Ya existe una cuadrilla con ese nombre." }
  }

  if (error || !data) {
    return { success: false, error: "No pudimos crear la cuadrilla." }
  }

  return { success: true, data }
}

/**
 * Actualiza los datos de una cuadrilla existente. Requiere permisos de gestión de cuadrillas.
 */
export async function actualizarCuadrillaWorkflow(
  supabase: SupabaseClient,
  actorUserId: string,
  cuadrillaId: number,
  datos: DatosCuadrilla,
): Promise<ResultadoAccion<Cuadrilla>> {
  const guardia = await asegurarGestorDeCuadrillas(supabase, actorUserId)
  if (!guardia.success) {
    return guardia
  }

  const { data, error } = await actualizarCuadrilla(supabase, cuadrillaId, datos)

  if (isDuplicateRowError(error)) {
    return { success: false, error: "Ya existe una cuadrilla con ese nombre." }
  }

  if (error || !data) {
    return { success: false, error: "No pudimos actualizar la cuadrilla." }
  }

  return { success: true, data }
}

/**
 * Activa o desactiva una cuadrilla. Antes de desactivar, verifica que no tenga asignaciones
 * abiertas: no se puede dejar sin cuadrilla activa un trabajo en curso.
 */
export async function cambiarActivacionCuadrillaWorkflow(
  supabase: SupabaseClient,
  actorUserId: string,
  cuadrillaId: number,
  activa: boolean,
): Promise<ResultadoAccion<Cuadrilla>> {
  const guardia = await asegurarGestorDeCuadrillas(supabase, actorUserId)
  if (!guardia.success) {
    return guardia
  }

  if (!activa) {
    const { count, error: countError } = await contarAsignacionesAbiertasDeCuadrilla(supabase, cuadrillaId)

    if (countError) {
      return { success: false, error: "No pudimos verificar las asignaciones abiertas de la cuadrilla." }
    }

    if (count > 0) {
      return { success: false, error: "No podés desactivar una cuadrilla con asignaciones abiertas." }
    }
  }

  const { data, error } = await cambiarActivacionCuadrilla(supabase, cuadrillaId, activa)

  if (error) {
    return { success: false, error: "No pudimos actualizar el estado de la cuadrilla." }
  }

  if (data) {
    return { success: true, data }
  }

  // 0 filas puede significar "ya estaba en ese estado": releemos para devolver el dato actual.
  const actual = await obtenerCuadrilla(supabase, cuadrillaId)

  if (!actual.data) {
    return { success: false, error: "No encontramos la cuadrilla." }
  }

  return { success: true, data: actual.data }
}
