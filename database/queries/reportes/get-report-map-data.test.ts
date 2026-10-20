import { beforeEach, describe, expect, it, vi } from "vitest"

import { getReportMapData } from "./get-reportes"

const mocks = vi.hoisted(() => {
  const calls: unknown[][] = []
  const rows: unknown[] = []
  // Records every query builder call and resolves like a Supabase query when awaited.
  const builder: object = new Proxy(
    {},
    {
      get(_target, method) {
        if (method === "then") {
          return (resolve: (value: unknown) => void) => resolve({ data: rows, error: null })
        }
        return (...args: unknown[]) => {
          calls.push([method, ...args])
          return builder
        }
      },
    },
  )
  return { calls, rows, builder }
})

vi.mock("next/cache", () => ({ unstable_cache: (load: unknown) => load }))
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from: () => mocks.builder }) }))
vi.mock("@/utils/supabase/public", () => ({ createPublicClient: vi.fn() }))
vi.mock("@/database/queries/profiles", () => ({
  getPublicProfilesByIds: async () => ({ data: [] }),
  indexPublicProfilesById: () => new Map(),
}))
vi.mock("@/database/queries/cuadrillas", () => ({
  obtenerEstadoOperativoPublicoPorReporte: async () => new Map(),
}))

const REPARADO_ID = 2

describe("getReportMapData", () => {
  beforeEach(() => {
    mocks.calls.length = 0
    mocks.rows.length = 0
  })

  it("leaves repaired reports out of the query when asked to", async () => {
    mocks.rows.push({
      id: 7,
      usuario_id: null,
      titulo: "Bache",
      descripcion: null,
      created_at: "2026-10-01T00:00:00Z",
      lat: -27.4,
      lon: -55.9,
      categoria: null,
      prioridad: null,
      estado: { nombre: "Pendiente" },
      fotos: null,
    })

    const { data, error } = await getReportMapData({ excluirReparados: true })

    expect(mocks.calls).toContainEqual(["neq", "estado_id", REPARADO_ID])
    expect(error).toBeNull()
    expect(data.map((report) => report.id)).toEqual([7])
  })

  it("keeps every state when the exclusion is not requested", async () => {
    await getReportMapData({ estado: "Pendiente" })

    expect(mocks.calls.some(([method]) => method === "neq")).toBe(false)
    expect(mocks.calls).toContainEqual(["eq", "estado_id", 1])
  })
})
