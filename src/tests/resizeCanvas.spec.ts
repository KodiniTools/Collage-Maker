import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage, CollageText } from '@/types'

function makeText(id: string, overrides: Partial<CollageText> = {}): CollageText {
  return {
    id,
    text: 'Hallo',
    x: 100,
    y: 200,
    fontSize: 48,
    fontFamily: 'Arial',
    color: '#000',
    rotation: 0,
    zIndex: 0,
    fontWeight: 400,
    fontStyle: 'normal',
    textAlign: 'center',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000',
    strokeEnabled: false,
    strokeColor: '#fff',
    strokeWidth: 2,
    letterSpacing: 0,
    ...overrides,
  }
}

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

  it('scales text position and font size proportionally', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t'))
    // 700x740 -> beide verdoppeln
    collage.resizeCanvas(1400, 1480)

    const txt = collage.texts[0]
    expect(txt.x).toBeCloseTo(200) // 100 * 2
    expect(txt.y).toBeCloseTo(400) // 200 * 2
    expect(txt.fontSize).toBeCloseTo(96) // 48 * sqrt(2*2) = 48 * 2
  })

  it('uses the geometric mean for font size on non-uniform resize', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t'))
    // Breite verdoppeln, Höhe halbieren -> Flächenverhältnis 1 -> fontSize gleich
    collage.resizeCanvas(1400, 370)

    const txt = collage.texts[0]
    expect(txt.fontSize).toBeCloseTo(48) // 48 * sqrt(2 * 0.5) = 48
  })

  it('keeps text font size exact across intermediate steps (telescoping)', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t'))
    collage.resizeCanvas(1, 740)
    collage.resizeCanvas(14, 740)
    collage.resizeCanvas(1400, 740)

    // Netto: sqrt((1400/700) * (740/740)) = sqrt(2)
    expect(collage.texts[0].fontSize).toBeCloseTo(48 * Math.SQRT2)
  })

  it('ignores invalid target sizes (0 / NaN) and keeps content intact', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    collage.texts.push(makeText('t'))

    collage.resizeCanvas(0, 740)
    collage.resizeCanvas(Number.NaN, 740)

    expect(collage.settings.width).toBe(700)
    expect(collage.images[0].width).toBe(300)
    expect(collage.texts[0].fontSize).toBe(48)
  })
})
