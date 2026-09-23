import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { makeImg } from './helpers/makeImg'

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
