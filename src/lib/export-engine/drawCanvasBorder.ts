import type { CanvasBorderSettings } from '@/types'
import { roundedRectPath } from './roundedRect'

/**
 * Zeichnet einen Rahmen entlang der Leinwandkanten. Wird sowohl vom
 * Bildschirm-Renderer als auch von der Export-Engine verwendet, damit der
 * Rahmen exakt so exportiert wird, wie er angezeigt wird.
 *
 * Der Rahmen wird nach innen gezeichnet (Mittellinie um width/2 eingerückt),
 * sodass er vollständig innerhalb der Leinwand liegt und nicht abgeschnitten
 * wird. Bei abgerundeten Ecken (cornerRadius > 0) folgt er der Rundung.
 */
export function drawCanvasBorder(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  border: CanvasBorderSettings | undefined | null,
  cornerRadius = 0
): void {
  if (!border || !border.enabled || border.width <= 0) return

  const w = border.width

  ctx.save()
  ctx.strokeStyle = border.color

  if (border.style === 'double') {
    // Zwei dünne Linien mit Lücke dazwischen (jede ein Drittel der Breite)
    const line = w / 3
    ctx.lineWidth = line
    ctx.setLineDash([])
    strokeInset(ctx, canvasWidth, canvasHeight, line / 2, cornerRadius)
    strokeInset(ctx, canvasWidth, canvasHeight, w - line / 2, cornerRadius)
  } else {
    ctx.lineWidth = w
    if (border.style === 'dashed') {
      ctx.lineCap = 'butt'
      ctx.setLineDash([w * 1.8, w * 1.2])
    } else if (border.style === 'dotted') {
      ctx.lineCap = 'round'
      // Kurze Segmente mit runden Enden ergeben Punkte
      ctx.setLineDash([w * 0.05, w * 1.6])
    } else {
      ctx.setLineDash([])
    }
    strokeInset(ctx, canvasWidth, canvasHeight, w / 2, cornerRadius)
  }

  ctx.restore()
}

function strokeInset(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  inset: number,
  cornerRadius: number
): void {
  // Radius konzentrisch mit der Einrückung verkleinern
  const r = cornerRadius - inset
  if (r > 0) {
    roundedRectPath(ctx, inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2, r)
    ctx.stroke()
  } else {
    ctx.strokeRect(inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2)
  }
}
