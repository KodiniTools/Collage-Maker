/**
 * Zeichnet einen abgerundeten-Rechteck-Pfad in den Kontext (ohne zu füllen
 * oder zu stroken). Der Radius wird auf die halbe Breite/Höhe begrenzt.
 *
 * Wird von Bildschirm-Renderer und Export-Engine gemeinsam genutzt, damit
 * die abgerundeten Canvas-Ecken exakt so exportiert werden wie angezeigt.
 */
export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  if (r === 0) {
    ctx.rect(x, y, width, height)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

/** Begrenzt einen Eckenradius auf einen für die Leinwand gültigen Bereich. */
export function clampCornerRadius(radius: number, width: number, height: number): number {
  if (!Number.isFinite(radius) || radius <= 0) return 0
  return Math.min(radius, Math.floor(Math.min(width, height) / 2))
}
