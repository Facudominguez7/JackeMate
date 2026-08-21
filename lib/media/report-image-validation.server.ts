import "server-only"

import {
  REPORT_IMAGE_ACCEPTED_TYPES,
  REPORT_IMAGE_MAX_BYTES,
  REPORT_IMAGE_MAX_BYTES_LABEL,
  REPORT_IMAGE_MAX_DIMENSION,
  REPORT_IMAGE_THUMBNAIL_MAX_BYTES,
  REPORT_IMAGE_THUMBNAIL_MAX_DIMENSION,
  REPORT_IMAGE_THUMBNAIL_OUTPUT_TYPE,
} from "@/lib/media/report-images"

type UploadedImageMetadata = {
  type: (typeof REPORT_IMAGE_ACCEPTED_TYPES)[number]
  width: number
  height: number
}

type ValidationMode = "detail" | "thumbnail"

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const
const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46] as const
const WEBP_NAME = [0x57, 0x45, 0x42, 0x50] as const

function hasSignature(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function parsePngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24 || !hasSignature(bytes, PNG_SIGNATURE)) {
    return null
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  }
}

function parseJpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null
  }

  let offset = 2

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    offset += 2

    if (marker === 0xd8 || marker === 0x01) {
      continue
    }

    if (marker === 0xd9 || marker === 0xda) {
      break
    }

    if (offset + 1 >= bytes.length) {
      break
    }

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1]

    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      break
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)

    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      }
    }

    offset += segmentLength
  }

  return null
}

function parseWebpDimensions(bytes: Uint8Array) {
  if (bytes.length < 25 || !hasSignature(bytes, WEBP_SIGNATURE) || !hasSignature(bytes, WEBP_NAME, 8)) {
    return null
  }

  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15])
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  if (chunkType === "VP8X") {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    }
  }

  if (chunkType === "VP8 ") {
    if (bytes.length < 30 || bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null
    }

    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    }
  }

  if (chunkType === "VP8L") {
    if (bytes.length < 25 || bytes[20] !== 0x2f) {
      return null
    }

    const bits =
      bytes[21] |
      (bytes[22] << 8) |
      (bytes[23] << 16) |
      (bytes[24] << 24)

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }

  return null
}

async function readUploadedImageMetadata(file: File): Promise<UploadedImageMetadata> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const png = parsePngDimensions(bytes)

  if (png) {
    return { type: "image/png", ...png }
  }

  const jpeg = parseJpegDimensions(bytes)

  if (jpeg) {
    return { type: "image/jpeg", ...jpeg }
  }

  const webp = parseWebpDimensions(bytes)

  if (webp) {
    return { type: "image/webp", ...webp }
  }

  throw new Error("No pudimos validar el archivo de imagen seleccionado.")
}

function assertUploadedImageConstraints(file: File, metadata: UploadedImageMetadata, mode: ValidationMode) {
  const maxBytes = mode === "thumbnail" ? REPORT_IMAGE_THUMBNAIL_MAX_BYTES : REPORT_IMAGE_MAX_BYTES
  const maxDimension = mode === "thumbnail" ? REPORT_IMAGE_THUMBNAIL_MAX_DIMENSION : REPORT_IMAGE_MAX_DIMENSION

  if (file.type !== metadata.type) {
    throw new Error("La imagen seleccionada no coincide con el formato real del archivo.")
  }

  if (mode === "thumbnail" && metadata.type !== REPORT_IMAGE_THUMBNAIL_OUTPUT_TYPE) {
    throw new Error("La miniatura debe enviarse en formato WebP.")
  }

  if (file.size > maxBytes) {
    if (mode === "thumbnail") {
      throw new Error("La miniatura generada es demasiado pesada. Probá con otra imagen.")
    }

    throw new Error(`La imagen optimizada no puede superar los ${REPORT_IMAGE_MAX_BYTES_LABEL}.`)
  }

  if (metadata.width < 1 || metadata.height < 1 || metadata.width > maxDimension || metadata.height > maxDimension) {
    if (mode === "thumbnail") {
      throw new Error("La miniatura generada tiene dimensiones inválidas.")
    }

    throw new Error("La imagen optimizada supera las dimensiones permitidas.")
  }
}

export async function validateUploadedReportImage(file: File) {
  const metadata = await readUploadedImageMetadata(file)
  assertUploadedImageConstraints(file, metadata, "detail")
  return metadata
}

export async function validateUploadedReportThumbnail(file: File) {
  const metadata = await readUploadedImageMetadata(file)
  assertUploadedImageConstraints(file, metadata, "thumbnail")
  return metadata
}
