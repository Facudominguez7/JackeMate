import { describe, expect, it } from "vitest"

import { compressToFit, type EncodeAttempt } from "./compress-to-fit"
import { REPORT_IMAGE_MAX_BYTES, REPORT_IMAGE_THUMBNAIL_MAX_BYTES } from "./report-images"

const WEBP = { type: "image/webp", extension: "webp" }
const JPEG = { type: "image/jpeg", extension: "jpg" }

/** A stand-in for the canvas: the encoded size grows with the pixels and the quality. */
function fakeEncoder(bytesPerPixelAtFullQuality: number, unsupported: string[] = []) {
  const attempts: EncodeAttempt[] = []
  const encode = async (attempt: EncodeAttempt) => {
    attempts.push(attempt)
    if (unsupported.includes(attempt.type)) return null
    const size = Math.round(attempt.width * attempt.height * attempt.quality * bytesPerPixelAtFullQuality)
    return { size, result: { ...attempt, size } }
  }
  return { encode, attempts }
}

describe("report image limits", () => {
  it("caps every stored photo and thumbnail at 100 KB", () => {
    expect(REPORT_IMAGE_MAX_BYTES).toBe(100 * 1024)
    expect(REPORT_IMAGE_THUMBNAIL_MAX_BYTES).toBeLessThanOrEqual(100 * 1024)
  })
})

describe("compressToFit", () => {
  it("brings a heavy phone photo under 100 KB on its own, without asking for another photo", async () => {
    // A detailed 1536×1152 photo: about 1.1 MB at the first quality step.
    const { encode } = fakeEncoder(0.8)

    const fitted = await compressToFit({ width: 1536, height: 1152, formats: [WEBP, JPEG], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })

    expect(fitted).not.toBeNull()
    expect(fitted!.result.size).toBeLessThanOrEqual(REPORT_IMAGE_MAX_BYTES)
    expect(fitted!.result.type).toBe("image/webp")
  })

  it("keeps the full resolution when a lower quality is enough", async () => {
    const { encode } = fakeEncoder(0.08)

    const fitted = await compressToFit({ width: 1536, height: 1152, formats: [WEBP, JPEG], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })

    expect(fitted).toMatchObject({ width: 1536, height: 1152 })
  })

  it("lowers the resolution before the quality drops below its floor", async () => {
    const { encode, attempts } = fakeEncoder(0.8)

    await compressToFit({ width: 1536, height: 1152, formats: [WEBP, JPEG], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })

    expect(Math.min(...attempts.map((attempt) => attempt.quality))).toBeGreaterThanOrEqual(0.6)
  })

  it("uses JPEG when the browser cannot encode WebP (Safari), and stops retrying WebP", async () => {
    const { encode, attempts } = fakeEncoder(0.4, ["image/webp"])

    const fitted = await compressToFit({ width: 1536, height: 1152, formats: [WEBP, JPEG], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })

    expect(fitted!.result.type).toBe("image/jpeg")
    expect(attempts.filter((attempt) => attempt.type === "image/webp")).toHaveLength(1)
  })

  it("never goes above the size it started from", async () => {
    const { encode, attempts } = fakeEncoder(0.8)

    await compressToFit({ width: 800, height: 600, formats: [WEBP], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })

    expect(Math.max(...attempts.map((attempt) => attempt.width))).toBe(800)
  })

  it("returns null only when even the smallest step does not fit", async () => {
    const { encode } = fakeEncoder(1000)

    await expect(compressToFit({ width: 1536, height: 1152, formats: [WEBP], maxBytes: REPORT_IMAGE_MAX_BYTES, encode })).resolves.toBeNull()
  })
})
