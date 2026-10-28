import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import {
  canvasToBlob,
  canShareFileType,
  canShareImageFiles,
  shareFile,
  canCopyImage,
  copyImageToClipboard,
} from '@/lib/export-engine/shareCanvas'
import ExportControls from '@/components/ExportControls.vue'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { i18n } from '@/i18n'

vi.mock('@/lib/export-engine/renderCollage', () => ({
  renderCollage: vi.fn(async () => makeCanvas(new Blob(['png'], { type: 'image/png' }))),
}))

function makeCanvas(blob: Blob | null): HTMLCanvasElement {
  return {
    toBlob: vi.fn((cb: BlobCallback) => cb(blob)),
  } as unknown as HTMLCanvasElement
}

class FakeClipboardItem {
  constructor(public items: Record<string, Promise<Blob>>) {}
}

function stubShare(share: () => Promise<void>, canShare = (_d: ShareData) => true) {
  Object.defineProperty(navigator, 'share', { value: vi.fn(share), configurable: true })
  Object.defineProperty(navigator, 'canShare', { value: vi.fn(canShare), configurable: true })
}

function stubClipboard(write: (items: unknown[]) => Promise<void>) {
  vi.stubGlobal('ClipboardItem', FakeClipboardItem)
  Object.defineProperty(navigator, 'clipboard', {
    value: { write: vi.fn(write) },
    configurable: true,
  })
}

afterEach(() => {
  // jsdom kennt weder Web Share noch Clipboard-Bilder: Stubs vollständig entfernen.
  for (const key of ['share', 'canShare', 'clipboard'] as const) {
    delete (navigator as unknown as Record<string, unknown>)[key]
  }
  vi.unstubAllGlobals()
})

describe('canvasToBlob', () => {
  it('liefert den Blob des Canvas mit Typ und Qualität', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    const canvas = makeCanvas(blob)
    await expect(canvasToBlob(canvas, 'image/jpeg', 0.8)).resolves.toBe(blob)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8)
  })

  it('lehnt ab, wenn der Browser keinen Blob erzeugt', async () => {
    await expect(canvasToBlob(makeCanvas(null), 'image/png')).rejects.toThrow()
  })
})

describe('Feature-Erkennung', () => {
  it('ohne Web Share API kann nicht geteilt werden', () => {
    expect(canShareImageFiles()).toBe(false)
    expect(canShareFileType('image/webp')).toBe(false)
  })

  it('fragt canShare mit einer Datei des gewünschten Typs', () => {
    stubShare(
      async () => undefined,
      (data) => data.files?.[0]?.type === 'image/png'
    )
    expect(canShareImageFiles()).toBe(true)
    expect(canShareFileType('image/webp')).toBe(false)
  })

  it('Kopieren braucht clipboard.write und ClipboardItem', () => {
    expect(canCopyImage()).toBe(false)
    stubClipboard(async () => undefined)
    expect(canCopyImage()).toBe(true)
  })
})

describe('shareFile', () => {
  const file = new File(['x'], 'collage.png', { type: 'image/png' })

  it('teilt die Datei mit Titel', async () => {
    stubShare(async () => undefined)
    await expect(shareFile(file, 'Meine Collage')).resolves.toBe('shared')
    expect(navigator.share).toHaveBeenCalledWith({ files: [file], title: 'Meine Collage' })
  })

  it('wertet Abbruch durch den Nutzer nicht als Fehler', async () => {
    stubShare(() => Promise.reject(new DOMException('abort', 'AbortError')))
    await expect(shareFile(file)).resolves.toBe('cancelled')
  })

  it('meldet abgelaufene Nutzeraktion als blocked', async () => {
    stubShare(() => Promise.reject(new DOMException('no gesture', 'NotAllowedError')))
    await expect(shareFile(file)).resolves.toBe('blocked')
  })

  it('wirft bei anderen Fehlern und bei nicht teilbaren Dateien', async () => {
    stubShare(() => Promise.reject(new DOMException('fail', 'DataError')))
    await expect(shareFile(file)).rejects.toThrow()
    stubShare(
      async () => undefined,
      () => false
    )
    await expect(shareFile(file)).rejects.toThrow()
  })
})

describe('copyImageToClipboard', () => {
  it('schreibt ein PNG-ClipboardItem mit dem Blob-Promise', async () => {
    stubClipboard(async () => undefined)
    const blob = Promise.resolve(new Blob(['x'], { type: 'image/png' }))
    await copyImageToClipboard(blob)
    const [items] = vi.mocked(navigator.clipboard.write).mock.calls[0]
    expect(items[0]).toBeInstanceOf(FakeClipboardItem)
    expect((items[0] as unknown as FakeClipboardItem).items['image/png']).toBe(blob)
  })
})

describe('ExportControls: Teilen und Kopieren', () => {
  function mountControls() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const collage = useCollageStore()
    collage.images.push({ id: 'img-1' } as never)
    const wrapper = mount(ExportControls, {
      global: { plugins: [pinia, i18n], stubs: { teleport: true } },
    })
    return { wrapper, toast: useToastStore() }
  }

  function findButton(wrapper: ReturnType<typeof mount>, label: string) {
    return wrapper.findAll('button').find((b) => b.text() === label)
  }

  it('blendet die Buttons ohne Browser-Unterstützung aus', () => {
    const { wrapper } = mountControls()
    expect(wrapper.find('[data-testid="share-copy-row"]').exists()).toBe(false)
  })

  it('kopiert die Collage synchron im Klick als PNG', async () => {
    stubClipboard(async () => undefined)
    const { wrapper, toast } = mountControls()
    const copy = findButton(wrapper, i18n.global.t('export.copy'))
    expect(copy).toBeDefined()

    await copy!.trigger('click')
    // write muss vor jedem await laufen (Safari), also direkt nach dem Klick.
    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1)
    await flushPromises()
    expect(toast.toasts.at(-1)?.type).toBe('success')
  })

  it('teilt die Collage als Datei', async () => {
    stubShare(async () => undefined)
    const { wrapper, toast } = mountControls()
    await findButton(wrapper, i18n.global.t('export.share'))!.trigger('click')
    await flushPromises()

    const [data] = vi.mocked(navigator.share).mock.calls[0]
    expect(data?.files?.[0]).toBeInstanceOf(File)
    expect(data?.files?.[0].name).toBe('collage.png')
    expect(toast.toasts).toHaveLength(0)
  })

  it('bietet nach blockiertem Teilen einen zweiten Klick an', async () => {
    stubShare(() => Promise.reject(new DOMException('no gesture', 'NotAllowedError')))
    const { wrapper } = mountControls()
    await findButton(wrapper, i18n.global.t('export.share'))!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(i18n.global.t('export.shareReadyTitle'))

    vi.mocked(navigator.share).mockResolvedValueOnce(undefined)
    const buttons = wrapper
      .findAll('button')
      .filter((b) => b.text() === i18n.global.t('export.share'))
    await buttons.at(-1)!.trigger('click')
    await flushPromises()
    expect(navigator.share).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain(i18n.global.t('export.shareReadyTitle'))
  })
})
