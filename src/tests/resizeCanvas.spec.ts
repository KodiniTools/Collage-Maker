import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage, CollageText } from '@/types'

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
    flipHorizontal: false,
    flipVertical: false,
    skewX: 0,
    skewY: 0,
    ...overrides,
  }
}

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

describe('resizeCanvas (scale content option)', () => {
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

  it('keeps the net image scaling exact across intermediate steps (telescoping)', () => {
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

describe('repositionContent (scale content option OFF)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('scales the whole composition uniformly and centers it on height change', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { x: 100, y: 600, width: 300, height: 100 }))
    // Höhe halbieren -> einheitlicher Faktor = ratioY = 0.5
    collage.repositionContent(700, 370)

    const img = collage.images[0]
    expect(collage.settings.width).toBe(700)
    expect(collage.settings.height).toBe(370)
    // Größe einheitlich halbiert
    expect(img.width).toBeCloseTo(150)
    expect(img.height).toBeCloseTo(50)
    // Zentriert in der neuen Leinwand
    expect(img.x + img.width / 2).toBeCloseTo(350) // 700 / 2
    expect(img.y + img.height / 2).toBeCloseTo(185) // 370 / 2
  })

  it('keeps image aspect ratio (no distortion) on a height-only change', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { x: 100, y: 100, width: 300, height: 100 }))
    const ratioBefore = collage.images[0].width / collage.images[0].height

    collage.repositionContent(700, 370) // nur Höhe ändert sich

    const img = collage.images[0]
    expect(img.width / img.height).toBeCloseTo(ratioBefore) // 3:1 bleibt 3:1
  })

  it('produces balanced margins on all four sides (top=bottom, left=right)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('big', { x: 0, y: 30, width: 700, height: 400 }))
    collage.repositionContent(700, 370)

    const img = collage.images[0]
    const left = img.x
    const right = 700 - (img.x + img.width)
    const top = img.y
    const bottom = 370 - (img.y + img.height)
    expect(left).toBeCloseTo(right)
    expect(top).toBeCloseTo(bottom)
  })

  it('keeps all content within the canvas (stays in view) when shrinking', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('big', { x: 0, y: 30, width: 700, height: 400 }))
    collage.repositionContent(700, 370)

    const img = collage.images[0]
    expect(img.x).toBeGreaterThanOrEqual(0)
    expect(img.y).toBeGreaterThanOrEqual(0)
    expect(img.x + img.width).toBeLessThanOrEqual(700 + 1e-6)
    expect(img.y + img.height).toBeLessThanOrEqual(370 + 1e-6)
  })

  it('is reversible for centered content (telescoping)', () => {
    const collage = useCollageStore()
    // Bereits zentriertes Bild (Mittelpunkt = Canvas-Mitte 350/370)
    collage.images.push(makeImg('a', { x: 200, y: 320, width: 300, height: 100 }))

    collage.repositionContent(700, 370) // verkleinern
    collage.repositionContent(700, 740) // zurück auf Original

    const img = collage.images[0]
    expect(img.x).toBeCloseTo(200)
    expect(img.y).toBeCloseTo(320)
    expect(img.width).toBeCloseTo(300)
    expect(img.height).toBeCloseTo(100)
  })

  it('does not touch gallery templates', () => {
    const collage = useCollageStore()
    collage.images.push(
      makeImg('tpl', { isGalleryTemplate: true, x: 10, y: 20, width: 200, height: 200 })
    )
    collage.repositionContent(700, 370)

    const tpl = collage.images[0]
    expect(tpl.x).toBe(10)
    expect(tpl.y).toBe(20)
    expect(tpl.width).toBe(200)
    expect(tpl.height).toBe(200)
  })

  it('scales text position and font size uniformly', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t', { x: 100, y: 200, fontSize: 48 }))
    collage.repositionContent(700, 370)

    const txt = collage.texts[0]
    // Einzelner Text (Bounding-Box = Punkt) landet in der Canvas-Mitte
    expect(txt.x).toBeCloseTo(350)
    expect(txt.y).toBeCloseTo(185)
    expect(txt.fontSize).toBeCloseTo(24) // 48 * 0.5
  })

  it('ignores invalid target sizes and keeps content intact', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { y: 600 }))

    collage.repositionContent(0, 370)
    collage.repositionContent(700, Number.NaN)

    expect(collage.settings.height).toBe(740)
    expect(collage.images[0].y).toBe(600)
  })
})
