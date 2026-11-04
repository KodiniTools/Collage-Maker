/** Merker, dass bereits einmal wegen eines fehlenden Chunks neu geladen wurde. */
export const CHUNK_RELOAD_KEY = 'collagemaker-chunk-reload'

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chromium
  /error loading dynamically imported module/i, // Firefox
  /Importing a module script failed/i, // Safari
  /Unable to preload CSS/i, // Vite-Preload-Helper
]

/** Erkennt Fehler beim Nachladen eines Routen-Chunks (z. B. nach einem Deploy). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function readFlag(storage: Storage | undefined): string | null {
  try {
    return storage?.getItem(CHUNK_RELOAD_KEY) ?? null
  } catch {
    return null
  }
}

function writeFlag(storage: Storage | undefined, value: string | null) {
  try {
    if (value === null) storage?.removeItem(CHUNK_RELOAD_KEY)
    else storage?.setItem(CHUNK_RELOAD_KEY, value)
  } catch {
    // Speicher gesperrt: dann ohne Schleifenschutz-Merker
  }
}

/**
 * Lädt nach einem fehlgeschlagenen Chunk-Import einmal die Zielseite neu, damit nach
 * einem Deploy die neuen Dateinamen geladen werden. Gibt `true` zurück, wenn neu geladen
 * wird. Ein zweiter Fehler für dasselbe Ziel lädt nicht erneut (keine Endlosschleife).
 */
export function reloadOnChunkError(
  error: unknown,
  targetUrl: string,
  win: Pick<Window, 'location'> & { sessionStorage?: Storage } = window
): boolean {
  if (!isChunkLoadError(error)) return false
  if (readFlag(win.sessionStorage) === targetUrl) return false
  writeFlag(win.sessionStorage, targetUrl)
  win.location.assign(targetUrl)
  return true
}

/** Nach erfolgreicher Navigation den Merker löschen, damit ein späterer Deploy wieder greift. */
export function clearChunkReloadFlag(storage: Storage | undefined = globalThis.sessionStorage) {
  writeFlag(storage, null)
}
