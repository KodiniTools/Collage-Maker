import { describe, it, expect } from 'vitest'
import { fitWithin } from '@/utils/imageCompression'

describe('fitWithin', () => {
  it('lässt kleinere Bilder unverändert', () => {
    expect(fitWithin(300, 200, 400)).toEqual({ width: 300, height: 200 })
    expect(fitWithin(400, 400, 400)).toEqual({ width: 400, height: 400 })
  })

  it('begrenzt Querformat auf die Breite', () => {
    expect(fitWithin(1000, 500, 400)).toEqual({ width: 400, height: 200 })
  })

  it('begrenzt Hochformat auf die Höhe', () => {
    expect(fitWithin(500, 1000, 400)).toEqual({ width: 200, height: 400 })
  })

  it('behandelt quadratische Bilder', () => {
    expect(fitWithin(800, 800, 400)).toEqual({ width: 400, height: 400 })
  })

  it('rundet auf ganze Pixel', () => {
    expect(fitWithin(1000, 333, 400)).toEqual({ width: 400, height: 133 })
  })
})
