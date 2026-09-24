import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { makeImg } from './helpers/makeImg'

// Bilder werden beim Speichern als Vorlage komprimiert – im Test nicht ladbar.
vi.mock('@/utils/imageCompression', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/imageCompression')>()),
  urlToCompressedDataUrl: vi.fn(async (url: string) => `data:${url}`),
}))

/** Store-Aktionen ohne bisherige Testabdeckung (Absicherung vor dem Aufteilen). */
describe('collage store', () => {
  let collage: ReturnType<typeof useCollageStore>
  let uuid = 0

  beforeEach(() => {
    setActivePinia(createPinia())
    uuid = 0
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `id-${++uuid}` as `${string}-${string}-${string}-${string}-${string}`
    )
    URL.createObjectURL = vi.fn((f: Blob) => `blob:${(f as File).name}`)
    URL.revokeObjectURL = vi.fn()
    collage = useCollageStore()
  })

  const ids = () => collage.images.map((i) => i.id)

  describe('Bilder', () => {
    it('addImages legt je Datei Galerie-Vorlage und Canvas-Instanz an', () => {
      collage.settings.layout = 'freestyle'
      collage.addImages([new File([], 'a.jpg')])
      expect(collage.images).toMatchSnapshot()
      expect(collage.canUndo).toBe(true)
    })

    it('addImages wendet das aktive Layout an', () => {
      collage.addImages([new File([], 'a.jpg'), new File([], 'b.jpg')])
      const instances = collage.images.filter((i) => !i.isGalleryTemplate)
      expect(instances.map((i) => [i.x, i.y, i.width, i.height])).toMatchSnapshot()
    })

    it('removeSelectedImages entfernt alle ausgewählten Bilder', () => {
      collage.images.push(makeImg('a'), makeImg('b'), makeImg('c'))
      collage.selectImage('a')
      collage.toggleImageSelection('c')
      collage.removeSelectedImages()
      expect(ids()).toEqual(['b'])
      expect(collage.selectedImageIds).toEqual([])
      collage.undo()
      expect(ids()).toEqual(['a', 'b', 'c'])
    })

    it('removeImage gibt die URL nur frei, wenn sie niemand mehr nutzt', () => {
      collage.images.push(makeImg('a', { url: 'blob:x' }), makeImg('b', { url: 'blob:x' }))
      collage.removeImage('a')
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      collage.removeImage('b')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
    })

    it('updateSelectedImages und selectAllCanvasImages', () => {
      collage.images.push(makeImg('a'), makeImg('t', { isGalleryTemplate: true }), makeImg('b'))
      collage.selectAllCanvasImages()
      expect(collage.selectedImageIds).toEqual(['a', 'b'])
      collage.updateSelectedImages({ opacity: 0.5 })
      expect(collage.images.map((i) => i.opacity)).toEqual([0.5, 1, 0.5])
    })
  })

  describe('Galerie', () => {
    beforeEach(() => {
      collage.settings.layout = 'freestyle'
      collage.images.push(
        makeImg('g1', { isGalleryTemplate: true, url: 'blob:1', width: 120, height: 80 }),
        makeImg('g2', { isGalleryTemplate: true, url: 'blob:2' }),
        makeImg('c1', { url: 'blob:1', sourceId: 'g1', zIndex: 4 })
      )
    })

    it('selectAllGalleryImages / toggleGallerySelection', () => {
      collage.selectAllGalleryImages()
      expect(collage.selectedGalleryIds).toEqual(['g1', 'g2'])
      collage.toggleGallerySelection('g1')
      expect(collage.selectedGalleryIds).toEqual(['g2'])
      expect(collage.isGalleryImageSelected('g2')).toBe(true)
    })

    it('addSelectedGalleryToCanvas erzeugt versetzte Instanzen und wählt sie aus', () => {
      collage.toggleGallerySelection('g1')
      collage.toggleGallerySelection('g2')
      collage.addSelectedGalleryToCanvas()
      expect(collage.images.slice(3)).toMatchSnapshot()
      expect(collage.selectedImageIds).toEqual(['id-1', 'id-2'])
      expect(collage.selectedGalleryIds).toEqual([])
      expect(collage.countGalleryImageInstances('g1')).toBe(2)
    })

    it('removeSelectedGalleryImages entfernt Vorlagen samt Instanzen', () => {
      collage.selectAllGalleryImages()
      collage.removeSelectedGalleryImages()
      expect(collage.images).toEqual([])
      expect(collage.selectedGalleryIds).toEqual([])
    })
  })

  describe('Leinwand und Hintergrund', () => {
    it('clearCollage leert Inhalt und Hintergrund', () => {
      collage.images.push(makeImg('a', { url: 'blob:x' }), makeImg('b', { url: 'blob:x' }))
      collage.addText('Hallo')
      collage.settings.backgroundImage.url = 'blob:bg'
      collage.settings.backgroundImage.opacity = 0.3
      collage.clearCollage()
      expect(collage.images).toEqual([])
      expect(collage.texts).toEqual([])
      expect(collage.selectedTextId).toBeNull()
      expect(collage.settings.backgroundImage).toEqual({
        url: null,
        fit: 'cover',
        opacity: 1,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
      })
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    })

    it('setBackgroundImage behält den Fit-Modus und setzt Filter zurück', () => {
      collage.settings.backgroundImage.fit = 'tile'
      collage.settings.backgroundImage.blur = 5
      collage.setBackgroundImage('blob:bg')
      expect(collage.settings.backgroundImage).toEqual({
        url: 'blob:bg',
        fit: 'tile',
        opacity: 1,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
      })
    })

    it('removeBackgroundImage und selectBackground', () => {
      collage.images.push(makeImg('a'))
      collage.selectImage('a')
      collage.settings.backgroundImage.url = 'blob:bg'
      collage.selectBackground(true)
      expect(collage.selectedImageIds).toEqual([])
      collage.removeBackgroundImage()
      expect(collage.settings.backgroundImage.url).toBeNull()
      expect(collage.isBackgroundSelected).toBe(false)
    })

    it('setCanvasZoom begrenzt auf 25–400 %', () => {
      collage.setCanvasZoom(10)
      expect(collage.canvasZoom).toBe(4)
      collage.setCanvasZoom(0.1)
      expect(collage.canvasZoom).toBe(0.25)
      collage.resetCanvasView()
      expect(collage.canvasZoom).toBe(1)
    })
  })

  describe('Anordnen', () => {
    beforeEach(() => {
      collage.images.push(
        makeImg('a', { x: 10, y: 20, zIndex: 1, rotation: 350, sourceId: 'g' }),
        makeImg('b', { x: 50, y: 60, zIndex: 3 })
      )
    })

    it('duplicateImageToPosition erzeugt eine Instanz mit Standard-Effekten', () => {
      collage.updateImage('a', { opacity: 0.2, borderEnabled: true })
      collage.duplicateImageToPosition('a', 300, 400)
      expect(collage.images[2]).toMatchSnapshot()
      expect(collage.selectedImageIds).toEqual(['id-1'])
    })

    it('duplicateSelectedImages kopiert inkl. Effekten mit Versatz', () => {
      collage.updateImage('a', { opacity: 0.2 })
      collage.selectImage('a')
      collage.toggleImageSelection('b')
      collage.duplicateSelectedImages()
      expect(collage.images.slice(2).map((i) => [i.id, i.x, i.y, i.zIndex, i.opacity])).toEqual([
        ['id-1', 30, 40, 4, 0.2],
        ['id-2', 70, 80, 5, 1],
      ])
      expect(collage.selectedImageIds).toEqual(['id-1', 'id-2'])
    })

    it('bringSelectedToFront / sendSelectedToBack', () => {
      collage.selectImage('a')
      collage.bringSelectedToFront()
      expect(collage.images[0].zIndex).toBe(4)
      collage.sendSelectedToBack()
      expect(collage.images[0].zIndex).toBe(-1)
    })

    it('rotateSelectedImages dreht modulo 360', () => {
      collage.selectImage('a')
      collage.rotateSelectedImages(20)
      expect(collage.images[0].rotation).toBe(10)
    })

    it('moveSelectedImages und moveSelectedText', () => {
      collage.selectImage('a')
      collage.toggleImageSelection('b')
      collage.moveSelectedImages(5, -5)
      expect(collage.images.map((i) => [i.x, i.y])).toEqual([
        [15, 15],
        [55, 55],
      ])
      collage.addText('T')
      const { x, y } = collage.texts[0]
      collage.moveSelectedText(3, 4)
      expect([collage.texts[0].x, collage.texts[0].y]).toEqual([x + 3, y + 4])
    })
  })

  describe('Text', () => {
    it('addText legt Text mit Standardwerten über allen Ebenen an', () => {
      collage.images.push(makeImg('a', { zIndex: 7 }))
      collage.selectImage('a')
      collage.addText('Hallo')
      expect(collage.texts[0]).toMatchSnapshot()
      expect(collage.selectedTextId).toBe('id-1')
      expect(collage.selectedImageIds).toEqual([])
    })

    it('removeText hebt die Auswahl auf', () => {
      collage.addText('Hallo')
      collage.removeText('id-1')
      expect(collage.texts).toEqual([])
      expect(collage.selectedTextId).toBeNull()
    })

    it('rotateText dreht modulo 360', () => {
      collage.addText('Hallo')
      collage.rotateText('id-1', 370)
      expect(collage.texts[0].rotation).toBe(10)
    })
  })

  describe('Vorlagen', () => {
    it('saveAsTemplate bettet Bilder als Data-URL ein', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000)
      collage.images.push(
        makeImg('g', { isGalleryTemplate: true, url: 'blob:1' }),
        makeImg('c', { url: 'blob:1', sourceId: 'g' })
      )
      collage.addText('Hallo')
      const tpl = await collage.saveAsTemplate('Name', 'Beschreibung')
      expect(tpl).toMatchSnapshot()
      vi.mocked(Date.now).mockRestore()
    })
  })

  describe('Benachrichtigungen', () => {
    it('Aktionen zeigen ihre Toasts', () => {
      const toast = useToastStore()
      collage.images.push(makeImg('a'), makeImg('b'))
      collage.selectImage('a')
      collage.toggleImageSelection('b')
      collage.duplicateSelectedImages()
      collage.addText('x')
      expect(toast.toasts.map((t) => t.message)).toMatchSnapshot()
    })
  })
})
