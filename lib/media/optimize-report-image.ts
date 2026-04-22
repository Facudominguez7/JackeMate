import {
  REPORT_IMAGE_MAX_BYTES,
  REPORT_IMAGE_MAX_DIMENSION,
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

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No pudimos optimizar la imagen seleccionada."))
          return
        }

        resolve(blob)
      },
      REPORT_IMAGE_OUTPUT_TYPE,
      quality,
    )
  })
}

export async function optimizeReportImage(file: File): Promise<OptimizeReportImageResult> {
  if (!isAcceptedReportImageType(file.type)) {
    throw new Error("La imagen debe estar en formato JPG, PNG o WebP.")
  }

  if (file.size > REPORT_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error("La imagen es demasiado pesada. Elegí una de hasta 15 MB.")
  }

  const image = await loadImage(file)
  const { width, height } = getResizedDimensions(image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Tu navegador no permitió optimizar la imagen.")
  }

  context.drawImage(image, 0, 0, width, height)

  let quality = REPORT_IMAGE_OUTPUT_QUALITY
  let blob = await canvasToBlob(canvas, quality)

  while (blob.size > REPORT_IMAGE_MAX_BYTES && quality > 0.5) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, quality)
  }

  const originalBaseName = file.name.replace(/\.[^.]+$/, "") || "reporte"
  const optimizedFile = new File([blob], `${originalBaseName}.${REPORT_IMAGE_OUTPUT_EXTENSION}`, {
    type: blob.type || REPORT_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  })

  if (optimizedFile.size > REPORT_IMAGE_MAX_BYTES) {
    throw new Error("No pudimos reducir la imagen lo suficiente. Probá con una foto más liviana.")
  }

  const wasOptimized =
    optimizedFile.size !== file.size ||
    optimizedFile.type !== file.type ||
    width !== image.naturalWidth ||
    height !== image.naturalHeight

  return {
    file: optimizedFile,
    wasOptimized,
  }
}
