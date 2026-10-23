import { describe, expect, it } from "vitest"

import nextConfig from "./next.config.mjs"

describe("next.config redirects", () => {
  it("sends every www.reporty.com.ar URL to the same path on reporty.com.ar, permanently", async () => {
    const redirects = await nextConfig.redirects?.()

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "www.reporty.com.ar" }],
      destination: "https://reporty.com.ar/:path*",
      permanent: true,
    })
  })
})
