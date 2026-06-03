import { jsPDF } from 'jspdf'

export interface PdfOptions {
  canvas: HTMLCanvasElement
  filename?: string
  quality?: number
}

// Pixel → mm bei 96 DPI (Standard-Bildschirmauflösung)
const PX_TO_MM = 25.4 / 96

export async function exportToPdf({ canvas, filename, quality: _quality = 0.95 }: PdfOptions): Promise<void> {
  const widthPx = canvas.width
  const heightPx = canvas.height
  const widthMm = widthPx * PX_TO_MM
  const heightMm = heightPx * PX_TO_MM

  const orientation = widthPx >= heightPx ? 'landscape' : 'portrait'

  // mm-Einheiten vermeiden px_scaling-Artefakte
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
  })

  // PNG für verlustfreie Qualität; SLOW = höchste jsPDF-Bildqualität
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'SLOW')

  pdf.save(filename ?? `collage-${Date.now()}.pdf`)
}
