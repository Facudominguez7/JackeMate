import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { asegurarGestorDeCuadrillas, asegurarOperadorDeCuadrillas } from "./guardias"

const mocks = vi.hoisted(() => ({ getUserRoleContext: vi.fn() }))

vi.mock("@/lib/authz/roles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/authz/roles")>()),
  getUserRoleContext: mocks.getUserRoleContext,
}))

const supabase = {} as never
const OPERADOR = 4

describe("crew guards", () => {
  beforeEach(() => {
    mocks.getUserRoleContext.mockReset().mockResolvedValue({ data: { roleId: OPERADOR }, error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("refuse every crew action while crews are turned off", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)

    for (const guard of [asegurarGestorDeCuadrillas, asegurarOperadorDeCuadrillas]) {
      await expect(guard(supabase, "user-1")).resolves.toEqual({
        success: false,
        error: "La gestión de cuadrillas no está disponible.",
      })
    }
    expect(mocks.getUserRoleContext).not.toHaveBeenCalled()
  })

  it("still allow an operator when crews are turned on", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", "true")

    await expect(asegurarGestorDeCuadrillas(supabase, "user-1")).resolves.toEqual({ success: true, data: OPERADOR })
    await expect(asegurarOperadorDeCuadrillas(supabase, "user-1")).resolves.toEqual({ success: true, data: OPERADOR })
  })
})
