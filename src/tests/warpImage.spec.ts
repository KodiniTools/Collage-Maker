import { describe, it, expect } from 'vitest'
import { computeTriangleAffine, computeLocalCorners, hasDistortion } from '@/lib/warpImage'
import type { CornerOffsets, Point } from '@/types'

// Wendet die Canvas-Affine [a,b,c,d,e,f] auf einen Punkt an:
//   x' = a*x + c*y + e ; y' = b*x + d*y + f
function apply(m: [number, number, number, number, number, number], p: Point): Point {
  const [a, b, c, d, e, f] = m
  return { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f }
}

function expectClose(actual: Point, expected: Point, eps = 1e-9) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThan(eps)
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(eps)
}

describe('computeTriangleAffine', () => {
  it('bildet die drei Quell-Ecken exakt auf die Ziel-Ecken ab', () => {
    const s0 = { x: 0, y: 0 }
    const s1 = { x: 100, y: 0 }
    const s2 = { x: 0, y: 50 }
    // beliebig verschobenes/verzerrtes Ziel-Dreieck
    const d0 = { x: 10, y: 5 }
    const d1 = { x: 220, y: 30 }
    const d2 = { x: -15, y: 90 }

    const m = computeTriangleAffine(s0, s1, s2, d0, d1, d2)
    expectClose(apply(m, s0), d0)
    expectClose(apply(m, s1), d1)
    expectClose(apply(m, s2), d2)
  })

  it('liefert die Identität, wenn Quelle == Ziel', () => {
    const s0 = { x: 0, y: 0 }
    const s1 = { x: 100, y: 0 }
    const s2 = { x: 0, y: 50 }
    const [a, b, c, d, e, f] = computeTriangleAffine(s0, s1, s2, s0, s1, s2)
    expect(a).toBeCloseTo(1, 9)
    expect(b).toBeCloseTo(0, 9)
    expect(c).toBeCloseTo(0, 9)
    expect(d).toBeCloseTo(1, 9)
    expect(e).toBeCloseTo(0, 9)
    expect(f).toBeCloseTo(0, 9)
  })

  it('interpoliert Punkte innerhalb des Dreiecks linear', () => {
    const s0 = { x: 0, y: 0 }
    const s1 = { x: 10, y: 0 }
    const s2 = { x: 0, y: 10 }
    const d0 = { x: 0, y: 0 }
    const d1 = { x: 20, y: 0 } // doppelte Breite
    const d2 = { x: 0, y: 10 }
    const m = computeTriangleAffine(s0, s1, s2, d0, d1, d2)
    // Quell-Mittelpunkt der Kante s0->s1 landet bei der halben Ziel-Kante
    expectClose(apply(m, { x: 5, y: 0 }), { x: 10, y: 0 })
  })
})

describe('computeLocalCorners', () => {
  it('ergibt ohne Versätze das um die Mitte zentrierte Rechteck', () => {
    const c = computeLocalCorners(200, 100)
    expectClose(c.nw, { x: -100, y: -50 })
    expectClose(c.ne, { x: 100, y: -50 })
    expectClose(c.se, { x: 100, y: 50 })
    expectClose(c.sw, { x: -100, y: 50 })
  })

  it('addiert die Eck-Versätze auf die Basisecken', () => {
    const offsets: CornerOffsets = {
      nw: { x: 5, y: -3 },
      ne: { x: 0, y: 0 },
      se: { x: -10, y: 4 },
      sw: { x: 2, y: 2 },
    }
    const c = computeLocalCorners(200, 100, offsets)
    expectClose(c.nw, { x: -95, y: -53 })
    expectClose(c.se, { x: 90, y: 54 })
  })
})

describe('hasDistortion', () => {
  it('ist false ohne Versätze oder bei allen 0', () => {
    expect(hasDistortion(undefined)).toBe(false)
    expect(
      hasDistortion({
        nw: { x: 0, y: 0 },
        ne: { x: 0, y: 0 },
        se: { x: 0, y: 0 },
        sw: { x: 0, y: 0 },
      })
    ).toBe(false)
  })

  it('ist true, sobald eine Ecke versetzt ist', () => {
    expect(
      hasDistortion({
        nw: { x: 0, y: 0 },
        ne: { x: 0, y: 0 },
        se: { x: 0, y: 1 },
        sw: { x: 0, y: 0 },
      })
    ).toBe(true)
  })
})
