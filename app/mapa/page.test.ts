import { beforeEach, describe, expect, it, vi } from "vitest"

import MapaPage from "./page"

const mocks = vi.hoisted(() => ({
  getReportMapData: vi.fn(),
}))

vi.mock("./mapa-client", () => ({ MapaClient: () => null }))
vi.mock("@/database/queries/reportes/get-reportes", () => ({
  getReportMapData: mocks.getReportMapData,
  getCategorias: async () => ({ data: [] }),
  getEstados: async () => ({
    data: [
      { id: 1, nombre: "Pendiente" },
      { id: 3, nombre: "Rechazado" },
      { id: 2, nombre: "Reparado" },
    ],
  }),
  getPrioridades: async () => ({ data: [] }),
}))

describe("MapaPage", () => {
  beforeEach(() => {
    mocks.getReportMapData.mockReset().mockResolvedValue({ data: [], error: null })
  })

  it("loads the map without repaired reports, keeping the URL filters", async () => {
    await MapaPage({ searchParams: Promise.resolve({ search: "bache", categoria: "Baches" }) })

    expect(mocks.getReportMapData).toHaveBeenCalledWith({
      search: "bache",
      categoria: "Baches",
      estado: undefined,
      prioridad: undefined,
      limite: 100,
      excluirReparados: true,
    })
  })

  it("does not offer the repaired state as a map filter", async () => {
    const page = await MapaPage({ searchParams: Promise.resolve({}) })

    expect(page.props.estados).toEqual([
      { id: 1, nombre: "Pendiente" },
      { id: 3, nombre: "Rechazado" },
    ])
  })
})
