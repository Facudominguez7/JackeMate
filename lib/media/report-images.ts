import { REPORT_BUCKET } from "@/lib/authz/catalog"

export type ReportImageBucket = typeof REPORT_BUCKET

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

export function normalizeReportImageRef(image: ReportImageRow | null | undefined): ReportImageRef | null {
  if (!image) {
    return null
  }

  if (image.bucket === REPORT_BUCKET && image.path) {
    return {
      bucket: REPORT_BUCKET,
      path: image.path,
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

export function isMissingReportImageColumnsError(error: { message?: string; details?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase()

  return message.includes("bucket") || message.includes("path")
}
