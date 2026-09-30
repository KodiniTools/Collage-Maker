import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CollageImage, CornerOffsets, Point } from '@/types'
import { computeBakeLayout, insetPolygon, UNIT_SHAPE, computeLocalCorners } from '@/lib/warpImage'
import { computeBakedPlacement } from '@/lib/bakeDistortion'
import { drawCollageImage } from '@/lib/export-engine/drawCollageImage'
import { makeImg } from './helpers/makeImg'

// Backen braucht einen echten Canvas (jsdom hat keinen) → im Ablauf-Test mocken
vi.mock('@/lib/bakeDistortion', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/bakeDistortion')>()
  return {
    ...real,
    bakeDistortedImage: vi.fn((img: CollageImage) => {
      const layout = real.computeBakedPlacement(
        img,
        computeBakeLayout(img.width, img.height, img.cornerOffsets, img.shapeQuad)
      )
      return { canvas: {} as HTMLCanvasElement, placement: layout }
    }),
    canvasToPngBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  }
})

const zero = (): CornerOffsets => ({
  nw: { x: 0, y: 0 },
  ne: { x: 0, y: 0 },
  se: { x: 0, y: 0 },
  sw: { x: 0, y: 0 },
})

const close = (p: Point, q: Point, digits = 9) => {
  expect(p.x).toBeCloseTo(q.x, digits)
  expect(p.y).toBeCloseTo(q.y, digits)
}

describe('computeBakeLayout', () => {
  it('ohne Versätze: Box = Bild, Umriss = Rechteck', () => {
    const l = computeBakeLayout(200, 100, zero())
    expect([l.minX, l.minY, l.width, l.height]).toEqual([-100, -50, 200, 100])
    for (const k of ['nw', 'ne', 'se', 'sw'] as const) close(l.shapeQuad[k], UNIT_SHAPE[k])
  })

  it('nach außen gezogene Ecke vergrößert die Box, Umriss bleibt in 0..1', () => {
    const l = computeBakeLayout(200, 100, { ...zero(), ne: { x: 100, y: -50 } })
    expect(l.width).toBeCloseTo(300)
    expect(l.height).toBeCloseTo(150)
    close(l.shapeQuad.ne, { x: 1, y: 0 })
    close(l.shapeQuad.nw, { x: 0, y: 50 / 150 })
    close(l.shapeQuad.se, { x: 200 / 300, y: 1 })
  })

  it('verzerrt eine vorhandene Umrissform mit', () => {
    const shape = { ...UNIT_SHAPE, nw: { x: 0.5, y: 0 } }
    const l = computeBakeLayout(100, 100, zero(), shape)
    close(l.shapeQuad.nw, { x: 0.5, y: 0 })
  })
})

describe('insetPolygon', () => {
  it('versetzt ein Quadrat gleichmäßig nach innen (unabhängig von der Umlaufrichtung)', () => {
    const cw = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    const expected = [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 8 },
      { x: 2, y: 8 },
    ]
    insetPolygon(cw, 2).forEach((p, i) => close(p, expected[i]))
    const ccw = [...cw].reverse()
    insetPolygon(ccw, 2).forEach((p, i) => close(p, [...expected].reverse()[i]))
  })
})

describe('computeBakedPlacement', () => {
  // Welt-Position eines lokalen Punktes (wie applyImageTransform: R · F · S)
  function world(img: CollageImage, p: Point): Point {
    const tx = Math.tan(((img.skewX ?? 0) * Math.PI) / 180)
    const ty = Math.tan(((img.skewY ?? 0) * Math.PI) / 180)
    let x = p.x + tx * p.y
    let y = ty * p.x + p.y
    if (img.flipHorizontal) x = -x
    if (img.flipVertical) y = -y
    const r = (img.rotation * Math.PI) / 180
    return {
      x: img.x + img.width / 2 + Math.cos(r) * x - Math.sin(r) * y,
      y: img.y + img.height / 2 + Math.sin(r) * x + Math.cos(r) * y,
    }
  }

  it.each([
    { rotation: 0 },
    { rotation: 37, flipHorizontal: true },
    { rotation: -120, flipVertical: true, skewX: 15, skewY: -10 },
  ])('verzerrte Ecken bleiben in der Welt an Ort und Stelle (%o)', (transform) => {
    const offsets: CornerOffsets = {
      nw: { x: 20, y: 10 },
      ne: { x: 60, y: -30 },
      se: { x: -15, y: 25 },
      sw: { x: -40, y: 0 },
    }
    const img = makeImg('a', {
      x: 50,
      y: 80,
      width: 200,
      height: 120,
      ...transform,
      distortEnabled: true,
      cornerOffsets: offsets,
    })
    const layout = computeBakeLayout(img.width, img.height, offsets)
    const placed = computeBakedPlacement(img, layout)
    const baked = makeImg('a', { ...img, ...placed, cornerOffsets: undefined })

    const before = computeLocalCorners(img.width, img.height, offsets)
    for (const k of ['nw', 'ne', 'se', 'sw'] as const) {
      // Neue lokale Position = Umriss in der neuen Box (zentriert)
      const local = {
        x: -placed.width / 2 + placed.shapeQuad[k].x * placed.width,
        y: -placed.height / 2 + placed.shapeQuad[k].y * placed.height,
      }
      close(world(baked, local), world(img, before[k]), 6)
    }
  })
})

describe('drawCollageImage mit Umrissform', () => {
  function record(overrides: Partial<CollageImage>) {
    const log: string[] = []
    const target: Record<string, unknown> = {}
    const ctx = new Proxy(target, {
      get(_t, prop: string) {
        if (prop in target) return target[prop]
        return (...args: unknown[]) => log.push(`${prop}(${args.join(',')})`)
      },
      set(_t, prop: string, value) {
        target[prop] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
    drawCollageImage(ctx, makeImg('a', overrides), {
      naturalWidth: 100,
      naturalHeight: 100,
    } as HTMLImageElement)
    return log
  }

  const shapeQuad = { ...UNIT_SHAPE, nw: { x: 0.5, y: 0.5 } }

  it('Clip, Schatten und Rahmen folgen dem Umriss statt dem Rechteck', () => {
    const log = record({ shapeQuad, shadowEnabled: true, borderEnabled: true, borderWidth: 4 })
    // Bildbox 100×100 zentriert: nw des Umrisses liegt bei (0,0) statt (-50,-50)
    const toNw = log.filter((l) => l === 'lineTo(0,0)')
    expect(toNw.length).toBe(3) // Schatten-Silhouette, Clip, Rahmen
    expect(log).toContain('clip()')
    expect(log.some((l) => l.startsWith('rect('))).toBe(false)
  })

  it('runde Ecken werden entlang des Umrisses gezeichnet', () => {
    const log = record({ shapeQuad, borderRadius: 10 })
    expect(log.filter((l) => l.startsWith('arcTo(')).length).toBe(4)
    expect(log).toContain('clip()')
  })
})

describe('applyDistort (useImageControls)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:baked-${++n}`)
    URL.revokeObjectURL = vi.fn()
    // jsdom lädt keine Bilder → sofortiges onload
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        naturalWidth = 100
        naturalHeight = 100
        set src(_v: string) {
          queueMicrotask(() => this.onload?.())
        }
      }
    )
  })

  async function setup(overrides: Partial<CollageImage>) {
    const { useCollageStore } = await import('@/stores/collage')
    const { useImageControls } = await import('@/composables/useImageControls')
    const collage = useCollageStore()
    const original = makeImg('a', { x: 10, y: 20, width: 100, height: 100, ...overrides })
    collage.images.push(original)
    collage.selectImage('a')
    return { collage, api: useImageControls(), originalFile: original.file }
  }

  it('backt das Bild, beendet den Modus und ist in einem Schritt rückgängig', async () => {
    const offsets = { ...zero(), ne: { x: 50, y: 0 } }
    const { collage, api, originalFile } = await setup({
      distortEnabled: true,
      cornerOffsets: offsets,
      crop: { x: 0.1, y: 0, width: 0.8, height: 1 },
    })
    expect(api.canApplyDistort.value).toBe(true)

    await expect(api.applyDistort()).resolves.toBe(1)
    const img = collage.images[0]
    expect(img.url).toBe('blob:baked-1')
    expect(img.file.type).toBe('image/png')
    expect(img.width).toBeCloseTo(150)
    expect(img.distortEnabled).toBe(false)
    expect(img.cornerOffsets).toBeUndefined()
    expect(img.crop).toBeUndefined()
    expect(img.shapeQuad?.ne).toEqual({ x: 1, y: 0 })
    expect(api.isApplyingDistort.value).toBe(false)

    collage.undo()
    const restored = collage.images[0]
    expect(restored.url).toBe('blob:a')
    expect(restored.distortEnabled).toBe(true)
    expect(restored.shapeQuad).toBeUndefined()
    expect(restored.file).toBe(originalFile)

    collage.redo()
    expect(collage.images[0].url).toBe('blob:baked-1')
    expect(collage.images[0].file?.type).toBe('image/png')
    // Alte Quelle bleibt gültig (Undo/Galerie)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('tut ohne sichtbare Verzerrung nichts', async () => {
    const { collage, api } = await setup({ distortEnabled: true })
    expect(api.canApplyDistort.value).toBe(false)
    await expect(api.applyDistort()).resolves.toBe(0)
    expect(collage.canUndo).toBe(false)
  })
})
