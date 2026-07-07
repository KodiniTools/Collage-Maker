import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
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

describe('removeImageWithUndoToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => {}
    }
  })

  it('removes the image and shows a toast with an undo action', () => {
    const collage = useCollageStore()
    const toast = useToastStore()
    collage.images.push(makeImg('a'))

    collage.removeImageWithUndoToast('a')

    expect(collage.images).toHaveLength(0)
    expect(toast.toasts).toHaveLength(1)
    expect(toast.toasts[0].action).toBeTruthy()
    expect(toast.toasts[0].action?.label).toBeTruthy()
  })

  it('restores the deleted image when the undo action is invoked', () => {
    const collage = useCollageStore()
    const toast = useToastStore()
    collage.images.push(makeImg('a'))

    collage.removeImageWithUndoToast('a')
    expect(collage.images).toHaveLength(0)

    // „Rückgängig" auslösen
    toast.toasts[0].action?.handler()

    expect(collage.images.map((i) => i.id)).toEqual(['a'])
  })
})
