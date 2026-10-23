import { describe, expect, it, vi } from "vitest"

import { buildReportShareData, shareReport, type ShareNavigator } from "./share-report"

const data = buildReportShareData("Bache en Av. Uruguay", "https://reporty.example/reportes/67")

describe("buildReportShareData", () => {
  it("names the report and Reporty, and links to the report", () => {
    expect(data).toEqual({
      title: "Bache en Av. Uruguay",
      text: "Mirá este reporte en Reporty: Bache en Av. Uruguay",
      url: "https://reporty.example/reportes/67",
    })
  })
})

describe("shareReport", () => {
  it("opens the system share sheet when the browser has one", async () => {
    const nav: ShareNavigator = { share: vi.fn().mockResolvedValue(undefined), clipboard: { writeText: vi.fn() } }

    await expect(shareReport(data, nav)).resolves.toBe("shared")
    expect(nav.share).toHaveBeenCalledWith(data)
    expect(nav.clipboard?.writeText).not.toHaveBeenCalled()
  })

  it("copies the link when there is no share sheet", async () => {
    const nav: ShareNavigator = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } }

    await expect(shareReport(data, nav)).resolves.toBe("copied")
    expect(nav.clipboard?.writeText).toHaveBeenCalledWith("https://reporty.example/reportes/67")
  })

  it("treats closing the share sheet as a cancel, not an error", async () => {
    const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(new DOMException("closed", "AbortError")) }

    await expect(shareReport(data, nav)).resolves.toBe("cancelled")
  })

  it("falls back to copying when the share sheet refuses the data", async () => {
    const nav: ShareNavigator = {
      share: vi.fn().mockRejectedValue(new DOMException("not allowed", "NotAllowedError")),
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    }

    await expect(shareReport(data, nav)).resolves.toBe("copied")
  })

  it("reports a failure when neither sharing nor copying works", async () => {
    const nav: ShareNavigator = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } }

    await expect(shareReport(data, nav)).resolves.toBe("failed")
    await expect(shareReport(data, {})).resolves.toBe("failed")
  })
})
