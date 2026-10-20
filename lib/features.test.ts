import { afterEach, describe, expect, it, vi } from "vitest"

import { cuadrillasHabilitadas } from "./features"

describe("cuadrillasHabilitadas", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("is off when CUADRILLAS_ENABLED is not set, as in production", () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)

    expect(cuadrillasHabilitadas()).toBe(false)
  })

  it("is on only when CUADRILLAS_ENABLED is exactly true", () => {
    vi.stubEnv("CUADRILLAS_ENABLED", "true")
    expect(cuadrillasHabilitadas()).toBe(true)

    for (const value of ["", "false", "1", "TRUE", "yes"]) {
      vi.stubEnv("CUADRILLAS_ENABLED", value)
      expect(cuadrillasHabilitadas()).toBe(false)
    }
  })
})
