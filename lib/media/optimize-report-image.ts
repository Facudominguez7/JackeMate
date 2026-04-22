import {
  REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION,
  REPORT_IMAGE_FALLBACK_OUTPUT_QUALITY,
  REPORT_IMAGE_FALLBACK_OUTPUT_TYPE,
  REPORT_IMAGE_MAX_BYTES,
  REPORT_IMAGE_MAX_DIMENSION,
  REPORT_IMAGE_MIN_QUALITY,
  REPORT_IMAGE_MAX_SOURCE_BYTES,
  REPORT_IMAGE_OUTPUT_EXTENSION,
  REPORT_IMAGE_OUTPUT_QUALITY,
  REPORT_IMAGE_OUTPUT_TYPE,
  isAcceptedReportImageType,
} from "@/lib/media/report-images"

type OptimizeReportImageResult = {
  file: File
  wasOptimized: boolean
}

type OutputFormat = {
  type: string
  extension: string
  quality: number
}

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

function getResizedDimensions(width: number, height: number) {
  const largerSide = Math.max(width, height)

  if (largerSide <= REPORT_IMAGE_MAX_DIMENSION) {
    return { width, height }
  }

  const scale = REPORT_IMAGE_MAX_DIMENSION / largerSide

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

function createOutputFormats(): OutputFormat[] {
  return [
    {
      type: REPORT_IMAGE_OUTPUT_TYPE,
      extension: REPORT_IMAGE_OUTPUT_EXTENSION,
      quality: REPORT_IMAGE_OUTPUT_QUALITY,
    },
    {
      type: REPORT_IMAGE_FALLBACK_OUTPUT_TYPE,
      extension: REPORT_IMAGE_FALLBACK_OUTPUT_EXTENSION,
      quality: REPORT_IMAGE_FALLBACK_OUTPUT_QUALITY,
    },
  ]
}

function getScaleSteps() {
  return [1, 0.9, 0.82] as const
}

function getQualitySteps(initialQuality: number) {
  const steps: number[] = []

  for (let quality = initialQuality; quality >= REPORT_IMAGE_MIN_QUALITY; quality -= 0.06) {
    steps.push(Number(quality.toFixed(2)))
  }

  if (steps[steps.length - 1] !== REPORT_IMAGE_MIN_QUALITY) {
    steps.push(REPORT_IMAGE_MIN_QUALITY)
  }

  return steps
}

function buildOptimizedFile(blob: Blob, fileName: string) {
  return new File([blob], fileName, {
    type: blob.type || REPORT_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  })
}

function shouldKeepOriginalFile(file: File, image: HTMLImageElement) {
  return (
    file.size <= REPORT_IMAGE_MAX_BYTES &&
    image.naturalWidth <= REPORT_IMAGE_MAX_DIMENSION &&
    image.naturalHeight <= REPORT_IMAGE_MAX_DIMENSION &&
    file.type === REPORT_IMAGE_OUTPUT_TYPE
  )
}

function getScaledDimensions(width: number, height: number, scale: number) {
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function optimizeReportImage(file: File): Promise<OptimizeReportImageResult> {
  if (!isAcceptedReportImageType(file.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  if (file.size > REPORT_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error("La imagen es demasiado pesada. Elegí una de hasta 15 MB.")
  }

  const image = await loadImage(file)

  if (shouldKeepOriginalFile(file, image)) {
    return {
      file,
      wasOptimized: false,
    }
  }

  const { width, height } = getResizedDimensions(image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement("canvas")

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Tu navegador no permitió optimizar la imagen.")
  }

  const originalBaseName = file.name.replace(/\.[^.]+$/, "") || "reporte"
  const scaleSteps = getScaleSteps()
  const outputFormats = createOutputFormats()

  let bestAttempt: File | null = null

  for (const scaleStep of scaleSteps) {
    const scaledDimensions = getScaledDimensions(width, height, scaleStep)
    canvas.width = scaledDimensions.width
    canvas.height = scaledDimensions.height
    context.clearRect(0, 0, scaledDimensions.width, scaledDimensions.height)
    context.drawImage(image, 0, 0, scaledDimensions.width, scaledDimensions.height)

    for (const outputFormat of outputFormats) {
      for (const quality of getQualitySteps(outputFormat.quality)) {
        const blob = await canvasToBlobWithType(canvas, outputFormat.type, quality)
        const attemptedFile = buildOptimizedFile(blob, `${originalBaseName}.${outputFormat.extension}`)

        if (!bestAttempt || attemptedFile.size < bestAttempt.size) {
          bestAttempt = attemptedFile
        }

        if (attemptedFile.size <= REPORT_IMAGE_MAX_BYTES) {
          const shouldPreserveOriginalQuality =
            file.size <= REPORT_IMAGE_MAX_BYTES &&
            file.size <= Math.round(attemptedFile.size * 1.1) &&
            image.naturalWidth <= REPORT_IMAGE_MAX_DIMENSION &&
            image.naturalHeight <= REPORT_IMAGE_MAX_DIMENSION

          if (shouldPreserveOriginalQuality) {
            return {
              file,
              wasOptimized: false,
            }
          }

          return {
            file: attemptedFile,
            wasOptimized:
              attemptedFile.size !== file.size ||
              attemptedFile.type !== file.type ||
              scaledDimensions.width !== image.naturalWidth ||
              scaledDimensions.height !== image.naturalHeight,
          }
        }
      }
    }
  }

  const optimizedFile = bestAttempt

  if (!optimizedFile || optimizedFile.size > REPORT_IMAGE_MAX_BYTES) {
    throw new Error("No pudimos reducir la imagen lo suficiente. Probá con una foto más liviana.")
  }

  return {
    file: optimizedFile,
    wasOptimized:
      optimizedFile.size !== file.size ||
      optimizedFile.type !== file.type ||
      width !== image.naturalWidth ||
      height !== image.naturalHeight,
  }
}
