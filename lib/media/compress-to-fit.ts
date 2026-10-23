export type OutputFormat = { type: string; extension: string }

export type EncodeAttempt = { width: number; height: number; type: string; quality: number }

/** Returns null when the browser cannot encode that type (Safari has no WebP from a canvas). */
export type Encoder<R> = (attempt: EncodeAttempt) => Promise<{ size: number; result: R } | null>

export type FittedImage<R> = EncodeAttempt & { result: R }

/**
 * Resolution steps, as a share of the starting size. A photo first loses quality, down to the
 * floor below, and only then resolution: a sharp smaller photo reads better than a blocky big one.
 * The last step (30 %) turns a 1536 px photo into about 460 px.
 */
export const COMPRESSION_SCALE_STEPS = [1, 0.85, 0.72, 0.6, 0.5, 0.42, 0.35, 0.3] as const
export const COMPRESSION_QUALITY_STEPS = [0.8, 0.7, 0.6] as const

/**
 * Finds the first encoding, from the sharpest down, that fits in `maxBytes`. The person who
 * reports never has to pick a lighter photo: the steps go low enough for any real photo.
 */
export async function compressToFit<R>({
  width,
  height,
  formats,
  maxBytes,
  encode,
}: {
  width: number
  height: number
  formats: OutputFormat[]
  maxBytes: number
  encode: Encoder<R>
}): Promise<FittedImage<R> | null> {
  const unsupported = new Set<string>()

  for (const scale of COMPRESSION_SCALE_STEPS) {
    const size = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }

    for (const format of formats) {
      if (unsupported.has(format.type)) continue

      for (const quality of COMPRESSION_QUALITY_STEPS) {
        const attempt = { ...size, type: format.type, quality }
        const encoded = await encode(attempt)

        if (!encoded) {
          unsupported.add(format.type)
          break
        }
        if (encoded.size <= maxBytes) return { ...attempt, result: encoded.result }
      }
    }
  }

  return null
}
