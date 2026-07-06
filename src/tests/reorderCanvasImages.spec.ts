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
    ...overrides,
  }
}

describe('reorderCanvasImages (drag to restack layers)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('assigns zIndex by position: first id = back, last id = front', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { zIndex: 0 }))
    collage.images.push(makeImg('b', { zIndex: 1 }))
    collage.images.push(makeImg('c', { zIndex: 2 }))

    // c nach ganz hinten ziehen
    collage.reorderCanvasImages(['c', 'a', 'b'])

    const z = (id: string) => collage.images.find((i) => i.id === id)!.zIndex
    expect(z('c')).toBe(0)
    expect(z('a')).toBe(1)
    expect(z('b')).toBe(2)
  })

  it('is a no-op for an empty order list', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { zIndex: 5 }))
    collage.reorderCanvasImages([])
    expect(collage.images[0].zIndex).toBe(5)
  })
})
