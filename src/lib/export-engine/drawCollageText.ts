import type { CollageText } from '@/types'

export function drawCollageText(ctx: CanvasRenderingContext2D, text: CollageText): void {
  ctx.save()
  ctx.translate(text.x, text.y)
  ctx.rotate((text.rotation * Math.PI) / 180)

  if (text.shadowEnabled) {
    ctx.shadowOffsetX = text.shadowOffsetX
    ctx.shadowOffsetY = text.shadowOffsetY
    ctx.shadowBlur = text.shadowBlur
    ctx.shadowColor = text.shadowColor
  }

  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
  ctx.fillStyle = text.color
  ctx.textAlign = text.textAlign
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${text.letterSpacing ?? 0}px`

  const lines = text.text.split('\n')
  const lineHeight = text.fontSize * 1.2

  // Stroke zuerst, damit Fill darüber liegt
  if (text.strokeEnabled) {
    ctx.strokeStyle = text.strokeColor
    ctx.lineWidth = text.strokeWidth * 2 // Verdoppeln, da Hälfte vom Fill überdeckt wird
    ctx.lineJoin = 'round'
    ctx.miterLimit = 2
    lines.forEach((line, index) => {
      const y = (index - (lines.length - 1) / 2) * lineHeight
      ctx.strokeText(line, 0, y)
    })
  }

  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * lineHeight
    ctx.fillText(line, 0, y)
  })

  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  ctx.restore()
}
