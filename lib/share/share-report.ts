export type ReportShareData = { title: string; text: string; url: string }

/** The parts of `navigator` that sharing uses, so the logic runs without a browser. */
export type ShareNavigator = {
  share?: (data: ReportShareData) => Promise<void>
  clipboard?: { writeText: (text: string) => Promise<void> }
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed"

export function buildReportShareData(titulo: string, url: string): ReportShareData {
  return { title: titulo, text: `Mirá este reporte en Reporty: ${titulo}`, url }
}

/**
 * Opens the system share sheet when the browser has one (phones, Safari) and otherwise copies
 * the link. Closing the sheet is a cancel; any other share error falls back to copying.
 */
export async function shareReport(data: ReportShareData, nav: ShareNavigator): Promise<ShareOutcome> {
  if (nav.share) {
    try {
      await nav.share(data)
      return "shared"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled"
    }
  }

  if (!nav.clipboard) return "failed"
  try {
    await nav.clipboard.writeText(data.url)
    return "copied"
  } catch {
    return "failed"
  }
}
