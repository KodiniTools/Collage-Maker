import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildPrintDocument,
  getPrintOrientation,
  printCanvas,
  PRINT_FRAME_ID,
} from '@/lib/export-engine/printCanvas'

const DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  return {
    width,
    height,
    toDataURL: vi.fn(() => DATA_URL),
  } as unknown as HTMLCanvasElement
}

function getFrame(): HTMLIFrameElement | null {
  return document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null
}

/** Simuliert das Laden des Bildes im Druck-iframe (jsdom lädt keine Bilder). */
function fireImageLoad() {
  const img = getFrame()?.contentDocument?.querySelector('img')
  img?.dispatchEvent(new Event('load'))
}

afterEach(() => {
  getFrame()?.remove()
  vi.useRealTimers()
})

describe('getPrintOrientation', () => {
  it('returns landscape for wide or square canvases', () => {
    expect(getPrintOrientation(1920, 1080)).toBe('landscape')
    expect(getPrintOrientation(1000, 1000)).toBe('landscape')
  })

  it('returns portrait for tall canvases', () => {
    expect(getPrintOrientation(1080, 1920)).toBe('portrait')
  })
})

describe('buildPrintDocument', () => {
  it('embeds the image, orientation and escaped title', () => {
    const html = buildPrintDocument({
      imageSrc: DATA_URL,
      title: 'My <Collage> & "Print"',
      orientation: 'portrait',
    })
    expect(html).toContain(`<img src="${DATA_URL}"`)
    expect(html).toContain('@page { size: portrait;')
    expect(html).toContain('<title>My &lt;Collage&gt; &amp; &quot;Print&quot;</title>')
    expect(html).not.toContain('<Collage>')
  })
})

describe('printCanvas', () => {
  it('writes the document into a hidden iframe and calls the printer after image load', async () => {
    const printer = vi.fn()
    const canvas = makeCanvas(800, 1200)

    const promise = printCanvas(canvas, { title: 'Test', printer })

    const frame = getFrame()
    expect(frame).not.toBeNull()
    expect(frame?.getAttribute('aria-hidden')).toBe('true')
    expect(frame?.style.display).not.toBe('none')

    const frameDoc = frame?.contentDocument
    expect(frameDoc?.querySelector('img')?.getAttribute('src')).toBe(DATA_URL)
    expect(frameDoc?.querySelector('style')?.textContent).toContain('size: portrait')
    expect(frameDoc?.title).toBe('Test')

    expect(printer).not.toHaveBeenCalled()
    fireImageLoad()
    await promise

    expect(printer).toHaveBeenCalledTimes(1)
    expect(printer).toHaveBeenCalledWith(frame?.contentWindow)
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
  })

  it('removes the iframe on afterprint', async () => {
    const printer = vi.fn()
    const promise = printCanvas(makeCanvas(100, 50), { printer })
    fireImageLoad()
    await promise

    const frame = getFrame()
    expect(frame).not.toBeNull()
    frame?.contentWindow?.dispatchEvent(new Event('afterprint'))
    expect(getFrame()).toBeNull()
  })

  it('prints after the timeout if the image never reports load', async () => {
    vi.useFakeTimers()
    const printer = vi.fn()
    const promise = printCanvas(makeCanvas(100, 50), { printer, timeoutMs: 500 })

    await vi.advanceTimersByTimeAsync(499)
    expect(printer).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(printer).toHaveBeenCalledTimes(1)
  })

  it('replaces a stale print frame from a previous job', async () => {
    const printer = vi.fn()
    const first = printCanvas(makeCanvas(100, 50), { printer })
    fireImageLoad()
    await first
    const firstFrame = getFrame()

    const second = printCanvas(makeCanvas(50, 100), { printer })
    fireImageLoad()
    await second

    expect(document.querySelectorAll(`#${PRINT_FRAME_ID}`).length).toBe(1)
    expect(getFrame()).not.toBe(firstFrame)
  })

  it('removes the iframe and rethrows when the printer fails', async () => {
    const printer = vi.fn(() => {
      throw new Error('boom')
    })
    const promise = printCanvas(makeCanvas(100, 50), { printer })
    fireImageLoad()
    await expect(promise).rejects.toThrow('boom')
    expect(getFrame()).toBeNull()
  })
})
