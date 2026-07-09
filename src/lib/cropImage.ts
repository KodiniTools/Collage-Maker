import type { CropRect } from '@/types'

/** Voller (ungeschnittener) Zuschnitt. */
export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 }

/** Kleinste zulässige Kantenlänge eines Zuschnitts (verhindert 0-Flächen). */
export const MIN_CROP_SIZE = 0.05

/** True, wenn der Zuschnitt tatsächlich einen Teil des Bildes ausblendet. */
export function hasCrop(crop?: CropRect): boolean {
  if (!crop) return false
  return crop.x !== 0 || crop.y !== 0 || crop.width !== 1 || crop.height !== 1
}

/** Zuschnitt auf gültige Grenzen (0..1, Mindestgröße) beschneiden. */
export function clampCrop(crop: CropRect): CropRect {
  const width = Math.min(1, Math.max(MIN_CROP_SIZE, crop.width))
  const height = Math.min(1, Math.max(MIN_CROP_SIZE, crop.height))
  const x = Math.min(1 - width, Math.max(0, crop.x))
  const y = Math.min(1 - height, Math.max(0, crop.y))
  return { x, y, width, height }
}

/**
 * Berechnet das Quell-Rechteck (in Pixeln des Originalbildes) für einen Zuschnitt.
 * Wird an die 9-Argument-Variante von ctx.drawImage übergeben.
 */
export function cropSourceRect(
  naturalWidth: number,
  naturalHeight: number,
  crop?: CropRect
): { sx: number; sy: number; sw: number; sh: number } {
  const c = crop ?? FULL_CROP
  return {
    sx: c.x * naturalWidth,
    sy: c.y * naturalHeight,
    sw: c.width * naturalWidth,
    sh: c.height * naturalHeight,
  }
}
