import type { BackgroundImageSettings } from '@/types'

/**
 * Zentrierte Zielfläche für ein Bild: 'cover' füllt die Fläche komplett aus
 * (kann beschneiden), 'contain' zeigt das ganze Bild (kann Leerräume lassen).
 */
export function computeFitRect(
  fit: 'cover' | 'contain',
  areaWidth: number,
  areaHeight: number,
  imgWidth: number,
  imgHeight: number
): { x: number; y: number; width: number; height: number } {
  const pick = fit === 'cover' ? Math.max : Math.min
  const scale = pick(areaWidth / imgWidth, areaHeight / imgHeight)
  const width = imgWidth * scale
  const height = imgHeight * scale
  return { x: (areaWidth - width) / 2, y: (areaHeight - height) / 2, width, height }
}

export async function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  backgroundColor: string,
  bgSettings: BackgroundImageSettings,
  // Bei transparentem Export die Farbfüllung überspringen, das
  // Hintergrundbild aber weiterhin zeichnen (es ist bewusster Inhalt).
  fillColor = true
): Promise<void> {
  if (fillColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  if (!bgSettings.url) return

  const img = new Image()
  img.src = bgSettings.url
  const loaded = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
  })
  if (!loaded) return

  const imgWidth = img.naturalWidth
  const imgHeight = img.naturalHeight

  ctx.save()

  const filters: string[] = []
  if (bgSettings.brightness !== 100) filters.push(`brightness(${bgSettings.brightness}%)`)
  if (bgSettings.contrast !== 100) filters.push(`contrast(${bgSettings.contrast}%)`)
  if (bgSettings.saturation !== 100) filters.push(`saturate(${bgSettings.saturation}%)`)
  if (bgSettings.blur > 0) filters.push(`blur(${bgSettings.blur}px)`)
  if (filters.length > 0) ctx.filter = filters.join(' ')

  ctx.globalAlpha = bgSettings.opacity

  if (bgSettings.fit === 'cover' || bgSettings.fit === 'contain') {
    const r = computeFitRect(bgSettings.fit, canvasWidth, canvasHeight, imgWidth, imgHeight)
    ctx.drawImage(img, r.x, r.y, r.width, r.height)
  } else if (bgSettings.fit === 'tile') {
    ctx.filter = 'none'
    const pattern = ctx.createPattern(img, 'repeat')
    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  } else {
    // stretch
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  }

  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.restore()
}
