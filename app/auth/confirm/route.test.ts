import { AuthApiError } from "@supabase/supabase-js"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  revalidatePath: vi.fn(),
  // Next's redirect() throws to stop the handler; the mock does the same and keeps the target.
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp: mocks.verifyOtp } }),
}))

/** Runs the handler for a confirm URL and returns where it redirected. */
async function confirm(query: string) {
  const request = new NextRequest(`https://reporty.com.ar/auth/confirm?${query}`)
  const error = await GET(request).then(
    () => null,
    (thrown: Error) => thrown,
  )
  return error?.message.replace("REDIRECT:", "")
}

const callbackTo = (next: string) =>
  encodeURIComponent(`https://reporty.com.ar/auth/callback?next=${encodeURIComponent(next)}`)

const expired = () => new AuthApiError("Email link is invalid or has expired", 403, "otp_expired")

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies the token and opens the explicit next page", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: null })

    await expect(confirm("token_hash=abc&type=email&next=%2Freportes%2Fnuevo")).resolves.toBe("/reportes/nuevo")
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "abc" })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("takes the destination from the redirect_to the original flow requested", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: null })

    await expect(
      confirm(`token_hash=abc&type=email_change&redirect_to=${callbackTo("/mis-reportes?cuenta=vinculada")}`),
    ).resolves.toBe("/mis-reportes?cuenta=vinculada")
  })

  it("opens the new password page after a recovery link without a destination", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: null })

    await expect(confirm("token_hash=abc&type=recovery")).resolves.toBe("/auth/nueva-contrasena")
  })

  it.each([
    ["an external next", `redirect_to=${callbackTo("//evil.example")}`],
    ["an unparsable redirect_to", "redirect_to=not%20a%20url"],
  ])("falls back to the map for %s", async (_case, destination) => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: null })

    await expect(confirm(`token_hash=abc&type=email&${destination}`)).resolves.toBe("/mapa")
  })

  it("sends an expired recovery link back to the recovery form", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: expired() })

    await expect(confirm(`token_hash=abc&type=recovery&redirect_to=${callbackTo("/auth/nueva-contrasena")}`)).resolves.toBe(
      "/auth/recuperar?error=enlace",
    )
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("sends any other expired link to sign in, keeping the destination", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ data: {}, error: expired() })

    await expect(confirm("token_hash=abc&type=email&next=%2Freportes%2Fnuevo")).resolves.toBe(
      "/auth?error=enlace&next=%2Freportes%2Fnuevo",
    )
  })

  it("treats a link without token as expired instead of a 404", async () => {
    await expect(confirm("type=email")).resolves.toBe("/auth?error=enlace&next=%2Fmapa")
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })
})
