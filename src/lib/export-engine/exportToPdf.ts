import { jsPDF } from 'jspdf'

export interface PdfOptions {
  canvas: HTMLCanvasElement
  filename?: string
  quality?: number
}

export async function exportToPdf({ canvas, filename, quality = 0.95 }: PdfOptions): Promise<void> {
  const widthPx = canvas.width
  const heightPx = canvas.height

  // jsPDF in Pixel-Einheiten, Seitenformat = Canvas-Größe
  const orientation = widthPx >= heightPx ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [widthPx, heightPx],
    hotfixes: ['px_scaling'],
  })

  // Canvas als hochqualitatives JPEG einbetten
  const imgData = canvas.toDataURL('image/jpeg', quality)
  pdf.addImage(imgData, 'JPEG', 0, 0, widthPx, heightPx, undefined, 'FAST')

  pdf.save(filename ?? `collage-${Date.now()}.pdf`)
}
