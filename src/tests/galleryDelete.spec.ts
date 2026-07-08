import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage } from '@/types'

function makeImg(id: string, overrides: Partial<CollageImage> = {}): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 100,
    y: 200,
    width: 300,
    height: 150,
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

describe('gallery image deletion (template + canvas instances)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // jsdom stellt URL.revokeObjectURL nicht bereit
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = () => {}
    }
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
})
