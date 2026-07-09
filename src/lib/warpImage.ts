import type { CornerOffsets, Point } from '@/types'

/**
 * Freies Verzerren (Distort / Eckpunkt-Pinning) für Canvas 2D.
 *
 * Canvas 2D kennt keine echte Perspektive. Ein Bild wird daher in ein beliebiges
 * Viereck gewarpt, indem die Quell-Rechteckfläche in ein N×N-Gitter aus Dreiecken
 * zerlegt wird; jedes Quell-Dreieck wird per Affin-Transformation auf das passende
 * Ziel-Dreieck abgebildet (bilineare Interpolation der 4 Zielecken).
 *
 * Wird von der Live-Ansicht (useCanvasRenderer) UND dem Export (drawCollageImage)
 * genutzt, damit beide identisch aussehen.
 */

/** Die 4 lokalen Zielecken eines verzerrten Bildes. */
export interface QuadCorners {
  nw: Point
  ne: Point
  se: Point
  sw: Point
}

/**
 * Berechnet die lokalen (um die Bildmitte zentrierten) Zielecken aus Bildgröße
 * und Eck-Versätzen. Ohne Versätze ergibt sich das unverzerrte Rechteck.
 */
export function computeLocalCorners(
  width: number,
  height: number,
  offsets?: CornerOffsets
): QuadCorners {
  const hw = width / 2
  const hh = height / 2
  const o = offsets
  return {
    nw: { x: -hw + (o?.nw.x ?? 0), y: -hh + (o?.nw.y ?? 0) },
    ne: { x: hw + (o?.ne.x ?? 0), y: -hh + (o?.ne.y ?? 0) },
    se: { x: hw + (o?.se.x ?? 0), y: hh + (o?.se.y ?? 0) },
    sw: { x: -hw + (o?.sw.x ?? 0), y: hh + (o?.sw.y ?? 0) },
  }
}

/** True, wenn mindestens eine Ecke einen Versatz ≠ 0 hat. */
export function hasDistortion(offsets?: CornerOffsets): boolean {
  if (!offsets) return false
  return (
    offsets.nw.x !== 0 ||
    offsets.nw.y !== 0 ||
    offsets.ne.x !== 0 ||
    offsets.ne.y !== 0 ||
    offsets.se.x !== 0 ||
    offsets.se.y !== 0 ||
    offsets.sw.x !== 0 ||
    offsets.sw.y !== 0
  )
}

/**
 * Affin-Matrix [a, b, c, d, e, f] (Canvas-Reihenfolge), die das Quell-Dreieck
 * s0/s1/s2 exakt auf das Ziel-Dreieck d0/d1/d2 abbildet:
 *   dx = a*sx + c*sy + e
 *   dy = b*sx + d*sy + f
 *
 * Die Determinante hängt nur von den Quellpunkten ab (im Gitter immer ein
 * gültiges Dreieck) → nie eine Division durch 0, egal wie stark die Zielecken
 * verzerrt sind.
 */
export function computeTriangleAffine(
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point
): [number, number, number, number, number, number] {
  // Inverse der um eine 1-Spalte erweiterten Quellmatrix
  const m00 = s0.x,
    m01 = s0.y
  const m10 = s1.x,
    m11 = s1.y
  const m20 = s2.x,
    m21 = s2.y

  const det = m00 * (m11 - m21) - m01 * (m10 - m20) + (m10 * m21 - m20 * m11)

  // Kofaktoren der Inverse (dritte Spalte der Quellmatrix ist [1,1,1])
  const inv00 = (m11 - m21) / det
  const inv01 = (m21 - m01) / det
  const inv02 = (m01 - m11) / det
  const inv10 = (m20 - m10) / det
  const inv11 = (m00 - m20) / det
  const inv12 = (m10 - m00) / det
  const inv20 = (m10 * m21 - m20 * m11) / det
  const inv21 = (m20 * m01 - m00 * m21) / det
  const inv22 = (m00 * m11 - m10 * m01) / det

  const a = inv00 * d0.x + inv01 * d1.x + inv02 * d2.x
  const c = inv10 * d0.x + inv11 * d1.x + inv12 * d2.x
  const e = inv20 * d0.x + inv21 * d1.x + inv22 * d2.x

  const b = inv00 * d0.y + inv01 * d1.y + inv02 * d2.y
  const d = inv10 * d0.y + inv11 * d1.y + inv12 * d2.y
  const f = inv20 * d0.y + inv21 * d1.y + inv22 * d2.y

  return [a, b, c, d, e, f]
}

/** Bilineare Interpolation der 4 Zielecken bei (u,v) ∈ [0,1]². */
function bilerp(corners: QuadCorners, u: number, v: number): Point {
  const topX = corners.nw.x + (corners.ne.x - corners.nw.x) * u
  const topY = corners.nw.y + (corners.ne.y - corners.nw.y) * u
  const botX = corners.sw.x + (corners.se.x - corners.sw.x) * u
  const botY = corners.sw.y + (corners.se.y - corners.sw.y) * u
  return { x: topX + (botX - topX) * v, y: topY + (botY - topY) * v }
}

/** Dreieck geringfügig vom Schwerpunkt weg aufblähen (kaschiert Nähte). */
function expandTriangle(d0: Point, d1: Point, d2: Point, px: number): [Point, Point, Point] {
  const cx = (d0.x + d1.x + d2.x) / 3
  const cy = (d0.y + d1.y + d2.y) / 3
  const push = (p: Point): Point => {
    const dx = p.x - cx
    const dy = p.y - cy
    const len = Math.hypot(dx, dy) || 1
    return { x: p.x + (dx / len) * px, y: p.y + (dy / len) * px }
  }
  return [push(d0), push(d1), push(d2)]
}

function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point,
  expandPx: number
): void {
  const [e0, e1, e2] = expandTriangle(d0, d1, d2, expandPx)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(e0.x, e0.y)
  ctx.lineTo(e1.x, e1.y)
  ctx.lineTo(e2.x, e2.y)
  ctx.closePath()
  ctx.clip()
  const [a, b, c, d, e, f] = computeTriangleAffine(s0, s1, s2, d0, d1, d2)
  ctx.transform(a, b, c, d, e, f)
  // Quelle im Vor-Transform-Raum auf sw×sh legen; die Affine bildet dann exakt
  // auf das Ziel-Dreieck im aktuellen (lokalen) Koordinatensystem ab.
  ctx.drawImage(source, 0, 0, sw, sh)
  ctx.restore()
}

/**
 * Zeichnet `source` verzerrt in das durch `corners` (lokale Koordinaten des
 * aktuellen ctx) definierte Viereck. Der ctx darf bereits transformiert sein
 * (translate/rotate/scale) – die Ecken werden in genau diesem System interpretiert.
 */
export function drawWarpedImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  corners: QuadCorners,
  subdivisions = 10
): void {
  const n = Math.max(1, Math.floor(subdivisions))
  const expandPx = 0.5

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u0 = i / n
      const u1 = (i + 1) / n
      const v0 = j / n
      const v1 = (j + 1) / n

      const s00 = { x: u0 * sw, y: v0 * sh }
      const s10 = { x: u1 * sw, y: v0 * sh }
      const s11 = { x: u1 * sw, y: v1 * sh }
      const s01 = { x: u0 * sw, y: v1 * sh }

      const d00 = bilerp(corners, u0, v0)
      const d10 = bilerp(corners, u1, v0)
      const d11 = bilerp(corners, u1, v1)
      const d01 = bilerp(corners, u0, v1)

      drawTexturedTriangle(ctx, source, sw, sh, s00, s10, s11, d00, d10, d11, expandPx)
      drawTexturedTriangle(ctx, source, sw, sh, s00, s11, s01, d00, d11, d01, expandPx)
    }
  }
}
