import { describe, it, expect, vi, beforeEach } from 'vitest'

const { jsPDFMock, addImage, save } = vi.hoisted(() => {
  const addImage = vi.fn()
  const save = vi.fn()
  const jsPDFMock = vi.fn(() => ({ addImage, save }))
  return { jsPDFMock, addImage, save }
})

vi.mock('jspdf', () => ({ jsPDF: jsPDFMock }))

import { exportToPdf } from '@/lib/export-engine'

function canvas(width: number, height: number): HTMLCanvasElement {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  el.toDataURL = vi.fn(() => 'data:image/png;base64,AAAA')
  return el
}

describe('exportToPdf', () => {
  beforeEach(() => {
    jsPDFMock.mockClear()
    addImage.mockClear()
    save.mockClear()
  })

  it('lädt jsPDF nach und legt das Bild seitenfüllend in mm ab', async () => {
    await exportToPdf({ canvas: canvas(960, 480), filename: 'test.pdf' })

    const mm = 25.4 / 96
    expect(jsPDFMock).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'mm',
      format: [960 * mm, 480 * mm],
    })
    expect(addImage).toHaveBeenCalledWith(
      'data:image/png;base64,AAAA',
      'PNG',
      0,
      0,
      960 * mm,
      480 * mm,
      undefined,
      'SLOW'
    )
    expect(save).toHaveBeenCalledWith('test.pdf')
  })

  it('wählt Hochformat bei hohem Canvas und einen Standardnamen', async () => {
    await exportToPdf({ canvas: canvas(300, 600) })

    expect(jsPDFMock).toHaveBeenCalledWith(expect.objectContaining({ orientation: 'portrait' }))
    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^collage-\d+\.pdf$/))
  })
})
