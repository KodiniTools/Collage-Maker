import type { BackgroundImageSettings } from '@/types'

export async function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  backgroundColor: string,
  bgSettings: BackgroundImageSettings
): Promise<void> {
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

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

  if (bgSettings.fit === 'cover') {
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else if (bgSettings.fit === 'contain') {
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
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
