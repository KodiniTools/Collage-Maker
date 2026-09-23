import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { makeImg } from './helpers/makeImg'

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
