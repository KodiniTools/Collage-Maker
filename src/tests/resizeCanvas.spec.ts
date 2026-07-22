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

  it('scales image positions (top-left based) but keeps their size', () => {
    const collage = useCollageStore()
    // Bild im unteren Bereich der Standard-Leinwand (700x740)
    collage.images.push(makeImg('a', { x: 100, y: 600, width: 300, height: 100 }))
    // Höhe halbieren -> Position rutscht hoch, Größe bleibt unverändert.
    collage.repositionContent(700, 370)

    const img = collage.images[0]
    expect(collage.settings.width).toBe(700)
    expect(collage.settings.height).toBe(370)
    // Oben-links-basiert: y * 0.5 = 300 (kein Mittelpunkt-Versatz)
    expect(img.y).toBeCloseTo(300)
    expect(img.x).toBeCloseTo(100) // Breite unverändert -> x bleibt
    expect(img.width).toBe(300) // Größe bleibt erhalten
    expect(img.height).toBe(100)
  })

  it('does not push the top image off-canvas (preserves the top margin)', () => {
    const collage = useCollageStore()
    // Großes Bild oben mit kleinem weißen Rand (y=30), fast volle Höhe
    collage.images.push(makeImg('big', { x: 0, y: 30, width: 700, height: 400 }))
    // Höhe halbieren
    collage.repositionContent(700, 370)

    // Oberkante bleibt positiv (Rand schrumpft proportional, wird nicht
    // abgeschnitten): 30 * (370/740) = 15
    expect(collage.images[0].y).toBeCloseTo(15)
    expect(collage.images[0].y).toBeGreaterThan(0)
  })

  it('shrinks the vertical gap between two images proportionally to the height', () => {
    const collage = useCollageStore()
    const top = makeImg('top', { x: 100, y: 50, width: 300, height: 150 })
    const bottom = makeImg('bottom', { x: 100, y: 600, width: 300, height: 100 })
    collage.images.push(top, bottom)

    // Abstand der Positionen (Oberkanten) vor der Änderung
    const gapBefore = 600 - 50
    collage.repositionContent(700, 370)

    const [t, b] = collage.images
    // Positions-Abstand skaliert exakt mit der Höhe (0.5)
    expect(b.y - t.y).toBeCloseTo(gapBefore * 0.5)
  })

  it('does not reposition gallery templates', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, x: 10, y: 20 }))
    collage.repositionContent(700, 370)

    expect(collage.images[0].x).toBe(10)
    expect(collage.images[0].y).toBe(20)
  })

  it('scales text position but keeps font size', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t', { x: 100, y: 200, fontSize: 48 }))
    collage.repositionContent(700, 370)

    const txt = collage.texts[0]
    expect(txt.y).toBeCloseTo(100) // 200 * 0.5
    expect(txt.x).toBeCloseTo(100) // Breite unverändert
    expect(txt.fontSize).toBe(48) // Schriftgröße bleibt
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
