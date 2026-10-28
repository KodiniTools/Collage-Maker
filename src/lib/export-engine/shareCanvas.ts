/**
 * Teilen (Web Share API Level 2) und Kopieren (Async Clipboard API) der
 * gerenderten Collage. Alle Funktionen prüfen die Browser-Unterstützung selbst,
 * damit die UI die Buttons nur anbietet, wenn sie auch funktionieren.
 */

/** Ergebnis eines Teilen-Versuchs. `blocked` = Browser verlangt eine neue Nutzeraktion. */
export type ShareResult = 'shared' | 'cancelled' | 'blocked'

/** Wandelt ein Canvas in einen Blob; lehnt ab, wenn der Browser keinen liefert. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      type,
      quality
    )
  })
}

/**
 * True, wenn der Browser Dateien dieses MIME-Typs über das System-Teilen-Menü
 * teilen kann. Geprüft wird mit einer leeren Datei, weil `canShare` nur den Typ bewertet.
 */
export function canShareFileType(type: string): boolean {
  if (typeof navigator === 'undefined') return false
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }
  try {
    const extension = type.split('/')[1] || 'bin'
    const probe = new File([], `probe.${extension}`, { type })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

/** True, wenn der Browser Bilddateien (mindestens PNG) teilen kann. */
export function canShareImageFiles(): boolean {
  return canShareFileType('image/png')
}

/**
 * Öffnet das System-Teilen-Menü mit der Datei.
 * Abbruch durch den Nutzer ist kein Fehler (`cancelled`). Ist die Nutzeraktion
 * durch langes Rendern abgelaufen (v. a. Safari), kommt `blocked` zurück, damit
 * die UI einen zweiten Klick anbieten kann.
 */
export async function shareFile(file: File, title?: string): Promise<ShareResult> {
  const data: ShareData = { files: [file] }
  if (title) data.title = title
  if (!navigator.canShare(data)) {
    throw new Error(`Sharing of ${file.type} is not supported`)
  }
  try {
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'AbortError') return 'cancelled'
      if (error.name === 'NotAllowedError') return 'blocked'
    }
    throw error
  }
}

/** True, wenn Bilder per Async Clipboard API in die Zwischenablage geschrieben werden können. */
export function canCopyImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  )
}

/**
 * Schreibt ein PNG in die Zwischenablage.
 * Der Blob wird als Promise übergeben und `clipboard.write` sofort aufgerufen:
 * Safari erlaubt das Schreiben nur synchron im Klick-Handler, das Rendern darf
 * danach weiterlaufen. PNG ist das einzige Bildformat, das alle Browser annehmen.
 */
export function copyImageToClipboard(pngBlob: Promise<Blob>): Promise<void> {
  const item = new ClipboardItem({ 'image/png': pngBlob })
  return navigator.clipboard.write([item])
}
