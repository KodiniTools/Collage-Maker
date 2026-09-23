import { describe, it, expect } from 'vitest'
import { computeFitRect } from '@/lib/export-engine/drawBackground'

describe('computeFitRect', () => {
  it('cover füllt die Fläche und zentriert den Überstand', () => {
    expect(computeFitRect('cover', 400, 200, 100, 100)).toEqual({
      x: 0,
      y: -100,
      width: 400,
      height: 400,
    })
  })

  it('contain zeigt das ganze Bild zentriert', () => {
    expect(computeFitRect('contain', 400, 200, 100, 100)).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 200,
    })
  })
})
