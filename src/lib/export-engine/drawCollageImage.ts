import type { CollageImage } from '@/types'
import { drawWarpedImage, computeLocalCorners, hasDistortion } from '@/lib/warpImage'
import {
  createFilteredImageSource,
  readFilterParams,
  renderFilteredImage,
  hasAnyFilter,
} from '@/lib/applyImageFilters'
import { hasCrop } from '@/lib/cropImage'

// Gitterauflösung für das freie Verzerren (Distort) im Export. Höher als in der
// Live-Ansicht, da der Export nicht interaktiv ist und Qualität wichtiger ist.
const DISTORT_SUBDIVISIONS = 16

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

  // Freies Verzerren (Distort): gefilterte Quelle in das Viereck warpen. Rahmen,
  // runde Ecken und Schatten entfallen dabei (identisch zur Live-Ansicht).
  if (img.distortEnabled && hasDistortion(img.cornerOffsets)) {
    const params = readFilterParams(img)
    const source = createFilteredImageSource(htmlImg, img.width, img.height, params, img.crop)
    const sw = source === htmlImg ? htmlImg.naturalWidth : (source as HTMLCanvasElement).width
    const sh = source === htmlImg ? htmlImg.naturalHeight : (source as HTMLCanvasElement).height
    const corners = computeLocalCorners(img.width, img.height, img.cornerOffsets)
    drawWarpedImage(ctx, source, sw, sh, corners, DISTORT_SUBDIVISIONS)
    ctx.restore()
    return
  }

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

  // Bildfilter rein pixelbasiert anwenden (Helligkeit/Kontrast/Sättigung
  // eingeschlossen – kein CSS-Filter mehr). Ohne Filter und ohne Zuschnitt
  // wird das Original direkt gezeichnet.
  const params = readFilterParams(img)
  if (hasAnyFilter(params) || hasCrop(img.crop)) {
    const processed = renderFilteredImage(htmlImg, img.width, img.height, params, img.crop)
    ctx.drawImage(processed, x, y, img.width, img.height)
  } else {
    ctx.drawImage(htmlImg, x, y, img.width, img.height)
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
