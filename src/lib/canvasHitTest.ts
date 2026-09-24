import type { CollageImage, CollageText, CornerOffsets } from '@/types'
import { computeLocalCorners, hasDistortion } from '@/lib/warpImage'

/**
 * Reine Trefferprüfung für Bilder und Texte auf der Leinwand (ohne Vue).
 * Alle Koordinaten sind Canvas-Koordinaten. `fit` ist der Anzeige-Zoom
 * (Auto-Fit); Trefferradien werden dadurch geteilt, damit sie auf dem
 * Bildschirm konstant groß bleiben.
 */

export type Corner = 'nw' | 'ne' | 'se' | 'sw'
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** Trefferradius für Skalier-/Verzerr-Griffe in Bildschirm-Pixeln. */
function handleHitRadius(fit: number, touchMode: boolean): number {
  return (touchMode ? 40 : 13) / fit
}

/**
 * Wandelt einen Klickpunkt in das lokale, um die Bildmitte zentrierte
 * Koordinatensystem des Bildes um – inkl. Rotation, Spiegelung und
 * Neigung/Scherung. Muss zur Zeichenreihenfolge im Renderer passen:
 * translate → rotate → scale(flip) → skew.
 */
export function toLocalImagePoint(
  x: number,
  y: number,
  img: CollageImage
): { localX: number; localY: number } {
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2

  // 1) Rotation invertieren
  const angle = (img.rotation * Math.PI) / 180
  const dx = x - centerX
  const dy = y - centerY
  let localX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
  let localY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

  // 2) Spiegelung invertieren (Faktor ±1, selbst-invers)
  localX *= img.flipHorizontal ? -1 : 1
  localY *= img.flipVertical ? -1 : 1

  // 3) Neigung/Scherung invertieren: Matrix [[1, tanX], [tanY, 1]] umkehren
  const tanX = Math.tan(((img.skewX ?? 0) * Math.PI) / 180)
  const tanY = Math.tan(((img.skewY ?? 0) * Math.PI) / 180)
  if (tanX !== 0 || tanY !== 0) {
    let det = 1 - tanX * tanY
    if (Math.abs(det) < 1e-6) det = det < 0 ? -1e-6 : 1e-6
    const sx = localX
    const sy = localY
    localX = (sx - tanX * sy) / det
    localY = (sy - tanY * sx) / det
  }

  return { localX, localY }
}

/** Liefert den getroffenen Skalier-Griff des Bildes oder null. */
export function getResizeHandle(
  x: number,
  y: number,
  img: CollageImage,
  fit: number,
  touchMode = false
): ResizeHandle | null {
  const hitRadius = handleHitRadius(fit, touchMode)
  const { localX, localY } = toLocalImagePoint(x, y, img)

  const handles: { x: number; y: number; name: ResizeHandle }[] = [
    { x: -img.width / 2, y: -img.height / 2, name: 'nw' },
    { x: 0, y: -img.height / 2, name: 'n' },
    { x: img.width / 2, y: -img.height / 2, name: 'ne' },
    { x: img.width / 2, y: 0, name: 'e' },
    { x: img.width / 2, y: img.height / 2, name: 'se' },
    { x: 0, y: img.height / 2, name: 's' },
    { x: -img.width / 2, y: img.height / 2, name: 'sw' },
    { x: -img.width / 2, y: 0, name: 'w' },
  ]

  for (const handle of handles) {
    const distance = Math.sqrt(Math.pow(localX - handle.x, 2) + Math.pow(localY - handle.y, 2))
    if (distance <= hitRadius) return handle.name
  }
  return null
}

// ─── Freies Verzerren (Distort) ──────────────────────────────────────────────

/** Basis-Eckposition (unverzerrt) im lokalen Bildsystem. */
export function baseCorner(img: CollageImage, corner: Corner): { x: number; y: number } {
  const hw = img.width / 2
  const hh = img.height / 2
  switch (corner) {
    case 'nw':
      return { x: -hw, y: -hh }
    case 'ne':
      return { x: hw, y: -hh }
    case 'se':
      return { x: hw, y: hh }
    case 'sw':
      return { x: -hw, y: hh }
  }
}

/** Vollständiges Offsets-Objekt aus dem aktuellen Bild (fehlende Ecken = 0). */
export function currentOffsets(img: CollageImage): CornerOffsets {
  const o = img.cornerOffsets
  return {
    nw: { x: o?.nw.x ?? 0, y: o?.nw.y ?? 0 },
    ne: { x: o?.ne.x ?? 0, y: o?.ne.y ?? 0 },
    se: { x: o?.se.x ?? 0, y: o?.se.y ?? 0 },
    sw: { x: o?.sw.x ?? 0, y: o?.sw.y ?? 0 },
  }
}

/** Prüft, ob ein Distort-Eckpunkt getroffen wurde (lokale, verzerrte Ecken). */
export function getDistortHandle(
  x: number,
  y: number,
  img: CollageImage,
  fit: number,
  touchMode = false
): Corner | null {
  const { localX, localY } = toLocalImagePoint(x, y, img)
  const c = computeLocalCorners(img.width, img.height, img.cornerOffsets)
  const hitRadius = handleHitRadius(fit, touchMode)
  const entries: [Corner, { x: number; y: number }][] = [
    ['nw', c.nw],
    ['ne', c.ne],
    ['se', c.se],
    ['sw', c.sw],
  ]
  for (const [name, p] of entries) {
    if (Math.hypot(localX - p.x, localY - p.y) <= hitRadius) return name
  }
  return null
}

/** Punkt-in-Viereck-Test im lokalen System (für Auswahl verzerrter Bilder). */
function isPointInDistortedImage(x: number, y: number, img: CollageImage): boolean {
  const { localX, localY } = toLocalImagePoint(x, y, img)
  const c = computeLocalCorners(img.width, img.height, img.cornerOffsets)
  const pts = [c.nw, c.ne, c.se, c.sw]
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x
    const yi = pts[i].y
    const xj = pts[j].x
    const yj = pts[j].y
    const intersect =
      yi > localY !== yj > localY && localX < ((xj - xi) * (localY - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Achsenparallele Box des Bildes (ohne Rotation). */
export function isPointInImageBounds(x: number, y: number, img: CollageImage): boolean {
  return x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height
}

/** Trefferzone eines Bildes (verzerrt: Viereck, sonst achsenparallele Box). */
export function isPointInImage(x: number, y: number, img: CollageImage): boolean {
  if (img.distortEnabled && hasDistortion(img.cornerOffsets)) {
    return isPointInDistortedImage(x, y, img)
  }
  return isPointInImageBounds(x, y, img)
}

/** Prüft, ob der Löschbutton (oben rechts im Bild) getroffen wurde. */
export function isDeleteButtonClicked(
  x: number,
  y: number,
  img: CollageImage,
  fit: number,
  touchMode = false
): boolean {
  // Muss zur Zeichnung passen: 14 * ui, innen in der oberen rechten Ecke.
  const drawSize = 14 / fit
  const { localX, localY } = toLocalImagePoint(x, y, img)

  // Position des Löschbuttons im Bild-Koordinatensystem (Mittelpunkt)
  const deleteButtonX = img.width / 2 - drawSize / 2 - 2 / fit
  const deleteButtonY = -img.height / 2 + drawSize / 2 + 2 / fit

  // Trefferradius etwas grösser als der sichtbare Radius (7 / fit), für Touch mehr
  const hitRadius = (touchMode ? 22 : 11) / fit

  const distance = Math.sqrt(
    Math.pow(localX - deleteButtonX, 2) + Math.pow(localY - deleteButtonY, 2)
  )
  return distance <= hitRadius
}

// ─── Text ────────────────────────────────────────────────────────────────────

/**
 * Bounding-Box eines Textes in dessen lokalem (unrotiertem) Koordinatensystem.
 * Muss zur Darstellung im Renderer passen (gleiche Schrift/Metriken).
 */
export function getTextBox(text: CollageText, ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px '${text.fontFamily}'`
  ctx.letterSpacing = `${text.letterSpacing}px`
  const lines: string[] = text.text.split('\n')
  const lineHeight = text.fontSize * 1.2
  const boxHeight = lines.length * lineHeight
  const boxWidth = Math.max(0, ...lines.map((line) => ctx.measureText(line).width))
  ctx.restore()

  let offsetX = 0
  if (text.textAlign === 'center') offsetX = -boxWidth / 2
  else if (text.textAlign === 'right') offsetX = -boxWidth

  return {
    left: offsetX - 5,
    right: offsetX + boxWidth + 5,
    top: -boxHeight / 2 - 5,
    bottom: boxHeight / 2 + 5,
  }
}

/** Prüft, ob ein Eck-Skalierungspunkt des Textes getroffen wurde. */
export function getTextResizeHandle(
  x: number,
  y: number,
  text: CollageText,
  ctx: CanvasRenderingContext2D,
  fit: number,
  touchMode = false
): Corner | null {
  const box = getTextBox(text, ctx)
  const hitRadius = handleHitRadius(fit, touchMode)

  // Klickpunkt ins lokale (unrotierte) Koordinatensystem des Textes transformieren
  const angle = (text.rotation * Math.PI) / 180
  const dx = x - text.x
  const dy = y - text.y
  const localX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
  const localY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

  const corners: { x: number; y: number; name: Corner }[] = [
    { x: box.left, y: box.top, name: 'nw' },
    { x: box.right, y: box.top, name: 'ne' },
    { x: box.right, y: box.bottom, name: 'se' },
    { x: box.left, y: box.bottom, name: 'sw' },
  ]

  for (const corner of corners) {
    if (Math.hypot(localX - corner.x, localY - corner.y) <= hitRadius) return corner.name
  }
  return null
}

/**
 * Klick-Trefferzone eines Textes (achsenparallel, ohne Rotation).
 * Bewusst mit eigener Metrik (ohne fontStyle/letterSpacing) – entspricht dem
 * bisherigen Auswahlverhalten.
 */
export function isPointInText(
  x: number,
  y: number,
  text: CollageText,
  ctx: CanvasRenderingContext2D
): boolean {
  ctx.save()
  ctx.font = `${text.fontWeight} ${text.fontSize}px '${text.fontFamily}'`
  ctx.textAlign = text.textAlign

  const lines = text.text.split('\n')
  const lineHeight = text.fontSize * 1.2
  const totalHeight = lines.length * lineHeight
  const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width))

  let offsetX = 0
  if (text.textAlign === 'center') offsetX = -maxWidth / 2
  else if (text.textAlign === 'right') offsetX = -maxWidth

  const boxX = text.x + offsetX - 5
  const boxY = text.y - totalHeight / 2 - 5
  const boxWidth = maxWidth + 10
  const boxHeight = totalHeight + 10

  ctx.restore()

  return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight
}
