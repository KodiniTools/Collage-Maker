import { describe, it, expect, vi } from 'vitest'
import { drawCanvasBorder } from '@/lib/export-engine/drawCanvasBorder'
import type { CanvasBorderSettings } from '@/types'

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    strokeRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '' as CanvasLineCap,
  } as unknown as CanvasRenderingContext2D & {
    strokeRect: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
  }
}

const base: CanvasBorderSettings = { enabled: true, width: 20, color: '#123456', style: 'solid' }

describe('drawCanvasBorder', () => {
  it('draws nothing when disabled', () => {
    const ctx = makeCtx()
    drawCanvasBorder(ctx, 700, 740, { ...base, enabled: false })
    expect((ctx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0)
    expect((ctx.save as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0)
  })

  it('draws nothing when width is 0 or border missing', () => {
    const ctx = makeCtx()
    drawCanvasBorder(ctx, 700, 740, { ...base, width: 0 })
    drawCanvasBorder(ctx, 700, 740, undefined)
    expect((ctx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0)
  })

  it('strokes a rect inset by half the width so it stays inside the canvas', () => {
    const ctx = makeCtx()
    drawCanvasBorder(ctx, 700, 740, base) // width 20 -> inset 10
    const calls = (ctx.strokeRect as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.length).toBe(1)
    expect(calls[0]).toEqual([10, 10, 680, 720])
    expect(ctx.lineWidth).toBe(20)
    expect(ctx.strokeStyle).toBe('#123456')
  })

  it('draws two inset rects for the double style', () => {
    const ctx = makeCtx()
    drawCanvasBorder(ctx, 700, 740, { ...base, style: 'double' })
    const calls = (ctx.strokeRect as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.length).toBe(2)
  })
})
