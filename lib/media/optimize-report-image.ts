import { compressToFit, type Encoder, type OutputFormat } from "@/lib/media/compress-to-fit"
import {
  REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION,
  REPORT_IMAGE_FALLBACK_OUTPUT_TYPE,
  REPORT_IMAGE_MAX_BYTES,
  REPORT_IMAGE_MAX_DIMENSION,
  REPORT_IMAGE_MAX_SOURCE_BYTES,
  REPORT_IMAGE_OUTPUT_EXTENSION,
  REPORT_IMAGE_OUTPUT_TYPE,
  REPORT_IMAGE_THUMBNAIL_MAX_BYTES,
  REPORT_IMAGE_THUMBNAIL_MAX_DIMENSION,
  REPORT_IMAGE_THUMBNAIL_OUTPUT_EXTENSION,
  REPORT_IMAGE_THUMBNAIL_OUTPUT_TYPE,
  isAcceptedReportImageType,
} from "@/lib/media/report-images"

type OptimizeReportImageResult = {
  file: File
  wasOptimized: boolean
}

// WebP first; Safari cannot encode it from a canvas, so JPEG is the fallback.
const PHOTO_FORMATS: OutputFormat[] = [
  { type: REPORT_IMAGE_OUTPUT_TYPE, extension: REPORT_IMAGE_OUTPUT_EXTENSION },
  { type: REPORT_IMAGE_FALLBACK_OUTPUT_TYPE, extension: REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION },
]
const THUMBNAIL_FORMATS: OutputFormat[] = [
  { type: REPORT_IMAGE_THUMBNAIL_OUTPUT_TYPE, extension: REPORT_IMAGE_THUMBNAIL_OUTPUT_EXTENSION },
  { type: REPORT_IMAGE_FALLBACK_OUTPUT_TYPE, extension: REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION },
]

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("No pudimos procesar la imagen seleccionada."))
    }

    image.src = objectUrl
  })
}

function getResizedDimensions(width: number, height: number, maxDimension: number) {
  const largerSide = Math.max(width, height)

  if (largerSide <= maxDimension) {
    return { width, height }
  }

  const scale = maxDimension / largerSide

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToBlobWithType(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No pudimos optimizar la imagen seleccionada."))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })
}

/** Draws the image on a canvas at each requested size and encodes it there. */
function createCanvasEncoder(image: HTMLImageElement, errorMessage: string): Encoder<Blob> {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error(errorMessage)
  }

  let drawnSize = ""

  return async ({ width, height, type, quality }) => {
    if (drawnSize !== `${width}x${height}`) {
      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      drawnSize = `${width}x${height}`
    }

    const blob = await canvasToBlobWithType(canvas, type, quality)
    // Safari ignores unsupported `toBlob` types (such as WebP) and returns PNG.
    return blob.type === type ? { size: blob.size, result: blob } : null
  }
}

function buildOptimizedFile(blob: Blob, fileName: string) {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  })
}

function fitsAsIs(file: File, image: HTMLImageElement) {
  return (
    file.size <= REPORT_IMAGE_MAX_BYTES &&
    image.naturalWidth <= REPORT_IMAGE_MAX_DIMENSION &&
    image.naturalHeight <= REPORT_IMAGE_MAX_DIMENSION
  )
}

/**
 * Takes the photo as the person chose it and brings it under REPORT_IMAGE_MAX_BYTES by lowering
 * quality and then resolution. Nobody is asked for a lighter photo.
 */
export async function optimizeReportImage(file: File): Promise<OptimizeReportImageResult> {
  if (!isAcceptedReportImageType(file.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  if (file.size > REPORT_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error("La imagen es demasiado pesada. Elegí una de hasta 15 MB.")
  }

  const image = await loadImage(file)

  if (fitsAsIs(file, image) && file.type === REPORT_IMAGE_OUTPUT_TYPE) {
    return { file, wasOptimized: false }
  }

  const { width, height } = getResizedDimensions(image.naturalWidth, image.naturalHeight, REPORT_IMAGE_MAX_DIMENSION)
  const fitted = await compressToFit({
    width,
    height,
    formats: PHOTO_FORMATS,
    maxBytes: REPORT_IMAGE_MAX_BYTES,
    encode: createCanvasEncoder(image, "Tu navegador no permitió optimizar la imagen."),
  })

  if (!fitted) {
    throw new Error("No pudimos procesar esta foto. Probá con otra.")
  }

  // A small original that is barely heavier than its re-encoding keeps its own quality.
  if (fitsAsIs(file, image) && file.size <= Math.round(fitted.result.size * 1.1)) {
    return { file, wasOptimized: false }
  }

  const extension = PHOTO_FORMATS.find((format) => format.type === fitted.type)!.extension
  const baseName = file.name.replace(/\.[^.]+$/, "") || "reporte"

  return { file: buildOptimizedFile(fitted.result, `${baseName}.${extension}`), wasOptimized: true }
}

export async function createReportImageThumbnail(file: File) {
  if (!isAcceptedReportImageType(file.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  const image = await loadImage(file)
  const { width, height } = getResizedDimensions(
    image.naturalWidth,
    image.naturalHeight,
    REPORT_IMAGE_THUMBNAIL_MAX_DIMENSION,
  )
  const fitted = await compressToFit({
    width,
    height,
    formats: THUMBNAIL_FORMATS,
    maxBytes: REPORT_IMAGE_THUMBNAIL_MAX_BYTES,
    encode: createCanvasEncoder(image, "Tu navegador no permitió preparar la miniatura."),
  })

  if (!fitted) {
    throw new Error("No pudimos preparar una miniatura liviana para la imagen.")
  }

  const extension = THUMBNAIL_FORMATS.find((format) => format.type === fitted.type)!.extension
  const baseName = file.name.replace(/\.[^.]+$/, "") || "reporte"

  return buildOptimizedFile(fitted.result, `${baseName}-thumbnail.${extension}`)
}
