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

// Preset-Vorlage ohne eigenen Inhalt (entspricht den vordefinierten Vorlagen)
function presetTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'preset-1',
    name: 'Instagram Post',
    category: 'predefined' as const,
    createdAt: 0,
    thumbnail: '',
    collageState: {
      settings: {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        layout: 'freestyle',
        gridEnabled: false,
        gridSize: 20,
        ...overrides,
      },
      images: [],
      texts: [],
    },
  }
}

describe('loadFromTemplate – Arbeit ohne Verlust', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('behält hochgeladene Bilder beim Anwenden eines Presets', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    collage.images.push(makeImg('b'))

    collage.loadFromTemplate(presetTemplate())

    expect(collage.images.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('übernimmt die Preset-Einstellungen (z. B. Canvas-Größe)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))

    collage.loadFromTemplate(presetTemplate())

    expect(collage.settings.width).toBe(1080)
    expect(collage.settings.height).toBe(1080)
  })

  it('wendet ein Grid-Layout auf die vorhandenen Bilder an', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { x: 0, y: 0 }))
    collage.images.push(makeImg('b', { x: 0, y: 0 }))

    collage.loadFromTemplate(presetTemplate({ layout: 'grid-2x2' }))

    expect(collage.settings.layout).toBe('grid-2x2')
    // Grid-Layout positioniert die zwei Bilder unterschiedlich
    const [a, b] = collage.images
    expect(a.x !== b.x || a.y !== b.y).toBe(true)
  })

  it('ist rückgängig-fähig: Undo stellt die vorherige Arbeit wieder her', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a'))
    collage.settings.width = 700

    collage.loadFromTemplate(presetTemplate())
    expect(collage.settings.width).toBe(1080)

    collage.undo()
    expect(collage.settings.width).toBe(700)
    expect(collage.images.map((i) => i.id)).toEqual(['a'])
  })

  it('ersetzt den Inhalt bei einer Vorlage mit eigenen Bildern/Texten', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('current'))

    const contentTemplate = {
      id: 'content-1',
      name: 'Gespeicherte Collage',
      category: 'user' as const,
      createdAt: 0,
      thumbnail: '',
      collageState: {
        settings: {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff',
          layout: 'freestyle',
          gridEnabled: false,
          gridSize: 20,
        },
        images: [{ ...makeImg('from-template'), file: undefined }],
        texts: [],
      },
    }

    collage.loadFromTemplate(contentTemplate)

    expect(collage.images.map((i) => i.id)).toEqual(['from-template'])
  })
})
