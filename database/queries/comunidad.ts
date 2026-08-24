import type { PostgrestError } from "@supabase/supabase-js"

import { getEstadisticasInteresado } from "@/database/queries/interesado/estadisticas-interesado"
import { getPublicProfilesByIds, getPublicProfilesCount, indexPublicProfilesById } from "@/database/queries/profiles"
import { createClient } from "@/utils/supabase/server"

type VisibleReport = {
  usuario_id: string | null
  estado_id: number | null
}

export type CommunityContributor = {
  id: string
  username: string
  points: number
  reports: number
}

export type CommunityPageData = {
  members: number
  totalReports: number
  solvedReports: number
  pendingReports: number
  followUpReports: number
  contributors: CommunityContributor[]
  error: PostgrestError | null
}

const EMPTY_DATA: CommunityPageData = {
  members: 0,
  totalReports: 0,
  solvedReports: 0,
  pendingReports: 0,
  followUpReports: 0,
  contributors: [],
  error: null,
}

export async function getComunidadPageData(): Promise<CommunityPageData> {
  const supabase = await createClient()

  try {
    const [{ data: reports, error: reportsError }, statistics, { count: members }] = await Promise.all([
      supabase
        .from("reportes")
        .select("usuario_id, estado_id")
        .is("deleted_at", null)
        .returns<VisibleReport[]>(),
      getEstadisticasInteresado(supabase),
      getPublicProfilesCount(supabase),
    ])

    if (reportsError) {
      console.error("Error al obtener los reportes de la comunidad:", reportsError)
      return { ...EMPTY_DATA, members: members ?? 0, error: reportsError }
    }

    const reportCounts = new Map<string, number>()
    for (const report of reports ?? []) {
      if (report.usuario_id) {
        reportCounts.set(report.usuario_id, (reportCounts.get(report.usuario_id) ?? 0) + 1)
      }
    }

    const contributorIds = [...reportCounts.keys()]
    const { data: profiles, error: profilesError } = await getPublicProfilesByIds(supabase, contributorIds)
    const profilesById = indexPublicProfilesById(profiles)

    const contributors = contributorIds
      .map((id) => {
        const profile = profilesById.get(id)
        return {
          id,
          username: profile?.username?.trim() || "Usuario",
          points: profile?.puntos ?? 0,
          reports: reportCounts.get(id) ?? 0,
        }
      })
      .sort((a, b) => b.reports - a.reports || b.points - a.points || a.id.localeCompare(b.id))
      .slice(0, 10)

    return {
      members: members ?? 0,
      totalReports: statistics.totalReportes,
      solvedReports: statistics.reportesResueltos,
      pendingReports: statistics.reportesPendientes,
      followUpReports: statistics.reportesEnProgreso,
      contributors,
      error: profilesError ?? null,
    }
  } catch (error) {
    console.error("Error al obtener los datos de la comunidad:", error)
    return EMPTY_DATA
  }
}
