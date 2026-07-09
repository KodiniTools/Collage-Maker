import type { CollageImage, CropRect } from '@/types'
import { cropSourceRect, hasCrop } from '@/lib/cropImage'

/**
 * Bildbearbeitungs-Parameter (mit Abwärtskompatibilität ausgelesen).
 */
export interface ImageFilterParams {
  brightness: number
  contrast: number
  saturation: number
  highlights: number
  shadows: number
  warmth: number
  sharpness: number
}

export function readFilterParams(img: CollageImage): ImageFilterParams {
  return {
    brightness: img.brightness ?? 100,
    contrast: img.contrast ?? 100,
    saturation: img.saturation ?? 100,
    highlights: img.highlights ?? 0,
    shadows: img.shadows ?? 0,
    warmth: img.warmth ?? 0,
    sharpness: img.sharpness ?? 0,
  }
}

export function hasAnyFilter(p: ImageFilterParams): boolean {
  return (
    p.brightness !== 100 ||
    p.contrast !== 100 ||
    p.saturation !== 100 ||
    p.highlights !== 0 ||
    p.shadows !== 0 ||
    p.warmth !== 0 ||
    p.sharpness !== 0
  )
}

/**
 * Erzeugt eine gefilterte Bildquelle. Ohne aktive Filter wird das Original
 * zurückgegeben; sonst ein Offscreen-Canvas (Größe width×height) mit
 * angewendeten CSS- und Pixel-Filtern.
 *
 * Wird für das freie Verzerren (Distort) benötigt, da dort das Bild als fertige
 * Quelle in ein Dreiecks-Mesh gewarpt wird und nicht direkt gezeichnet werden kann.
 */
export function createFilteredImageSource(
  htmlImg: HTMLImageElement,
  width: number,
  height: number,
  p: ImageFilterParams,
  crop?: CropRect
): CanvasImageSource {
  const cropped = hasCrop(crop)
  // Ohne Filter UND ohne Zuschnitt kann das Original direkt verwendet werden.
  if (!hasAnyFilter(p) && !cropped) return htmlImg

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return htmlImg

  const cssFilters: string[] = []
  if (p.brightness !== 100) cssFilters.push(`brightness(${p.brightness}%)`)
  if (p.contrast !== 100) cssFilters.push(`contrast(${p.contrast}%)`)
  if (p.saturation !== 100) cssFilters.push(`saturate(${p.saturation}%)`)
  if (cssFilters.length > 0) ctx.filter = cssFilters.join(' ')

  // Nur den Zuschnitt-Ausschnitt der Quelle auf das Ziel-Canvas skalieren.
  const { sx, sy, sw, sh } = cropSourceRect(htmlImg.naturalWidth, htmlImg.naturalHeight, crop)
  ctx.drawImage(htmlImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  ctx.filter = 'none'

  const needsPixel = p.highlights !== 0 || p.shadows !== 0 || p.warmth !== 0 || p.sharpness !== 0
  if (!needsPixel) return canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    const pixelBrightness = (r + g + b) / 3

    if (p.highlights !== 0) {
      const factor = p.highlights / 100
      const mask = Math.pow(pixelBrightness / 255, 2)
      const adj = factor * mask * 50
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }
    if (p.shadows !== 0) {
      const factor = p.shadows / 100
      const mask = Math.pow(1 - pixelBrightness / 255, 2)
      const adj = factor * mask * 50
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }
    if (p.warmth !== 0) {
      const factor = p.warmth / 100
      r = Math.max(0, Math.min(255, r + factor * 30))
      b = Math.max(0, Math.min(255, b - factor * 30))
    }
    if (p.sharpness !== 0) {
      const factor = p.sharpness / 100
      const avg = (r + g + b) / 3
      r = Math.max(0, Math.min(255, r + (r - avg) * factor))
      g = Math.max(0, Math.min(255, g + (g - avg) * factor))
      b = Math.max(0, Math.min(255, b + (b - avg) * factor))
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}
