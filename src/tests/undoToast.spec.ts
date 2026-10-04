import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    // jsdom stellt URL.createObjectURL nicht bereit; Undo erzeugt frische URLs
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:fresh-${++n}`)
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

  it('brings the file back and replaces the revoked blob URL with a fresh one', () => {
    const collage = useCollageStore()
    const toast = useToastStore()
    const file = new File(['x'], 'photo.jpg')
    collage.images.push(makeImg('a', { url: 'blob:old', file }))

    collage.removeImageWithUndoToast('a')
    toast.toasts[0].action?.handler()

    const restored = collage.images[0]
    expect(restored.file).toBe(file)
    expect(restored.url).toBe('blob:fresh-1')
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
  })

  it('keeps the shared URL when another image still uses it', () => {
    const collage = useCollageStore()
    const toast = useToastStore()
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:shared' }))
    collage.images.push(makeImg('inst', { url: 'blob:shared', sourceId: 'tpl' }))

    collage.removeImageWithUndoToast('inst')
    toast.toasts[0].action?.handler()

    expect(collage.images.map((i) => i.url)).toEqual(['blob:shared', 'blob:shared'])
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
