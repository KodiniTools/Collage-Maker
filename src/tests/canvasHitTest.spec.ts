import { describe, it, expect } from 'vitest'
import {
  toLocalImagePoint,
  getResizeHandle,
  isPointInImage,
  isDeleteButtonClicked,
} from '@/lib/canvasHitTest'
import { applyResizeSnap, computeResize, meetsMinSize } from '@/lib/resizeGeometry'
import { makeImg } from './helpers/makeImg'

// Bild 100–300 × 100–200, Mitte (200|150)
const base = { x: 100, y: 100, width: 200, height: 100 }

describe('canvasHitTest', () => {
  it('rechnet in das lokale, zentrierte Bildsystem um', () => {
    expect(toLocalImagePoint(250, 175, makeImg('a', base))).toEqual({ localX: 50, localY: 25 })
  })

  it('berücksichtigt die Spiegelung', () => {
    const img = makeImg('a', { ...base, flipHorizontal: true })
    expect(toLocalImagePoint(250, 175, img)).toEqual({ localX: -50, localY: 25 })
  })

  it('invertiert die Scherung', () => {
    const img = makeImg('a', { ...base, skewX: 45 })
    const p = toLocalImagePoint(250, 175, img)
    // Scherung x' = x + tan(45°)·y → Rückrechnung x = 50 − 25
    expect(p.localX).toBeCloseTo(25)
    expect(p.localY).toBeCloseTo(25)
  })

  it('skaliert den Trefferradius mit dem Zoom', () => {
    const img = makeImg('a', base)
    // 20px neben der SE-Ecke: Radius 13 (fit 1) verfehlt, 26 (fit 0.5) trifft
    expect(getResizeHandle(320, 200, img, 1)).toBeNull()
    expect(getResizeHandle(320, 200, img, 0.5)).toBe('se')
    expect(getResizeHandle(320, 200, img, 1, true)).toBe('se')
  })

  it('erkennt Punkte in verzerrten Bildern über das Viereck', () => {
    const img = makeImg('a', {
      ...base,
      distortEnabled: true,
      cornerOffsets: {
        nw: { x: 0, y: 0 },
        ne: { x: 0, y: 0 },
        se: { x: 100, y: 0 },
        sw: { x: 0, y: 0 },
      },
    })
    // Rechts außerhalb der Box, aber innerhalb der nach rechts gezogenen SE-Ecke
    expect(isPointInImage(350, 195, img)).toBe(true)
    expect(isPointInImage(350, 105, img)).toBe(false)
  })

  it('findet den Löschbutton oben rechts', () => {
    const img = makeImg('a', base)
    // Mitte bei fit 1: lokal (100−7−2 | −50+7+2) = (91|−41) → Canvas (291|109)
    expect(isDeleteButtonClicked(291, 109, img, 1)).toBe(true)
    expect(isDeleteButtonClicked(200, 150, img, 1)).toBe(false)
  })
})

describe('resizeGeometry', () => {
  const start = { x: 0, y: 0, width: 200, height: 100 }

  it('SE ohne Sperre', () => {
    expect(computeResize('se', start, 20, 10, false, 2)).toEqual({
      x: 0,
      y: 0,
      width: 220,
      height: 110,
    })
  })

  it('W mit Sperre passt die Höhe zentriert an', () => {
    expect(computeResize('w', start, -20, 0, true, 2)).toEqual({
      x: -20,
      y: -5,
      width: 220,
      height: 110,
    })
  })

  it('Snap links/oben verschiebt Position und hält die Gegenkante', () => {
    expect(
      applyResizeSnap(
        { x: 10, y: 10, width: 100, height: 50 },
        { snapLeft: 0, snapRight: null, snapTop: 5, snapBottom: null }
      )
    ).toEqual({ x: 0, y: 5, width: 110, height: 55 })
  })

  it('prüft die Mindestgröße', () => {
    expect(meetsMinSize({ x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    expect(meetsMinSize({ x: 0, y: 0, width: 19, height: 50 })).toBe(false)
  })
})
