import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { i18n } from '@/i18n'
import { useCollageStore } from '@/stores/collage'
import {
  SKIP_DELETE_CONFIRM_KEY,
  useImageList,
  type ImageListApi,
} from '@/composables/useImageList'
import { formatFileSize, getFileExtension } from '@/utils/fileInfo'
import ImageList from '@/components/ImageList.vue'
import { makeImg } from './helpers/makeImg'

const t = (key: string, params?: Record<string, unknown>) =>
  params ? i18n.global.t(key, params) : i18n.global.t(key)

let pinia: Pinia

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  // jsdom kennt keine Object-URLs (Undo-Toast erzeugt frische URLs)
  URL.revokeObjectURL = () => {}
  URL.createObjectURL = vi.fn(() => 'blob:fresh')
})

function seedGallery(...names: string[]) {
  const collage = useCollageStore()
  collage.updateSettings({ layout: 'freestyle' })
  names.forEach((name, i) =>
    collage.images.push(
      makeImg(`g${i + 1}`, {
        isGalleryTemplate: true,
        file: new File(['x'.repeat(2048)], name),
        url: `blob:g${i + 1}`,
      })
    )
  )
  return collage
}

function setupApi(): ImageListApi {
  let api: ImageListApi | null = null
  mount(
    defineComponent({
      setup() {
        api = useImageList()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } }
  )
  return api!
}

describe('fileInfo', () => {
  it('formatiert Dateigrößen', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
  })

  it('liefert die Endung in Großbuchstaben', () => {
    expect(getFileExtension('foto.final.jpeg')).toBe('JPEG')
    expect(getFileExtension('ohne-endung')).toBe('OHNE-ENDUNG')
    expect(getFileExtension('')).toBe('UNKNOWN')
  })
})

describe('useImageList', () => {
  it('zeigt nur Galerie-Vorlagen und wählt per Klick einzeln bzw. mit Strg mehrfach', () => {
    const collage = seedGallery('a.jpg', 'b.jpg')
    collage.images.push(makeImg('canvas-instance'))
    const api = setupApi()
    expect(api.galleryImages.value.map((i) => i.id)).toEqual(['g1', 'g2'])

    api.handleImageClick('g1', new MouseEvent('click'))
    expect(collage.selectedGalleryIds).toEqual(['g1'])
    api.handleImageClick('g2', new MouseEvent('click', { ctrlKey: true }))
    expect(api.selectedCount.value).toBe(2)
    expect(api.allSelected.value).toBe(true)
    // Einfacher Klick ersetzt die Auswahl; erneuter Klick hebt sie auf
    api.handleImageClick('g2', new MouseEvent('click'))
    expect(collage.selectedGalleryIds).toEqual(['g2'])
    api.handleImageClick('g2', new MouseEvent('click'))
    expect(api.selectedCount.value).toBe(0)

    api.toggleSelectAll()
    expect(api.allSelected.value).toBe(true)
    api.toggleSelectAll()
    expect(api.selectedCount.value).toBe(0)
  })

  it('fragt vor dem Löschen und merkt sich „Nicht mehr fragen"', () => {
    const collage = seedGallery('a.jpg', 'b.jpg')
    const api = setupApi()
    const [first, second] = api.galleryImages.value

    api.requestDelete(first!)
    expect(api.showDeleteConfirm.value).toBe(true)
    expect(api.deleteMode.value).toBe('single')
    api.cancelDelete()
    expect(collage.images).toHaveLength(2)

    api.requestDelete(first!)
    api.dontAskAgain.value = true
    api.confirmDelete()
    expect(collage.images.map((i) => i.id)).toEqual(['g2'])
    expect(localStorage.getItem(SKIP_DELETE_CONFIRM_KEY)).toBe('true')
    expect(api.showDeleteConfirm.value).toBe(false)
    expect(api.dontAskAgain.value).toBe(false)

    // Danach ohne Rückfrage
    api.requestDelete(second!)
    expect(api.showDeleteConfirm.value).toBe(false)
    expect(collage.images).toHaveLength(0)
  })

  it('löscht die Auswahl nach Bestätigung und ignoriert leere Auswahl', () => {
    const collage = seedGallery('a.jpg', 'b.jpg', 'c.jpg')
    const api = setupApi()
    api.requestDeleteSelected()
    expect(api.showDeleteConfirm.value).toBe(false)

    collage.toggleGallerySelection('g1')
    collage.toggleGallerySelection('g3')
    api.requestDeleteSelected()
    expect(api.deleteMode.value).toBe('selected')
    api.confirmDelete()
    expect(collage.images.map((i) => i.id)).toEqual(['g2'])
  })

  it('Vorschau: als Hintergrund setzen und auf die Leinwand legen', () => {
    const collage = seedGallery('a.jpg')
    const api = setupApi()
    const [image] = api.galleryImages.value

    api.handleDoubleClick(image!)
    expect(api.showPreview.value).toBe(true)
    api.setAsBackgroundAndClose()
    expect(collage.settings.backgroundImage.url).toBe('blob:g1')
    expect(api.showPreview.value).toBe(false)
    expect(api.previewImage.value).toBeNull()

    api.handleDoubleClick(image!)
    api.addToCanvasAndClose()
    expect(collage.images.filter((i) => i.isGalleryTemplate !== true)).toHaveLength(1)
  })

  it('merkt sich die echten Pixelmaße', () => {
    seedGallery('a.jpg')
    const api = setupApi()
    expect(api.dimensionsText('g1')).toBe('')
    const img = { naturalWidth: 1920, naturalHeight: 1080 } as HTMLImageElement
    api.onImageLoad('g1', { target: img } as unknown as Event)
    expect(api.dimensionsText('g1')).toBe('1920 × 1080 px')
  })
})

describe('ImageList (Komponente)', () => {
  function mountList() {
    return mount(ImageList, {
      global: { plugins: [pinia, i18n], stubs: { teleport: true } },
    })
  }

  it('zeigt den Leerzustand ohne Bilder', () => {
    const wrapper = mountList()
    expect(wrapper.text()).toContain(t('images.empty'))
  })

  it('rendert Einträge, Auswahlleiste, Vorschau und Löschdialog', async () => {
    seedGallery('urlaub.jpg', 'strand.png')
    const wrapper = mountList()
    const items = wrapper.findAll('[role="button"][draggable="true"]')
    expect(items).toHaveLength(2)
    expect(items[0]!.attributes('aria-label')).toBe(`${t('gallery.selectImage')}: urlaub.jpg`)
    expect(items[0]!.text()).toContain('2.0 KB')
    expect(wrapper.text()).toContain(t('gallery.selectAll'))

    await items[0]!.trigger('click')
    expect(wrapper.text()).toContain(t('gallery.selectedInfo', { count: 1 }))
    expect(wrapper.text()).toContain(t('gallery.setAsBackground'))

    await items[1]!.trigger('dblclick')
    expect(wrapper.text()).toContain(t('gallery.preview'))
    expect(wrapper.text()).toContain('PNG')

    await wrapper.get(`button[aria-label="${t('common.close')}"]`).trigger('click')
    expect(wrapper.text()).not.toContain(t('gallery.previewTitle'))

    await wrapper.get(`button[aria-label="${t('images.remove')}"]`).trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(t('gallery.deleteConfirmTitle'))
    expect(wrapper.find('[role="switch"]').exists()).toBe(true)
  })
})
