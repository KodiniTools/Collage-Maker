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

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

/**
 * Wendet ALLE Bildfilter rein pixelbasiert (in-place) auf ein RGBA-Array an.
 *
 * Helligkeit, Kontrast und Sättigung werden hier ECHT pro Pixel gerechnet
 * (statt über den `ctx.filter`-CSS-Trick). Die verwendeten Formeln entsprechen
 * den CSS-Filter-Definitionen, sodass das Ergebnis optisch identisch bleibt –
 * nur eben als echte Pixelmanipulation, konsistent in Live-Ansicht und Export.
 *
 * Reihenfolge wie zuvor: brightness → contrast → saturate (die drei früheren
 * CSS-Filter), danach highlights → shadows → warmth → sharpness.
 */
export function applyFilterPixels(data: Uint8ClampedArray, p: ImageFilterParams): void {
  const bFactor = p.brightness / 100 // brightness(x%) = Kanal * x/100
  const cFactor = p.contrast / 100 // contrast(x%): (v-128)*x/100 + 128
  const sFactor = p.saturation / 100 // saturate(x%): grau + (v-grau)*x/100
  const doBrightness = p.brightness !== 100
  const doContrast = p.contrast !== 100
  const doSaturation = p.saturation !== 100
  const doHighlights = p.highlights !== 0
  const doShadows = p.shadows !== 0
  const doWarmth = p.warmth !== 0
  const doSharpness = p.sharpness !== 0

  const highlightFactor = p.highlights / 100
  const shadowFactor = p.shadows / 100
  const warmthFactor = p.warmth / 100
  const sharpnessFactor = p.sharpness / 100

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Helligkeit (multiplikativ, wie CSS brightness())
    if (doBrightness) {
      r *= bFactor
      g *= bFactor
      b *= bFactor
    }
    // Kontrast (um Mittelgrau 128 spreizen, wie CSS contrast())
    if (doContrast) {
      r = (r - 128) * cFactor + 128
      g = (g - 128) * cFactor + 128
      b = (b - 128) * cFactor + 128
    }
    // Sättigung (Interpolation zur Rec.709-Luminanz, wie CSS saturate())
    if (doSaturation) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = gray + (r - gray) * sFactor
      g = gray + (g - gray) * sFactor
      b = gray + (b - gray) * sFactor
    }

    // Nach den Grundfiltern auf gültige Bytewerte begrenzen (entspricht dem
    // früheren Verhalten, bei dem diese Filter erst ins Canvas gebacken wurden).
    if (doBrightness || doContrast || doSaturation) {
      r = clamp255(r)
      g = clamp255(g)
      b = clamp255(b)
    }

    // Lichter/Tiefen/Wärme/Schärfe (waren bereits pixelbasiert)
    const pixelBrightness = (r + g + b) / 3

    if (doHighlights) {
      const mask = Math.pow(pixelBrightness / 255, 2) // stärker in hellen Bereichen
      const adj = highlightFactor * mask * 50
      r = clamp255(r + adj)
      g = clamp255(g + adj)
      b = clamp255(b + adj)
    }
    if (doShadows) {
      const mask = Math.pow(1 - pixelBrightness / 255, 2) // stärker in dunklen Bereichen
      const adj = shadowFactor * mask * 50
      r = clamp255(r + adj)
      g = clamp255(g + adj)
      b = clamp255(b + adj)
    }
    if (doWarmth) {
      r = clamp255(r + warmthFactor * 30)
      b = clamp255(b - warmthFactor * 30)
    }
    if (doSharpness) {
      const avg = (r + g + b) / 3
      r = clamp255(r + (r - avg) * sharpnessFactor)
      g = clamp255(g + (g - avg) * sharpnessFactor)
      b = clamp255(b + (b - avg) * sharpnessFactor)
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}

/**
 * Zeichnet die (ggf. zugeschnittene) Bildquelle auf ein Offscreen-Canvas der
 * Größe width×height und wendet alle Filter rein pixelbasiert an. Gibt das
 * Canvas zurück (auch ohne Filter, wenn ein Zuschnitt vorliegt).
 */
export function renderFilteredImage(
  htmlImg: HTMLImageElement,
  width: number,
  height: number,
  p: ImageFilterParams,
  crop?: CropRect
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')!

  const { sx, sy, sw, sh } = cropSourceRect(htmlImg.naturalWidth, htmlImg.naturalHeight, crop)
  ctx.drawImage(htmlImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  if (hasAnyFilter(p)) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    applyFilterPixels(imageData.data, p)
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas
}

/**
 * Erzeugt eine gefilterte Bildquelle. Ohne aktive Filter und ohne Zuschnitt
 * wird das Original zurückgegeben; sonst ein Offscreen-Canvas mit rein
 * pixelbasiert angewendeten Filtern.
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
  // Ohne Filter UND ohne Zuschnitt kann das Original direkt verwendet werden.
  if (!hasAnyFilter(p) && !hasCrop(crop)) return htmlImg
  return renderFilteredImage(htmlImg, width, height, p, crop)
}
