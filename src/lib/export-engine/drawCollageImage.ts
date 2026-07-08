import type { CollageImage } from '@/types'

function buildRoundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

function applyPixelFilters(
  htmlImg: HTMLImageElement,
  width: number,
  height: number,
  brightness: number,
  contrast: number,
  saturation: number,
  highlights: number,
  shadows: number,
  warmth: number,
  sharpness: number
): HTMLCanvasElement {
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')!

  const cssFilters: string[] = []
  if (brightness !== 100) cssFilters.push(`brightness(${brightness}%)`)
  if (contrast !== 100) cssFilters.push(`contrast(${contrast}%)`)
  if (saturation !== 100) cssFilters.push(`saturate(${saturation}%)`)
  if (cssFilters.length > 0) tempCtx.filter = cssFilters.join(' ')

  tempCtx.drawImage(htmlImg, 0, 0, width, height)
  tempCtx.filter = 'none'

  const imageData = tempCtx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    const pixelBrightness = (r + g + b) / 3

    if (highlights !== 0) {
      const factor = highlights / 100
      const mask = Math.pow(pixelBrightness / 255, 2)
      const adj = factor * mask * 50
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }
    if (shadows !== 0) {
      const factor = shadows / 100
      const mask = Math.pow(1 - pixelBrightness / 255, 2)
      const adj = factor * mask * 50
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }
    if (warmth !== 0) {
      const factor = warmth / 100
      r = Math.max(0, Math.min(255, r + factor * 30))
      b = Math.max(0, Math.min(255, b - factor * 30))
    }
    if (sharpness !== 0) {
      const factor = sharpness / 100
      const avg = (r + g + b) / 3
      r = Math.max(0, Math.min(255, r + (r - avg) * factor))
      g = Math.max(0, Math.min(255, g + (g - avg) * factor))
      b = Math.max(0, Math.min(255, b + (b - avg) * factor))
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  tempCtx.putImageData(imageData, 0, 0)
  return tempCanvas
}

export function drawCollageImage(
  ctx: CanvasRenderingContext2D,
  img: CollageImage,
  htmlImg: HTMLImageElement
): void {
  ctx.save()
  ctx.translate(img.x + img.width / 2, img.y + img.height / 2)
  ctx.rotate((img.rotation * Math.PI) / 180)

  // Spiegelung (um die Bildmitte) & Neigung/Scherung
  const flipH = img.flipHorizontal ? -1 : 1
  const flipV = img.flipVertical ? -1 : 1
  if (flipH !== 1 || flipV !== 1) ctx.scale(flipH, flipV)
  const skewX = img.skewX ?? 0
  const skewY = img.skewY ?? 0
  if (skewX !== 0 || skewY !== 0) {
    ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0)
  }

  ctx.globalAlpha = img.opacity

  const x = -img.width / 2
  const y = -img.height / 2
  const radius = Math.min(img.borderRadius, img.width / 2, img.height / 2)

  // Schatten + abgerundete Ecken: Pfad-Schatten zuerst
  if (radius > 0 && img.shadowEnabled) {
    ctx.shadowOffsetX = img.shadowOffsetX
    ctx.shadowOffsetY = img.shadowOffsetY
    ctx.shadowBlur = img.shadowBlur
    ctx.shadowColor = img.shadowColor
    buildRoundedPath(ctx, x, y, img.width, img.height, radius)
    ctx.fillStyle = '#000000'
    ctx.fill()
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  } else if (img.shadowEnabled) {
    ctx.shadowOffsetX = img.shadowOffsetX
    ctx.shadowOffsetY = img.shadowOffsetY
    ctx.shadowBlur = img.shadowBlur
    ctx.shadowColor = img.shadowColor
  }

  // Clip-Pfad
  if (radius > 0) {
    buildRoundedPath(ctx, x, y, img.width, img.height, radius)
    ctx.clip()
  }

  // Bildfilter anwenden
  const brightness = img.brightness ?? 100
  const contrast = img.contrast ?? 100
  const saturation = img.saturation ?? 100
  const highlights = img.highlights ?? 0
  const shadows = img.shadows ?? 0
  const warmth = img.warmth ?? 0
  const sharpness = img.sharpness ?? 0

  const needsPixelFilters = highlights !== 0 || shadows !== 0 || warmth !== 0 || sharpness !== 0

  if (needsPixelFilters) {
    const processed = applyPixelFilters(
      htmlImg,
      img.width,
      img.height,
      brightness,
      contrast,
      saturation,
      highlights,
      shadows,
      warmth,
      sharpness
    )
    ctx.drawImage(processed, x, y, img.width, img.height)
  } else {
    const cssFilters: string[] = []
    if (brightness !== 100) cssFilters.push(`brightness(${brightness}%)`)
    if (contrast !== 100) cssFilters.push(`contrast(${contrast}%)`)
    if (saturation !== 100) cssFilters.push(`saturate(${saturation}%)`)
    if (cssFilters.length > 0) ctx.filter = cssFilters.join(' ')
    ctx.drawImage(htmlImg, x, y, img.width, img.height)
    ctx.filter = 'none'
  }

  // Schatten zurücksetzen (für Bilder ohne rounded corners)
  if (img.shadowEnabled && radius === 0) {
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  }

  // Border zeichnen
  if (img.borderEnabled) {
    if (img.borderShadowEnabled) {
      ctx.shadowOffsetX = img.borderShadowOffsetX
      ctx.shadowOffsetY = img.borderShadowOffsetY
      ctx.shadowBlur = img.borderShadowBlur
      ctx.shadowColor = img.borderShadowColor
    } else if (img.shadowEnabled) {
      ctx.shadowOffsetX = img.shadowOffsetX
      ctx.shadowOffsetY = img.shadowOffsetY
      ctx.shadowBlur = img.shadowBlur
      ctx.shadowColor = img.shadowColor
    }

    if (radius > 0) {
      buildRoundedPath(ctx, x, y, img.width, img.height, radius)
    } else {
      ctx.beginPath()
      ctx.rect(x, y, img.width, img.height)
    }

    ctx.strokeStyle = img.borderColor
    ctx.lineWidth = img.borderWidth

    if (img.borderStyle === 'dashed') {
      ctx.setLineDash([10, 5])
    } else if (img.borderStyle === 'dotted') {
      ctx.setLineDash([2, 3])
    } else if (img.borderStyle === 'double') {
      ctx.setLineDash([])
      ctx.lineWidth = img.borderWidth / 3
      ctx.stroke()
      const offset = img.borderWidth * 0.66
      ctx.beginPath()
      if (radius > 0) {
        const innerRadius = Math.max(0, radius - offset)
        buildRoundedPath(
          ctx,
          x + offset,
          y + offset,
          img.width - offset * 2,
          img.height - offset * 2,
          innerRadius
        )
      } else {
        ctx.rect(x + offset, y + offset, img.width - offset * 2, img.height - offset * 2)
      }
    } else {
      ctx.setLineDash([])
    }

    ctx.stroke()
    ctx.setLineDash([])
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  }

  ctx.restore()
}
