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

export interface RenderOptions {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: BackgroundImageSettings
  images: CollageImage[]
  texts: CollageText[]
  transparent: boolean
  border?: CanvasBorderSettings
}

export async function renderCollage(options: RenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')

  canvas.width = options.width
  canvas.height = options.height

  if (!options.transparent) {
    await drawBackground(ctx, options.width, options.height, options.backgroundColor, options.backgroundImage)
  }

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

  // Rahmen zuletzt zeichnen, damit er über allen Inhalten liegt
  drawCanvasBorder(ctx, options.width, options.height, options.border)

  return canvas
}
