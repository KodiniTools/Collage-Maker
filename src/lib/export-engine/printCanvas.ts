/**
 * Druckt ein gerendertes Collage-Canvas über den nativen Druckdialog des Browsers.
 *
 * Ablauf: Canvas → PNG-Data-URL → verstecktes iframe mit Druck-Stylesheet →
 * `contentWindow.print()`. Ein iframe statt `window.open()` vermeidet Popup-Blocker
 * und lässt die eigentliche Seite unverändert.
 */

export type PrintOrientation = 'portrait' | 'landscape'

export interface PrintDocumentOptions {
  imageSrc: string
  title: string
  orientation: PrintOrientation
}

export interface PrintCanvasOptions {
  /** Titel des Druckauftrags (erscheint im Druckdialog / als PDF-Name). */
  title?: string
  /** Ziel-Dokument, in das das Druck-iframe eingehängt wird (Default: `document`). */
  doc?: Document
  /** Maximale Wartezeit auf das Laden des Bildes, bevor trotzdem gedruckt wird. */
  timeoutMs?: number
  /** Öffnet den Druckdialog; austauschbar für Tests. */
  printer?: (win: Window) => void
}

export const PRINT_FRAME_ID = 'collage-print-frame'

/** Zeit, nach der ein verwaistes Druck-iframe spätestens entfernt wird (Safari feuert `afterprint` nicht zuverlässig). */
const FRAME_CLEANUP_FALLBACK_MS = 60_000

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function getPrintOrientation(width: number, height: number): PrintOrientation {
  return width >= height ? 'landscape' : 'portrait'
}

/**
 * Erzeugt das HTML-Dokument für den Druck. Das Bild wird proportional auf eine
 * einzelne Seite eingepasst; die Seitenausrichtung folgt dem Seitenverhältnis.
 */
export function buildPrintDocument({ imageSrc, title, orientation }: PrintDocumentOptions): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    `@page { size: ${orientation}; margin: 10mm; }`,
    'html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; }',
    'body { display: flex; align-items: center; justify-content: center; }',
    'img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; page-break-inside: avoid; }',
    '</style>',
    '</head>',
    '<body>',
    `<img src="${imageSrc}" alt="${escapeHtml(title)}">`,
    '</body>',
    '</html>',
  ].join('')
}

function waitForImage(img: HTMLImageElement | null, timeoutMs: number): Promise<void> {
  if (!img) return Promise.resolve()
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(done, timeoutMs)
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

function defaultPrinter(win: Window): void {
  win.focus()
  win.print()
}

export async function printCanvas(
  canvas: HTMLCanvasElement,
  options: PrintCanvasOptions = {}
): Promise<void> {
  const doc = options.doc ?? document
  const title = options.title ?? 'Collage'
  const printer = options.printer ?? defaultPrinter
  const timeoutMs = options.timeoutMs ?? 10_000

  // PNG: verlustfrei, Transparenz wird auf weißem Druckhintergrund korrekt dargestellt
  const imageSrc = canvas.toDataURL('image/png')

  // Verwaistes iframe eines früheren Druckauftrags entfernen
  doc.getElementById(PRINT_FRAME_ID)?.remove()

  const iframe = doc.createElement('iframe')
  iframe.id = PRINT_FRAME_ID
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('title', title)
  // Nicht `display:none` – Firefox druckt dann leere Seiten
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  doc.body.appendChild(iframe)

  const frameDoc = iframe.contentDocument
  const frameWin = iframe.contentWindow
  if (!frameDoc || !frameWin) {
    iframe.remove()
    throw new Error('Print frame is not accessible')
  }

  try {
    frameDoc.open()
    frameDoc.write(
      buildPrintDocument({
        imageSrc,
        title,
        orientation: getPrintOrientation(canvas.width, canvas.height),
      })
    )
    frameDoc.close()

    await waitForImage(frameDoc.querySelector('img'), timeoutMs)

    const cleanup = () => iframe.remove()
    frameWin.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(cleanup, FRAME_CLEANUP_FALLBACK_MS)

    printer(frameWin)
  } catch (error) {
    iframe.remove()
    throw error
  }
}
