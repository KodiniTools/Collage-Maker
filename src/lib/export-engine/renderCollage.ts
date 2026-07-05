import type {
  CollageImage,
  CollageText,
  BackgroundImageSettings,
  CanvasBorderSettings,
} from '@/types'
import { drawBackground } from './drawBackground'
import { drawCollageImage } from './drawCollageImage'
import { drawCollageText } from './drawCollageText'
import { drawCanvasBorder } from './drawCanvasBorder'
import { roundedRectPath, clampCornerRadius } from './roundedRect'

export interface RenderOptions {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: BackgroundImageSettings
  images: CollageImage[]
  texts: CollageText[]
  transparent: boolean
  border?: CanvasBorderSettings
  cornerRadius?: number
}

export async function renderCollage(options: RenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')

  canvas.width = options.width
  canvas.height = options.height

  // Abgerundete Ecken: alle Inhalte auf einen abgerundeten Pfad clippen.
  const radius = clampCornerRadius(options.cornerRadius ?? 0, options.width, options.height)

  // Bei nicht-transparenten Formaten (JPEG/WebP/PDF/normales PNG) die Ecken
  // vor dem Clipping mit der Hintergrundfarbe füllen, damit sie nicht
  // transparent (→ bei JPEG schwarz) erscheinen. png-transparent bleibt offen.
  if (radius > 0 && !options.transparent) {
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, options.width, options.height)
  }

  if (radius > 0) {
    ctx.save()
    roundedRectPath(ctx, 0, 0, options.width, options.height, radius)
    ctx.clip()
  }

  // Bei transparentem Export nur die Hintergrundfarbe weglassen; ein gesetztes
  // Hintergrundbild bleibt erhalten (es ist bewusster Inhalt der Collage).
  await drawBackground(
    ctx,
    options.width,
    options.height,
    options.backgroundColor,
    options.backgroundImage,
    !options.transparent
  )

  const sortedImages = [...options.images].sort((a, b) => a.zIndex - b.zIndex)
  for (const img of sortedImages) {
    const htmlImg = new Image()
    htmlImg.src = img.url
    const loaded = await new Promise<boolean>((resolve) => {
      htmlImg.onload = () => resolve(true)
      htmlImg.onerror = () => resolve(false)
    })
    if (!loaded) continue
    drawCollageImage(ctx, img, htmlImg)
  }

  const sortedTexts = [...options.texts].sort((a, b) => a.zIndex - b.zIndex)
  for (const text of sortedTexts) {
    drawCollageText(ctx, text)
  }

  // Clipping der abgerundeten Ecken aufheben, bevor der Rahmen gezeichnet wird
  if (radius > 0) {
    ctx.restore()
  }

  // Rahmen zuletzt zeichnen, damit er über allen Inhalten liegt (folgt der Rundung)
  drawCanvasBorder(ctx, options.width, options.height, options.border, radius)

  return canvas
}
