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

// Beispielhaftes „Abgerundet + Schatten"-Preset (kompletter Effekt-Satz).
const ROUNDED_SHADOW: Partial<CollageImage> = {
  borderRadius: 22,
  borderEnabled: false,
  shadowEnabled: true,
  shadowOffsetX: 0,
  shadowOffsetY: 10,
  shadowBlur: 26,
  shadowColor: '#000000',
}

describe('applyStylePreset (vorgefertigte Effekt-Presets)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('wendet das Preset auf ALLE Canvas-Bilder an, wenn nichts ausgewählt ist', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    collage.images.push(makeImg('b'))

    collage.applyStylePreset(ROUNDED_SHADOW)

    for (const img of collage.images) {
      expect(img.borderRadius).toBe(22)
      expect(img.shadowEnabled).toBe(true)
      expect(img.shadowBlur).toBe(26)
    }
  })

  it('lässt Galerie-Templates unberührt (nur Leinwand-Instanzen)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('gallery', { isGalleryTemplate: true }))
    collage.images.push(makeImg('canvas', { isGalleryTemplate: false }))

    collage.applyStylePreset(ROUNDED_SHADOW)

    const gallery = collage.images.find((i) => i.id === 'gallery')!
    const canvas = collage.images.find((i) => i.id === 'canvas')!
    expect(gallery.borderRadius).toBe(0)
    expect(gallery.shadowEnabled).toBe(false)
    expect(canvas.borderRadius).toBe(22)
    expect(canvas.shadowEnabled).toBe(true)
  })

  it('wendet das Preset nur auf ausgewählte Bilder an, wenn eine Auswahl besteht', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false }))
    collage.images.push(makeImg('b', { isGalleryTemplate: false }))
    collage.selectImage('a')

    collage.applyStylePreset(ROUNDED_SHADOW)

    const a = collage.images.find((i) => i.id === 'a')!
    const b = collage.images.find((i) => i.id === 'b')!
    expect(a.borderRadius).toBe(22)
    expect(b.borderRadius).toBe(0)
  })

  it('ersetzt Effekte deterministisch (Wechsel von Rahmen-Preset zu Reset)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false }))

    // Erst ein Rahmen-Preset anwenden ...
    collage.applyStylePreset({
      borderEnabled: true,
      borderWidth: 14,
      borderColor: '#ffffff',
      borderRadius: 4,
    })
    expect(collage.images[0].borderEnabled).toBe(true)

    // ... dann ein „Original"-Preset, das alle Effekt-Felder zurücksetzt.
    collage.applyStylePreset({
      borderRadius: 0,
      borderEnabled: false,
      shadowEnabled: false,
      borderShadowEnabled: false,
    })
    expect(collage.images[0].borderEnabled).toBe(false)
    expect(collage.images[0].borderRadius).toBe(0)
  })

  it('kann per Undo rückgängig gemacht werden', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false, borderRadius: 0 }))

    collage.applyStylePreset(ROUNDED_SHADOW)
    expect(collage.images[0].borderRadius).toBe(22)

    collage.undo()
    expect(collage.images[0].borderRadius).toBe(0)
  })

  it('kombiniert Geometrie- und Filter-Presets (orthogonal, kein Reset)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { isGalleryTemplate: false }))

    // Geometrie-Preset (nur Ecken/Schatten)
    collage.applyStylePreset({ borderRadius: 28, shadowEnabled: false })
    // Filter-Preset (nur Bildlook) – lässt die Geometrie unangetastet
    collage.applyStylePreset({ saturation: 0, contrast: 112 })

    const a = collage.images[0]
    expect(a.borderRadius).toBe(28) // Geometrie bleibt erhalten
    expect(a.saturation).toBe(0) // Filter zusätzlich angewendet
    expect(a.contrast).toBe(112)
  })
})
