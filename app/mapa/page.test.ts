import { beforeEach, describe, expect, it, vi } from "vitest"

import MapaPage from "./page"

const mocks = vi.hoisted(() => ({
  getReportMapData: vi.fn(),
  getEstados: vi.fn(),
}))

vi.mock("./mapa-client", () => ({ MapaClient: () => null }))
vi.mock("@/database/queries/reportes/get-reportes", () => ({
  getReportMapData: mocks.getReportMapData,
  getCategorias: async () => ({ data: [] }),
  getEstados: mocks.getEstados,
  getPrioridades: async () => ({ data: [] }),
}))

describe("MapaPage", () => {
  beforeEach(() => {
    mocks.getReportMapData.mockReset().mockResolvedValue({ data: [], error: null })
  })

  it("loads only pending reports on the map, keeping the URL filters", async () => {
    await MapaPage({ searchParams: Promise.resolve({ search: "bache", categoria: "Baches" }) })

    expect(mocks.getReportMapData).toHaveBeenCalledWith({
      search: "bache",
      categoria: "Baches",
      estado: undefined,
      prioridad: undefined,
      limite: 100,
      soloPendientes: true,
    })
  })

  it("does not offer a state filter, since every report on the map is pending", async () => {
    const page = await MapaPage({ searchParams: Promise.resolve({}) })

    expect(page.props.estados).toEqual([])
    expect(mocks.getEstados).not.toHaveBeenCalled()
  })
})
