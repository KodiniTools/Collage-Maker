import { describe, it, expect } from 'vitest'
import { FULL_CROP, clampCrop, hasCrop, cropSourceRect } from '@/lib/cropImage'
import type { CropRect } from '@/types'

describe('hasCrop', () => {
  it('erkennt das Vollbild als nicht zugeschnitten', () => {
    expect(hasCrop(undefined)).toBe(false)
    expect(hasCrop(FULL_CROP)).toBe(false)
    expect(hasCrop({ x: 0, y: 0, width: 1, height: 1 })).toBe(false)
  })

  it('erkennt einen echten Zuschnitt', () => {
    expect(hasCrop({ x: 0.1, y: 0, width: 0.9, height: 1 })).toBe(true)
    expect(hasCrop({ x: 0, y: 0, width: 0.5, height: 0.5 })).toBe(true)
  })
})

describe('clampCrop', () => {
  it('erzwingt Mindestgröße und hält den Ausschnitt im Bild', () => {
    const c = clampCrop({ x: 0.9, y: 0.9, width: -0.5, height: -0.5 })
    expect(c.width).toBeGreaterThanOrEqual(0.05)
    expect(c.height).toBeGreaterThanOrEqual(0.05)
    expect(c.x + c.width).toBeLessThanOrEqual(1 + 1e-9)
    expect(c.y + c.height).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('lässt gültige Werte unverändert', () => {
    const valid: CropRect = { x: 0.2, y: 0.1, width: 0.5, height: 0.6 }
    expect(clampCrop(valid)).toEqual(valid)
  })
})

describe('cropSourceRect', () => {
  it('liefert das gesamte Bild ohne Zuschnitt', () => {
    expect(cropSourceRect(800, 600)).toEqual({ sx: 0, sy: 0, sw: 800, sh: 600 })
  })

  it('rechnet normierte Werte in Quell-Pixel um', () => {
    const r = cropSourceRect(800, 600, { x: 0.25, y: 0.5, width: 0.5, height: 0.25 })
    expect(r).toEqual({ sx: 200, sy: 300, sw: 400, sh: 150 })
  })
})
