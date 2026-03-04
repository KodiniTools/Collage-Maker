/**
 * KodiniTools Cross-Tool Handoff Protocol
 *
 * Shared protocol for passing images between KodiniTools via localStorage.
 * The URL query param `?handoff=kodinitools` is a bonus signal;
 * localStorage key `kodinitools-handoff` is the canonical channel.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HandoffImage {
  name: string
  dataUrl: string
  width: number
  height: number
}

export interface HandoffPayload {
  source: string
  images: HandoffImage[]
  timestamp: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kodinitools-handoff'
const HANDOFF_QUERY = 'kodinitools'
const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.7
const MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

const TARGET_URLS: Record<string, string> = {
  'bildkonverter': '/bildkonverter/gallery',
  'collagemaker': '/collagemaker/editor',
  'color-extractor': '/kodini-color-extractor/app'
}

// ─── Sender API ───────────────────────────────────────────────────────────────

/**
 * Compress a canvas to a data URL (max 1200px, JPEG 0.7).
 */
function compressCanvas(canvas: HTMLCanvasElement): { dataUrl: string; width: number; height: number } {
  let { width, height } = canvas

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, width, height)

  return {
    dataUrl: offscreen.toDataURL('image/jpeg', JPEG_QUALITY),
    width,
    height
  }
}

/**
 * Prepare a handoff: compress images, write to localStorage, return target URL.
 *
 * @param canvases  Array of { name, canvas } from the sender tool
 * @param targetKey Key into TARGET_URLS (e.g. 'collagemaker')
 * @param source    Identifier of the sending tool (e.g. 'bildkonverter')
 * @returns         The target URL with ?handoff=kodinitools, or null on failure
 */
export function prepareHandoff(
  canvases: Array<{ name: string; canvas: HTMLCanvasElement }>,
  targetKey: string,
  source: string
): string | null {
  const targetUrl = TARGET_URLS[targetKey]
  if (!targetUrl) {
    console.error(`[handoff] Unknown target: ${targetKey}`)
    return null
  }

  const images: HandoffImage[] = canvases.map(({ name, canvas }) => {
    const { dataUrl, width, height } = compressCanvas(canvas)
    return { name, dataUrl, width, height }
  })

  const payload: HandoffPayload = {
    source,
    images,
    timestamp: Date.now()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.error('[handoff] Failed to write localStorage:', e)
    return null
  }

  const separator = targetUrl.includes('?') ? '&' : '?'
  return `${targetUrl}${separator}handoff=${HANDOFF_QUERY}`
}

// ─── Receiver API ─────────────────────────────────────────────────────────────

/**
 * Check if a handoff payload exists and is still valid (< 30 min old).
 * Does NOT consume the data — call consumeHandoff() after user accepts.
 */
export function checkHandoff(): HandoffPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const payload: HandoffPayload = JSON.parse(raw)

    if (Date.now() - payload.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    if (!payload.images?.length) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return payload
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/**
 * Consume the handoff: return images and remove from localStorage.
 */
export function consumeHandoff(): HandoffImage[] | null {
  const payload = checkHandoff()
  if (!payload) return null

  localStorage.removeItem(STORAGE_KEY)
  return payload.images
}

/**
 * Dismiss the handoff without consuming — just remove from localStorage.
 */
export function dismissHandoff(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Canvas Helper ────────────────────────────────────────────────────────────

/**
 * Convert a HandoffImage (dataUrl) into an HTMLCanvasElement.
 * Useful for canvas-based tools that need pixel data.
 */
export function handoffImageToCanvas(image: HandoffImage): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error(`Failed to load handoff image: ${image.name}`))
    img.src = image.dataUrl
  })
}

/**
 * Convert a HandoffImage (dataUrl) into a File object.
 * Useful for tools that work with File-based APIs (e.g. collage store addImages).
 */
export function handoffImageToFile(image: HandoffImage): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const byteString = atob(image.dataUrl.split(',')[1])
      const mimeMatch = image.dataUrl.match(/data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }

      const blob = new Blob([ab], { type: mimeType })
      const extension = mimeType === 'image/png' ? '.png' : '.jpg'
      const fileName = image.name.includes('.') ? image.name : `${image.name}${extension}`
      const file = new File([blob], fileName, { type: mimeType })

      resolve(file)
    } catch (e) {
      reject(new Error(`Failed to convert handoff image to File: ${image.name}`))
    }
  })
}
