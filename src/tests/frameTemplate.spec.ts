import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage } from '@/types'

function makeImg(id: string, overrides: Partial<CollageImage> = {}): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
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

// Beispiel-Rahmen (nur Rahmen-Felder).
const WHITE_ROUNDED: Partial<CollageImage> = {
  borderEnabled: true,
  borderWidth: 6,
  borderColor: '#ffffff',
  borderRadius: 18,
}

describe('applyFrameTemplate (Rahmen-Galerie)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('wendet den Rahmen auf ALLE Canvas-Bilder an, wenn nichts ausgewählt ist', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    collage.images.push(makeImg('b'))

    collage.applyFrameTemplate(WHITE_ROUNDED)

    for (const img of collage.images) {
      expect(img.borderEnabled).toBe(true)
      expect(img.borderWidth).toBe(6)
      expect(img.borderRadius).toBe(18)
    }
  })

  it('wendet den Rahmen nur auf ausgewählte Bilder an', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false }))
    collage.images.push(makeImg('b', { isGalleryTemplate: false }))
    collage.selectImage('a')

    collage.applyFrameTemplate(WHITE_ROUNDED)

    expect(collage.images.find((i) => i.id === 'a')!.borderEnabled).toBe(true)
    expect(collage.images.find((i) => i.id === 'b')!.borderEnabled).toBe(false)
  })

  it('lässt Galerie-Templates unberührt', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('gallery', { isGalleryTemplate: true }))
    collage.images.push(makeImg('canvas', { isGalleryTemplate: false }))

    collage.applyFrameTemplate(WHITE_ROUNDED)

    expect(collage.images.find((i) => i.id === 'gallery')!.borderEnabled).toBe(false)
    expect(collage.images.find((i) => i.id === 'canvas')!.borderEnabled).toBe(true)
  })

  it('bewahrt Bildschatten und Filter (merged nur Rahmen-Felder)', () => {
    const collage = useCollageStore()
    collage.images.push(
      makeImg('a', {
        isGalleryTemplate: false,
        shadowEnabled: true,
        shadowBlur: 30,
        brightness: 140,
        saturation: 60,
      })
    )

    collage.applyFrameTemplate(WHITE_ROUNDED)

    const a = collage.images[0]
    expect(a.borderEnabled).toBe(true)
    // Nicht-Rahmen-Felder bleiben erhalten
    expect(a.shadowEnabled).toBe(true)
    expect(a.shadowBlur).toBe(30)
    expect(a.brightness).toBe(140)
    expect(a.saturation).toBe(60)
  })

  it('kann per Undo rückgängig gemacht werden', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false }))

    collage.applyFrameTemplate(WHITE_ROUNDED)
    expect(collage.images[0].borderEnabled).toBe(true)

    collage.undo()
    expect(collage.images[0].borderEnabled).toBe(false)
  })

  it('tut nichts (kein Undo-Eintrag) ohne Zielbilder', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('gallery', { isGalleryTemplate: true }))

    collage.applyFrameTemplate(WHITE_ROUNDED)

    expect(collage.images[0].borderEnabled).toBe(false)
  })
})
