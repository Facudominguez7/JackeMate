import { describe, expect, it } from "vitest"

import { gtmIdFromEnv } from "./gtm"

describe("gtmIdFromEnv", () => {
  it("returns a valid container ID", () => {
    expect(gtmIdFromEnv("GTM-ABC1234")).toBe("GTM-ABC1234")
  })

  it("trims spaces copied along with the ID", () => {
    expect(gtmIdFromEnv("  GTM-ABC1234\n")).toBe("GTM-ABC1234")
  })

  it("loads nothing when the variable is missing or empty", () => {
    expect(gtmIdFromEnv(undefined)).toBeNull()
    expect(gtmIdFromEnv("")).toBeNull()
  })

  it("rejects values that are not a Tag Manager container ID", () => {
    expect(gtmIdFromEnv("G-ABC1234")).toBeNull()
    expect(gtmIdFromEnv("gtm-abc1234")).toBeNull()
    expect(gtmIdFromEnv("GTM-ABC1234&evil=1")).toBeNull()
  })
})
