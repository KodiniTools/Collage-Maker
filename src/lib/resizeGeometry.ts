import type { ResizeHandle } from '@/lib/canvasHitTest'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface ResizeSnap {
  snapLeft: number | null
  snapRight: number | null
  snapTop: number | null
  snapBottom: number | null
}

/** Mindestbreite/-höhe eines Bildes beim Skalieren in px. */
export const MIN_IMAGE_SIZE = 20

/**
 * Neues Rechteck beim Ziehen eines Skalier-Griffs um (dx|dy).
 * Mit `keepAspectRatio` skalieren Eck-Griffe um den Mittelwert beider
 * Achsen; Kanten-Griffe passen die andere Achse zentriert an.
 */
export function computeResize(
  handle: ResizeHandle,
  start: Rect,
  dx: number,
  dy: number,
  keepAspectRatio: boolean,
  aspectRatio: number
): Rect {
  let { x, y, width, height } = start

  // Gemeinsame Skalierung für Eck-Griffe mit Sperre
  const averaged = () => {
    const avgChange = (width / start.width + height / start.height) / 2
    width = start.width * avgChange
    height = start.height * avgChange
  }

  switch (handle) {
    case 'nw':
      width = start.width - dx
      height = start.height - dy
      x = start.x + dx
      y = start.y + dy
      if (keepAspectRatio) {
        averaged()
        x = start.x + (start.width - width)
        y = start.y + (start.height - height)
      }
      break
    case 'n':
      height = start.height - dy
      y = start.y + dy
      if (keepAspectRatio) {
        width = height * aspectRatio
        x = start.x - (width - start.width) / 2
      }
      break
    case 'ne':
      width = start.width + dx
      height = start.height - dy
      y = start.y + dy
      if (keepAspectRatio) {
        averaged()
        y = start.y + (start.height - height)
      }
      break
    case 'e':
      width = start.width + dx
      if (keepAspectRatio) {
        height = width / aspectRatio
        y = start.y - (height - start.height) / 2
      }
      break
    case 'se':
      width = start.width + dx
      height = start.height + dy
      if (keepAspectRatio) averaged()
      break
    case 's':
      height = start.height + dy
      if (keepAspectRatio) {
        width = height * aspectRatio
        x = start.x - (width - start.width) / 2
      }
      break
    case 'sw':
      width = start.width - dx
      height = start.height + dy
      x = start.x + dx
      if (keepAspectRatio) {
        averaged()
        x = start.x + (start.width - width)
      }
      break
    case 'w':
      width = start.width - dx
      x = start.x + dx
      if (keepAspectRatio) {
        height = width / aspectRatio
        y = start.y - (height - start.height) / 2
      }
      break
  }

  return { x, y, width, height }
}

/** Wendet eingerastete Kanten (Smart Guides) auf ein Rechteck an. */
export function applyResizeSnap(rect: Rect, snap: ResizeSnap): Rect {
  let { x, y, width, height } = rect
  if (snap.snapLeft !== null) {
    // Linke Kante snappt - Position und Breite anpassen
    const oldRight = x + width
    x = snap.snapLeft
    width = oldRight - x
  }
  if (snap.snapRight !== null) {
    // Rechte Kante snappt - nur Breite anpassen
    width = snap.snapRight - x
  }
  if (snap.snapTop !== null) {
    // Obere Kante snappt - Position und Höhe anpassen
    const oldBottom = y + height
    y = snap.snapTop
    height = oldBottom - y
  }
  if (snap.snapBottom !== null) {
    // Untere Kante snappt - nur Höhe anpassen
    height = snap.snapBottom - y
  }
  return { x, y, width, height }
}

export function meetsMinSize(rect: Rect): boolean {
  return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE
}
