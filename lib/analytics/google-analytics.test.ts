import { describe, expect, it } from "vitest"

import { gaIdFromEnv } from "./google-analytics"

describe("gaIdFromEnv", () => {
  it("returns a valid GA4 measurement ID", () => {
    expect(gaIdFromEnv("G-ABC1234XYZ")).toBe("G-ABC1234XYZ")
  })

  it("trims spaces copied along with the ID", () => {
    expect(gaIdFromEnv("  G-ABC1234XYZ\n")).toBe("G-ABC1234XYZ")
  })

  it("loads nothing when the variable is missing or empty", () => {
    expect(gaIdFromEnv(undefined)).toBeNull()
    expect(gaIdFromEnv("")).toBeNull()
  })

  it("rejects values that are not a GA4 measurement ID", () => {
    expect(gaIdFromEnv("GTM-ABC1234")).toBeNull()
    expect(gaIdFromEnv("UA-12345-1")).toBeNull()
    expect(gaIdFromEnv("g-abc1234xyz")).toBeNull()
    expect(gaIdFromEnv("G-ABC1234&evil=1")).toBeNull()
  })
})
