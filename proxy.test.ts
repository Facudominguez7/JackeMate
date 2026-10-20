import { NextRequest, NextResponse } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { proxy } from "./proxy"

const mocks = vi.hoisted(() => ({ updateSession: vi.fn() }))

vi.mock("@/utils/supabase/middleware", () => ({ updateSession: mocks.updateSession }))

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:3000"))

describe("proxy", () => {
  beforeEach(() => {
    mocks.updateSession.mockReset().mockResolvedValue(NextResponse.next())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("answers the crews routes with a real 404 while crews are turned off", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)

    for (const path of ["/dashboard/cuadrillas", "/dashboard/cuadrillas/algo"]) {
      const response = await proxy(request(path))

      expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/_cuadrillas-deshabilitadas")
    }
    expect(mocks.updateSession).not.toHaveBeenCalled()
  })

  it("keeps handling every other route, and the crews route when crews are turned on", async () => {
    vi.stubEnv("CUADRILLAS_ENABLED", undefined)
    await proxy(request("/dashboard"))
    await proxy(request("/dashboard/cuadrillas-x"))

    vi.stubEnv("CUADRILLAS_ENABLED", "true")
    await proxy(request("/dashboard/cuadrillas"))

    expect(mocks.updateSession).toHaveBeenCalledTimes(3)
  })
})
