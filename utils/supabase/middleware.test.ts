import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { updateSession } from "./middleware"

const mocks = vi.hoisted(() => ({ getUser: vi.fn() }))

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: mocks.getUser } }),
}))

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:3000"))

describe("updateSession without a session", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon")
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: null } })
  })

  it("lets visitors open a report detail instead of sending them to /auth", async () => {
    const response = await updateSession(request("/reportes/67"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("keeps the public pages open", async () => {
    for (const path of ["/reportes", "/mapa", "/mis-reportes"]) {
      const response = await updateSession(request(path))

      expect(response.headers.get("location")).toBeNull()
    }
  })

  it("still sends visitors to /auth for the dashboard and for a new report without the guest choice", async () => {
    for (const path of ["/dashboard", "/reportes/nuevo"]) {
      const response = await updateSession(request(path))

      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe(`http://localhost:3000/auth?next=${encodeURIComponent(path)}`)
    }
  })

  it("lets a visitor who chose to report as a guest open the new report form", async () => {
    const response = await updateSession(request("/reportes/nuevo?modo=invitado"))

    expect(response.headers.get("location")).toBeNull()
  })
})
