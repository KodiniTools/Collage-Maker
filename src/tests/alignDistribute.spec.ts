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

const x = (c: ReturnType<typeof useCollageStore>, id: string) =>
  c.images.find((i) => i.id === id)!.x
const y = (c: ReturnType<typeof useCollageStore>, id: string) =>
  c.images.find((i) => i.id === id)!.y

describe('alignSelectedImages', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('aligns left edges to the selection bounding box', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { x: 10, width: 100 }))
    c.images.push(makeImg('b', { x: 40, width: 50 }))
    c.selectedImageIds = ['a', 'b']

    c.alignSelectedImages('left')

    expect(x(c, 'a')).toBe(10)
    expect(x(c, 'b')).toBe(10)
  })

  it('aligns right edges to the selection bounding box', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { x: 10, width: 100 })) // right = 110
    c.images.push(makeImg('b', { x: 40, width: 50 })) // right = 90
    c.selectedImageIds = ['a', 'b']

    c.alignSelectedImages('right')

    expect(x(c, 'a') + 100).toBe(110)
    expect(x(c, 'b') + 50).toBe(110)
  })

  it('centers horizontally on the bounding box center', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { x: 0, width: 100 })) // spans 0..100
    c.images.push(makeImg('b', { x: 100, width: 100 })) // spans 100..200
    c.selectedImageIds = ['a', 'b']
    // bbox center x = 100
    c.alignSelectedImages('center-h')

    expect(x(c, 'a')).toBe(50) // 100 - 100/2
    expect(x(c, 'b')).toBe(50)
  })

  it('does nothing with fewer than 2 images', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { x: 33 }))
    c.selectedImageIds = ['a']
    c.alignSelectedImages('left')
    expect(x(c, 'a')).toBe(33)
  })
})

describe('distributeSelectedImages', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('distributes horizontally with equal gaps, keeping endpoints', () => {
    const c = useCollageStore()
    // widths 100 each; span from 0 to 400 => total width 300, free 100, gap 50 over 2 gaps
    c.images.push(makeImg('a', { x: 0, width: 100 }))
    c.images.push(makeImg('b', { x: 120, width: 100 }))
    c.images.push(makeImg('c', { x: 300, width: 100 })) // right = 400
    c.selectedImageIds = ['a', 'b', 'c']

    c.distributeSelectedImages('horizontal')

    expect(x(c, 'a')).toBe(0)
    expect(x(c, 'b')).toBe(150) // 100 + gap 50
    expect(x(c, 'c')).toBe(300) // endpoint preserved
  })

  it('distributes vertically with equal gaps', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { y: 0, height: 100 }))
    c.images.push(makeImg('b', { y: 130, height: 100 }))
    c.images.push(makeImg('c', { y: 300, height: 100 })) // bottom = 400
    c.selectedImageIds = ['a', 'b', 'c']

    c.distributeSelectedImages('vertical')

    expect(y(c, 'a')).toBe(0)
    expect(y(c, 'b')).toBe(150)
    expect(y(c, 'c')).toBe(300)
  })

  it('does nothing with fewer than 3 images', () => {
    const c = useCollageStore()
    c.images.push(makeImg('a', { x: 0, width: 100 }))
    c.images.push(makeImg('b', { x: 300, width: 100 }))
    c.selectedImageIds = ['a', 'b']
    c.distributeSelectedImages('horizontal')
    expect(x(c, 'b')).toBe(300)
  })
})
