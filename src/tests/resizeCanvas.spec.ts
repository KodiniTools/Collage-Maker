import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage } from '@/types'

function makeImg(id: string, overrides: Partial<CollageImage> = {}): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 100,
    y: 200,
    width: 300,
    height: 150,
    rotation: 0,
    zIndex: 0,
    opacity: 1,
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    borderShadowEnabled: false,
    borderShadowOffsetX: 0,
    borderShadowOffsetY: 0,
    borderShadowBlur: 0,
    borderShadowColor: '#000',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000',
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0,
    ...overrides,
  }
}

describe('resizeCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('scales canvas images proportionally to the new size', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    // Standard 700x740 -> Breite verdoppeln, Höhe halbieren
    collage.resizeCanvas(1400, 370)

    const img = collage.images[0]
    expect(collage.settings.width).toBe(1400)
    expect(collage.settings.height).toBe(370)
    expect(img.x).toBeCloseTo(200) // 100 * 2
    expect(img.width).toBeCloseTo(600) // 300 * 2
    expect(img.y).toBeCloseTo(100) // 200 * 0.5
    expect(img.height).toBeCloseTo(75) // 150 * 0.5
  })

  it('keeps the net scaling exact across intermediate steps (telescoping)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    // Wie bei der Zahleneingabe: 700 -> 1 -> 14 -> 1400
    collage.resizeCanvas(1, 740)
    collage.resizeCanvas(14, 740)
    collage.resizeCanvas(1400, 740)

    const img = collage.images[0]
    expect(img.x).toBeCloseTo(200) // net 1400/700 = 2 -> 100*2
    expect(img.width).toBeCloseTo(600) // 300*2
  })

  it('does not scale gallery templates', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, x: 10, width: 200 }))
    collage.resizeCanvas(1400, 740)

    const tpl = collage.images[0]
    expect(tpl.x).toBe(10)
    expect(tpl.width).toBe(200)
  })
})
