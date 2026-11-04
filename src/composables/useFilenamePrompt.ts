import { computed, ref, type Ref } from 'vue'

/** Dateiname, wenn der Nutzer nichts (oder nur Leerzeichen) eingibt. */
export const DEFAULT_EXPORT_FILENAME = 'collage'

/**
 * Promise-basierter Dateinamen-Dialog für den Export.
 *
 * `prompt()` öffnet den Dialog und löst mit dem bereinigten Namen (ohne Endung)
 * oder `null` (Abbruch) auf. Ein erneuter `prompt()` bei offenem Dialog bricht
 * die vorherige Anfrage mit `null` ab, damit kein Promise hängen bleibt.
 *
 * @param extension Aktuelle Dateiendung (ohne Punkt) für die Vorschau `resultingFilename`.
 */
export function useFilenamePrompt(extension: Ref<string>) {
  const isOpen = ref(false)
  const filename = ref(DEFAULT_EXPORT_FILENAME)
  let resolvePending: ((name: string | null) => void) | null = null

  const resultingFilename = computed(
    () => `${filename.value.trim() || DEFAULT_EXPORT_FILENAME}.${extension.value}`
  )

  function settle(name: string | null) {
    isOpen.value = false
    const resolve = resolvePending
    resolvePending = null
    resolve?.(name)
  }

  function prompt(): Promise<string | null> {
    if (resolvePending) settle(null)
    filename.value = DEFAULT_EXPORT_FILENAME
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePending = resolve
    })
  }

  function confirm() {
    settle(filename.value.trim() || DEFAULT_EXPORT_FILENAME)
  }

  function cancel() {
    settle(null)
  }

  return { isOpen, filename, resultingFilename, prompt, confirm, cancel }
}
