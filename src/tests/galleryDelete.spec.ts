import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage } from '@/types'
import { makeImg as baseMakeImg } from './helpers/makeImg'

function makeImg(id: string, overrides: Partial<CollageImage> = {}): CollageImage {
  return baseMakeImg(id, { x: 100, y: 200, width: 300, height: 150, ...overrides })
}

describe('gallery image deletion (template + canvas instances)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // jsdom stellt URL.revokeObjectURL nicht bereit
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => {}
    }
    // jsdom stellt URL.createObjectURL nicht bereit; Undo erzeugt frische URLs
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:fresh-${++n}`)
  })

  it('removes the template and its canvas instances linked by shared URL (same session)', () => {
    const collage = useCollageStore()
    collage.updateSettings({ layout: 'freestyle' })
    // Template + zwei Canvas-Instanzen teilen dieselbe URL (gleiche Sitzung)
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:shared' }))
    collage.images.push(makeImg('inst1', { url: 'blob:shared' }))
    collage.images.push(makeImg('inst2', { url: 'blob:shared' }))

    collage.removeGalleryImage('tpl')

    expect(collage.images).toHaveLength(0)
  })

  it('removes canvas instances linked by sourceId even when URLs differ (after restore)', () => {
    const collage = useCollageStore()
    collage.updateSettings({ layout: 'freestyle' })
    // Nach dem Wiederherstellen hat jedes Bild eine eigene, neue Blob-URL,
    // aber die sourceId der Instanzen zeigt weiterhin auf das Template.
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:a' }))
    collage.images.push(makeImg('inst1', { url: 'blob:b', sourceId: 'tpl' }))
    collage.images.push(makeImg('inst2', { url: 'blob:c', sourceId: 'tpl' }))
    // Ein unabhängiges Bild darf nicht mitgelöscht werden
    collage.images.push(makeImg('other', { url: 'blob:d', sourceId: 'someOtherTpl' }))

    collage.removeGalleryImage('tpl')

    const remaining = collage.images.map((i) => i.id)
    expect(remaining).toEqual(['other'])
  })

  it('counts only canvas instances of a gallery image (not the template)', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:a' }))
    collage.images.push(makeImg('inst1', { url: 'blob:b', sourceId: 'tpl' }))
    collage.images.push(makeImg('inst2', { url: 'blob:c', sourceId: 'tpl' }))

    expect(collage.countGalleryImageInstances('tpl')).toBe(2)
  })

  it('bulk-removes selected gallery images with their instances (after restore)', () => {
    const collage = useCollageStore()
    collage.updateSettings({ layout: 'freestyle' })
    collage.images.push(makeImg('tplA', { isGalleryTemplate: true, url: 'blob:a1' }))
    collage.images.push(makeImg('instA', { url: 'blob:a2', sourceId: 'tplA' }))
    collage.images.push(makeImg('tplB', { isGalleryTemplate: true, url: 'blob:b1' }))
    collage.images.push(makeImg('instB', { url: 'blob:b2', sourceId: 'tplB' }))
    collage.images.push(makeImg('tplC', { isGalleryTemplate: true, url: 'blob:c1' }))

    collage.toggleGallerySelection('tplA')
    collage.toggleGallerySelection('tplB')
    collage.removeSelectedGalleryImages()

    const remaining = collage.images.map((i) => i.id)
    expect(remaining).toEqual(['tplC'])
    expect(collage.selectedGalleryIds).toHaveLength(0)
  })

  describe('background image taken from a gallery image', () => {
    it('reports whether a gallery image provides the current background', () => {
      const collage = useCollageStore()
      collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:bg' }))
      collage.images.push(makeImg('other', { isGalleryTemplate: true, url: 'blob:other' }))

      expect(collage.isGalleryImageBackground('tpl')).toBe(false)
      collage.setBackgroundImage('blob:bg')
      expect(collage.isGalleryImageBackground('tpl')).toBe(true)
      expect(collage.isGalleryImageBackground('other')).toBe(false)
    })

    it('clears the background when the gallery image that provides it is deleted', () => {
      const collage = useCollageStore()
      collage.updateSettings({ layout: 'freestyle' })
      collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:bg' }))
      collage.images.push(makeImg('inst', { url: 'blob:bg', sourceId: 'tpl' }))
      collage.setBackgroundImage('blob:bg')
      collage.selectBackground(true)

      collage.removeGalleryImage('tpl')

      expect(collage.images).toHaveLength(0)
      expect(collage.settings.backgroundImage.url).toBeNull()
      expect(collage.isBackgroundSelected).toBe(false)
    })

    it('keeps a background that comes from another gallery image', () => {
      const collage = useCollageStore()
      collage.updateSettings({ layout: 'freestyle' })
      collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:a' }))
      collage.images.push(makeImg('bg', { isGalleryTemplate: true, url: 'blob:bg' }))
      collage.setBackgroundImage('blob:bg')

      collage.removeGalleryImage('tpl')

      expect(collage.images.map((i) => i.id)).toEqual(['bg'])
      expect(collage.settings.backgroundImage.url).toBe('blob:bg')
    })

    it('clears the background on bulk delete when one selected image provides it', () => {
      const collage = useCollageStore()
      collage.updateSettings({ layout: 'freestyle' })
      collage.images.push(makeImg('tplA', { isGalleryTemplate: true, url: 'blob:a' }))
      collage.images.push(makeImg('tplB', { isGalleryTemplate: true, url: 'blob:b' }))
      collage.images.push(makeImg('tplC', { isGalleryTemplate: true, url: 'blob:c' }))
      collage.setBackgroundImage('blob:b')
      collage.toggleGallerySelection('tplA')
      collage.toggleGallerySelection('tplB')

      collage.removeSelectedGalleryImages()

      expect(collage.images.map((i) => i.id)).toEqual(['tplC'])
      expect(collage.settings.backgroundImage.url).toBeNull()
    })

    it('restores the background together with the gallery image on undo', () => {
      const collage = useCollageStore()
      collage.updateSettings({ layout: 'freestyle' })
      const file = new File(['x'], 'bg.jpg')
      collage.images.push(makeImg('tpl', { isGalleryTemplate: true, url: 'blob:bg', file }))
      collage.images.push(makeImg('inst', { url: 'blob:bg', sourceId: 'tpl', file }))
      collage.setBackgroundImage('blob:bg')

      collage.removeGalleryImage('tpl')
      collage.undo()

      // Die alte URL wurde widerrufen: Template, Instanz und Hintergrund teilen
      // sich eine frische URL, die Datei ist wieder da.
      expect(collage.images.map((i) => i.id)).toEqual(['tpl', 'inst'])
      expect(collage.images.map((i) => i.url)).toEqual(['blob:fresh-1', 'blob:fresh-1'])
      expect(collage.images[0].file).toBe(file)
      expect(collage.settings.backgroundImage.url).toBe('blob:fresh-1')
    })
  })
})
