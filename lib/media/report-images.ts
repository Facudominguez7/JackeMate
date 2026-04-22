import { REPORT_BUCKET } from "@/lib/authz/catalog"

export type ReportImageBucket = typeof REPORT_BUCKET

export const REPORT_IMAGE_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const REPORT_IMAGE_ACCEPT_ATTR = REPORT_IMAGE_ACCEPTED_TYPES.join(",")
export const REPORT_IMAGE_MAX_DIMENSION = 1536
export const REPORT_IMAGE_OUTPUT_TYPE = "image/webp" as const
export const REPORT_IMAGE_OUTPUT_EXTENSION = "webp" as const
export const REPORT_IMAGE_OUTPUT_QUALITY = 0.82
export const REPORT_IMAGE_FALLBACK_OUTPUT_TYPE = "image/jpeg" as const
export const REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION = "jpg" as const
export const REPORT_IMAGE_FALLBACK_OUTPUT_QUALITY = 0.8
export const REPORT_IMAGE_MIN_QUALITY = 0.68
export const REPORT_IMAGE_MAX_BYTES = Math.floor(2.5 * 1024 * 1024)
export const REPORT_IMAGE_MAX_SOURCE_BYTES = 15 * 1024 * 1024

export type ReportImageRef = {
  bucket: ReportImageBucket
  path: string
  publicUrl?: string | null
}

export type ReportImageRow = {
  url?: string | null
  bucket?: string | null
  path?: string | null
}

export type ResolvedReportImageRow<T extends ReportImageRow = ReportImageRow> = T & {
  publicUrl: string | null
}

const STORAGE_OBJECT_PATH_REGEX = /^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

export function buildReportImagePublicUrl(ref: ReportImageRef, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!supabaseUrl) {
    return ref.publicUrl ?? null
  }

  const baseUrl = supabaseUrl.replace(/\/+$/, "")
  const bucket = trimSlashes(ref.bucket)
  const path = ref.path.replace(/^\/+/, "")

  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function parseLegacyReportImageUrl(url: string | null | undefined): ReportImageRef | null {
  if (!url) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    const match = parsedUrl.pathname.match(STORAGE_OBJECT_PATH_REGEX)

    if (!match) {
      return null
    }

    const [, bucket, rawPath] = match

    if (bucket !== REPORT_BUCKET) {
      return null
    }

    return {
      bucket: REPORT_BUCKET,
      path: decodeURIComponent(rawPath),
      publicUrl: url,
    }
  } catch {
    return null
  }
}

export function parseReportImageStorageReference(reference: string | null | undefined): ReportImageRef | null {
  const normalizedReference = trimSlashes(reference ?? "")

  if (!normalizedReference) {
    return null
  }

  const bucketPrefix = `${REPORT_BUCKET}/`

  if (normalizedReference === REPORT_BUCKET) {
    return null
  }

  if (normalizedReference.startsWith(bucketPrefix)) {
    return {
      bucket: REPORT_BUCKET,
      path: normalizedReference.slice(bucketPrefix.length),
    }
  }

  return {
    bucket: REPORT_BUCKET,
    path: normalizedReference,
  }
}

export function normalizeReportImageRef(image: ReportImageRow | null | undefined): ReportImageRef | null {
  if (!image) {
    return null
  }

  if (image.bucket === REPORT_BUCKET && image.path) {
    const storageRef = parseReportImageStorageReference(image.path)

    if (!storageRef) {
      return null
    }

    return {
      ...storageRef,
      publicUrl: image.url ?? null,
    }
  }

  return parseLegacyReportImageUrl(image.url)
}

export function resolveReportImageUrl(image: ReportImageRow | null | undefined) {
  const normalizedImage = normalizeReportImageRef(image)

  if (!normalizedImage) {
    return image?.url ?? null
  }

  return buildReportImagePublicUrl(normalizedImage) ?? normalizedImage.publicUrl ?? null
}

export function resolveReportImageRows<T extends ReportImageRow>(images: T[] | null | undefined): ResolvedReportImageRow<T>[] {
  return (images ?? []).map((image) => ({
    ...image,
    publicUrl: resolveReportImageUrl(image),
  }))
}

export function getPrimaryReportImageUrl(images: ReportImageRow[] | null | undefined) {
  return resolveReportImageRows(images)[0]?.publicUrl ?? null
}

export function getReportImageStorageRefs(images: ReportImageRow[] | null | undefined) {
  const uniqueRefs = new Map<string, ReportImageRef>()

  for (const image of images ?? []) {
    const ref = normalizeReportImageRef(image)

    if (!ref?.path) {
      continue
    }

    uniqueRefs.set(`${ref.bucket}/${ref.path}`, ref)
  }

  return Array.from(uniqueRefs.values())
}

export function isMissingReportImageColumnsError(error: { message?: string; details?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase()

  return message.includes("bucket") || message.includes("path")
}

export function isAcceptedReportImageType(type: string | null | undefined): type is (typeof REPORT_IMAGE_ACCEPTED_TYPES)[number] {
  return REPORT_IMAGE_ACCEPTED_TYPES.includes((type ?? "") as (typeof REPORT_IMAGE_ACCEPTED_TYPES)[number])
}
