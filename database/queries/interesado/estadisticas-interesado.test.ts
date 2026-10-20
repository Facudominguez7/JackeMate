import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getEstadisticasInteresado } from "./estadisticas-interesado"

const mocks = vi.hoisted(() => ({ contarReportesEnProgreso: vi.fn() }))

vi.mock("@/database/queries/cuadrillas", () => ({ contarReportesEnProgreso: mocks.contarReportesEnProgreso }))

// Every count query resolves to 4 reports, enough to tell the stats apart from their defaults.
const countQuery: object = new Proxy(
  {},
  {
    get(_target, method) {
      if (method === "then") return (resolve: (value: unknown) => void) => resolve({ count: 4, error: null })
      return () => countQuery
    },
  },
)
const supabase = { from: () => countQuery } as never

describe("getEstadisticasInteresado", () => {
  beforeEach(() => {
    mocks.contarReportesEnProgreso.mockReset().mockResolvedValue(3)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not count crew work in progress while crews are turned off", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)

    const stats = await getEstadisticasInteresado(supabase)

    expect(mocks.contarReportesEnProgreso).not.toHaveBeenCalled()
    expect(stats).toMatchObject({ totalReportes: 4, reportesPendientes: 4, reportesEnProgreso: 0 })
  })

  it("counts crew work in progress when crews are turned on", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", "true")

    const stats = await getEstadisticasInteresado(supabase)

    expect(stats.reportesEnProgreso).toBe(3)
  })
})
