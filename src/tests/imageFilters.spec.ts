import { describe, it, expect } from 'vitest'
import { applyFilterPixels, type ImageFilterParams } from '@/lib/applyImageFilters'

// Neutrale Filter-Parameter (keine Wirkung)
function params(overrides: Partial<ImageFilterParams> = {}): ImageFilterParams {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    highlights: 0,
    shadows: 0,
    warmth: 0,
    sharpness: 0,
    ...overrides,
  }
}

// Einzelnes RGBA-Pixel als Uint8ClampedArray
function px(r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  return new Uint8ClampedArray([r, g, b, a])
}

describe('applyFilterPixels (echte pixelbasierte Filter)', () => {
  it('lässt Pixel bei neutralen Parametern unverändert', () => {
    const data = px(100, 150, 200)
    applyFilterPixels(data, params())
    expect(Array.from(data)).toEqual([100, 150, 200, 255])
  })

  it('Helligkeit 200% verdoppelt die Kanäle (mit Clamping)', () => {
    const data = px(100, 120, 200)
    applyFilterPixels(data, params({ brightness: 200 }))
    // 100*2=200, 120*2=240, 200*2=400 → 255
    expect(Array.from(data)).toEqual([200, 240, 255, 255])
  })

  it('Helligkeit 50% halbiert die Kanäle', () => {
    const data = px(100, 200, 50)
    applyFilterPixels(data, params({ brightness: 50 }))
    expect(Array.from(data)).toEqual([50, 100, 25, 255])
  })

  it('Kontrast 0% setzt alle Kanäle auf Mittelgrau 128', () => {
    const data = px(0, 128, 255)
    applyFilterPixels(data, params({ contrast: 0 }))
    expect(Array.from(data)).toEqual([128, 128, 128, 255])
  })

  it('Sättigung 0% erzeugt Graustufen (Rec.709-Luminanz)', () => {
    const data = px(255, 0, 0)
    applyFilterPixels(data, params({ saturation: 0 }))
    // gray = 0.2126*255 ≈ 54 → r=g=b
    const gray = data[0]
    expect(gray).toBeGreaterThan(50)
    expect(gray).toBeLessThan(60)
    expect(data[1]).toBe(gray)
    expect(data[2]).toBe(gray)
    expect(data[3]).toBe(255)
  })

  it('lässt den Alpha-Kanal unangetastet', () => {
    const data = px(10, 20, 30, 123)
    applyFilterPixels(data, params({ brightness: 150, contrast: 120, saturation: 80 }))
    expect(data[3]).toBe(123)
  })

  it('Wärme verschiebt Rot hoch und Blau runter', () => {
    const data = px(100, 100, 100)
    applyFilterPixels(data, params({ warmth: 100 }))
    expect(data[0]).toBe(130) // +30
    expect(data[1]).toBe(100)
    expect(data[2]).toBe(70) // -30
  })
})
