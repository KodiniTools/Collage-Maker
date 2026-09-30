import type { CollageImage, ShapeQuad } from '@/types'
import { computeBakeLayout, drawWarpedImage, hasDistortion, type BakeLayout } from '@/lib/warpImage'
import { cropSourceRect } from '@/lib/cropImage'

/**
 * "Verzerrung übernehmen": Die per Eckpunkten verzerrte Bildquelle wird in ein
 * neues, transparentes Bild gebacken, das genau die Bounding-Box des Vierecks
 * umfasst. Danach ist das Bild wieder ein normales (unverzerrtes) Rechteck mit
 * Umrissform (shapeQuad) – Schatten, runde Ecken und Rahmen wirken wieder.
 *
 * Eingebacken werden Zuschnitt und Verzerrung. Filter bleiben live editierbar;
 * Rotation, Spiegelung, Neigung und Deckkraft bleiben Transformationen.
 */

// Gitterauflösung beim Backen (einmalig, daher hoch)
const BAKE_SUBDIVISIONS = 24
// Obergrenzen für das gebackene Bild (Browser-Canvas-Limits)
export const BAKE_MAX_SIDE = 8192
export const BAKE_MAX_AREA = 40_000_000

/** Neue Box/Umriss eines Bildes nach dem Backen (ohne Pixel). */
export interface BakedPlacement {
  x: number
  y: number
  width: number
  height: number
  shapeQuad: ShapeQuad
}

/**
 * Lage der neuen Bildbox in Collage-Koordinaten. Das Bild wird um seine Mitte
 * transformiert (translate → rotate → flip → skew, siehe applyImageTransform);
 * die neue Box-Mitte ist daher alte Mitte + M · (lokale BBox-Mitte), mit
 * M = Rotation · Spiegelung · Neigung. So bleibt jedes Pixel an seiner Stelle.
 */
export function computeBakedPlacement(img: CollageImage, layout: BakeLayout): BakedPlacement {
  const cx = layout.minX + layout.width / 2
  const cy = layout.minY + layout.height / 2

  // Neigung (ctx.transform(1, tanY, tanX, 1, 0, 0))
  const tanX = Math.tan(((img.skewX ?? 0) * Math.PI) / 180)
  const tanY = Math.tan(((img.skewY ?? 0) * Math.PI) / 180)
  let px = cx + tanX * cy
  let py = tanY * cx + cy
  // Spiegelung
  if (img.flipHorizontal) px = -px
  if (img.flipVertical) py = -py
  // Rotation
  const rad = (img.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const wx = cos * px - sin * py
  const wy = sin * px + cos * py

  const centerX = img.x + img.width / 2 + wx
  const centerY = img.y + img.height / 2 + wy
  return {
    x: centerX - layout.width / 2,
    y: centerY - layout.height / 2,
    width: layout.width,
    height: layout.height,
    shapeQuad: layout.shapeQuad,
  }
}

/**
 * Backt die Verzerrung eines Bildes in ein neues Canvas.
 * @throws wenn das Bild nicht verzerrt ist oder keine Abmessungen hat
 */
export function bakeDistortedImage(
  img: CollageImage,
  htmlImg: HTMLImageElement
): { canvas: HTMLCanvasElement; placement: BakedPlacement } {
  if (!img.distortEnabled || !hasDistortion(img.cornerOffsets)) {
    throw new Error('Bild ist nicht verzerrt')
  }
  const natW = htmlImg.naturalWidth
  const natH = htmlImg.naturalHeight
  if (!natW || !natH || img.width <= 0 || img.height <= 0) {
    throw new Error('Bild hat keine Abmessungen')
  }

  const layout = computeBakeLayout(img.width, img.height, img.cornerOffsets, img.shapeQuad)
  const placement = computeBakedPlacement(img, layout)

  // Zugeschnittene Quelle (Crop wird eingebacken)
  const { sx, sy, sw, sh } = cropSourceRect(natW, natH, img.crop)
  let source: CanvasImageSource = htmlImg
  if (sx !== 0 || sy !== 0 || sw !== natW || sh !== natH) {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(sw))
    c.height = Math.max(1, Math.round(sh))
    c.getContext('2d')!.drawImage(htmlImg, sx, sy, sw, sh, 0, 0, c.width, c.height)
    source = c
  }
  const srcW = source === htmlImg ? natW : (source as HTMLCanvasElement).width
  const srcH = source === htmlImg ? natH : (source as HTMLCanvasElement).height

  // Quell-Auflösung beibehalten (Pixel je Anzeige-Pixel), aber begrenzen
  const densX = srcW / img.width
  const densY = srcH / img.height
  const rawW = layout.width * densX
  const rawH = layout.height * densY
  const k = Math.min(
    1,
    BAKE_MAX_SIDE / Math.max(rawW, rawH),
    Math.sqrt(BAKE_MAX_AREA / (rawW * rawH))
  )

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(rawW * k))
  out.height = Math.max(1, Math.round(rawH * k))
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  // Lokales System → Ausgabepixel: BBox-Ursprung auf 0/0, dann Dichte
  ctx.scale(densX * k, densY * k)
  ctx.translate(-layout.minX, -layout.minY)
  drawWarpedImage(ctx, source, srcW, srcH, layout.corners, BAKE_SUBDIVISIONS)

  return { canvas: out, placement }
}

/** Canvas → PNG-Blob (Transparenz bleibt erhalten). */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG-Export fehlgeschlagen'))),
      'image/png'
    )
  })
}
