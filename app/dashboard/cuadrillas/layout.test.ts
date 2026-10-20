import { afterEach, describe, expect, it, vi } from "vitest"

import CuadrillasLayout from "./layout"

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }))

describe("CuadrillasLayout", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    mocks.notFound.mockClear()
  })

  it("is not found while crews are turned off", () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)

    expect(() => CuadrillasLayout({ children: "panel" })).toThrow("NEXT_NOT_FOUND")
  })

  it("renders the crews panel when crews are turned on", () => {
    vi.stubEnv("CUADRILLAS_ENABLED", "true")

    expect(CuadrillasLayout({ children: "panel" })).toBe("panel")
    expect(mocks.notFound).not.toHaveBeenCalled()
  })
})
