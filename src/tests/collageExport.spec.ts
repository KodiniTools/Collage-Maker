import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { DEFAULT_EXPORT_FILENAME, useFilenamePrompt } from '@/composables/useFilenamePrompt'
import {
  fileExtensionFor,
  mimeTypeFor,
  useCollageExport,
  type CollageExportApi,
} from '@/composables/useCollageExport'
import { renderCollage } from '@/lib/export-engine/renderCollage'

vi.mock('@/lib/export-engine/renderCollage', () => ({
  renderCollage: vi.fn(async () => ({
    toBlob: vi.fn((cb: BlobCallback) => cb(new Blob(['png'], { type: 'image/png' }))),
    toDataURL: vi.fn(() => 'data:image/png;base64,AAAA'),
  })),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('fileExtensionFor / mimeTypeFor', () => {
  it('bildet Formate auf Endung und MIME-Typ ab', () => {
    expect(fileExtensionFor('png-transparent')).toBe('png')
    expect(fileExtensionFor('jpeg')).toBe('jpeg')
    expect(fileExtensionFor('pdf')).toBe('pdf')
    expect(mimeTypeFor('png')).toBe('image/png')
    expect(mimeTypeFor('png-transparent')).toBe('image/png')
    expect(mimeTypeFor('webp')).toBe('image/webp')
    expect(mimeTypeFor('jpeg')).toBe('image/jpeg')
    expect(mimeTypeFor('pdf')).toBe('image/jpeg')
  })
})

describe('useFilenamePrompt', () => {
  it('öffnet mit Standardnamen und liefert den bereinigten Namen', async () => {
    const ext = ref('png')
    const p = useFilenamePrompt(ext)
    const result = p.prompt()
    expect(p.isOpen.value).toBe(true)
    expect(p.filename.value).toBe(DEFAULT_EXPORT_FILENAME)
    p.filename.value = '  Urlaub  '
    expect(p.resultingFilename.value).toBe('Urlaub.png')
    ext.value = 'jpeg'
    expect(p.resultingFilename.value).toBe('Urlaub.jpeg')
    p.confirm()
    await expect(result).resolves.toBe('Urlaub')
    expect(p.isOpen.value).toBe(false)
  })

  it('fällt bei leerem Namen auf den Standard zurück', async () => {
    const p = useFilenamePrompt(ref('png'))
    const result = p.prompt()
    p.filename.value = '   '
    expect(p.resultingFilename.value).toBe('collage.png')
    p.confirm()
    await expect(result).resolves.toBe('collage')
  })

  it('liefert null bei Abbruch und bei erneutem Öffnen', async () => {
    const p = useFilenamePrompt(ref('png'))
    const first = p.prompt()
    const second = p.prompt()
    await expect(first).resolves.toBeNull()
    expect(p.isOpen.value).toBe(true)
    p.cancel()
    await expect(second).resolves.toBeNull()
    expect(p.isOpen.value).toBe(false)
  })
})

describe('useCollageExport', () => {
  function setup(): CollageExportApi {
    const pinia = createPinia()
    setActivePinia(pinia)
    let api: CollageExportApi | null = null
    mount(
      defineComponent({
        setup() {
          api = useCollageExport()
          return () => h('div')
        },
      }),
      { global: { plugins: [pinia, i18n] } }
    )
    const collage = useCollageStore()
    collage.images.push({ id: 'img-1' } as never)
    return api!
  }

  it('zeigt den Qualitätsregler nur für JPEG, WebP und PDF', () => {
    const api = setup()
    expect(api.hasQuality.value).toBe(false)
    for (const format of ['jpeg', 'webp', 'pdf'] as const) {
      api.exportFormat.value = format
      expect(api.hasQuality.value).toBe(true)
    }
    api.exportFormat.value = 'png-transparent'
    expect(api.hasQuality.value).toBe(false)
  })

  it('lädt nach bestätigtem Dateinamen mit passender Endung herunter', async () => {
    const api = setup()
    let downloadName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadName = this.download
    })
    // jsdom kennt keine Object-URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })

    api.exportFormat.value = 'png-transparent'
    const done = api.startExport()
    expect(api.filenamePrompt.isOpen.value).toBe(true)
    api.filenamePrompt.filename.value = 'meine-collage'
    api.filenamePrompt.confirm()
    await done
    await flushPromises()

    expect(renderCollage).toHaveBeenCalledWith(
      expect.objectContaining({ transparent: true, supportsAlpha: true })
    )
    expect(downloadName).toBe('meine-collage.png')
    expect(useToastStore().toasts.at(-1)?.type).toBe('info')
  })

  it('rendert nach Abbruch des Dateinamens nichts', async () => {
    const api = setup()
    const done = api.startExport()
    api.filenamePrompt.cancel()
    await done
    expect(renderCollage).not.toHaveBeenCalled()
  })

  it('Vorschau: öffnen, schließen und aus der Vorschau herunterladen', async () => {
    const api = setup()
    await api.generatePreview()
    expect(api.showPreviewModal.value).toBe(true)
    expect(api.previewDataUrl.value).toBe('data:image/png;base64,AAAA')

    const done = api.closePreviewAndExport()
    expect(api.showPreviewModal.value).toBe(false)
    expect(api.previewDataUrl.value).toBeNull()
    await nextTick()
    expect(api.filenamePrompt.isOpen.value).toBe(true)
    api.filenamePrompt.cancel()
    await done
  })
})
