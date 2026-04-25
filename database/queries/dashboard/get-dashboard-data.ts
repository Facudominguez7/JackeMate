import { getPuntosUsuario } from "@/database/queries/puntos"
import {
  getEstadisticasInteresado,
  getReportesPorCategoria,
  getTiempoPromedioResolucion,
  getZonasConMasReportes,
  type ReportesPorCategoria,
  type TiempoPromedioResolucion,
  type ZonaConReportes,
} from "@/database/queries/interesado"
import { getDashboardUserReports, type DashboardUserReport } from "@/database/queries/reportes/get-reportes"
import { isAnonymousUser } from "@/lib/authz/anonymous"
import { getUserRoleContext, canViewDashboard } from "@/lib/authz/roles"
import { createClient } from "@/utils/supabase/server"

export type DashboardAnalyticsData = {
  totalReportes: number
  reportesResueltos: number
  reportesPendientes: number
  reportesEnProgreso: number
  tasaResolucion: number
}

export type DashboardPageData = {
  user: {
    id: string
    email: string | null
  } | null
  isAnalyticsDashboard: boolean
  puntos: number
  userReports: DashboardUserReport[]
  estadisticas: DashboardAnalyticsData | null
  reportesPorCategoria: ReportesPorCategoria[]
  tiempoResolucion: TiempoPromedioResolucion | null
  zonasCalientes: ZonaConReportes[]
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || isAnonymousUser(user)) {
    return {
      user: null,
      isAnalyticsDashboard: false,
      puntos: 0,
      userReports: [],
      estadisticas: null,
      reportesPorCategoria: [],
      tiempoResolucion: null,
      zonasCalientes: [],
    }
  }

  const { data: roleContext } = await getUserRoleContext(supabase, user.id)
  const isAnalyticsDashboard = canViewDashboard(roleContext?.roleId)

  if (isAnalyticsDashboard) {
    const [estadisticas, reportesPorCategoria, tiempoResolucion, zonasCalientes] = await Promise.all([
      getEstadisticasInteresado(supabase),
      getReportesPorCategoria(supabase),
      getTiempoPromedioResolucion(supabase),
      getZonasConMasReportes(supabase, 10),
    ])

    return {
      user: { id: user.id, email: user.email ?? null },
      isAnalyticsDashboard: true,
      puntos: 0,
      userReports: [],
      estadisticas,
      reportesPorCategoria,
      tiempoResolucion,
      zonasCalientes,
    }
  }

  const [{ puntos }, { data: userReports }] = await Promise.all([
    getPuntosUsuario(supabase, user.id),
    getDashboardUserReports(user.id),
  ])

  return {
    user: { id: user.id, email: user.email ?? null },
    isAnalyticsDashboard: false,
    puntos,
    userReports,
    estadisticas: null,
    reportesPorCategoria: [],
    tiempoResolucion: null,
    zonasCalientes: [],
  }
}
