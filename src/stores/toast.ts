import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast } from '@/types'

// Persistenz der "Nicht mehr anzeigen"-Auswahl.
const DISMISSED_STORAGE_KEY = 'collage-maker-dismissed-toasts'

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? new Set(parsed.filter((x): x is string => typeof x === 'string'))
      : new Set()
  } catch {
    return new Set()
  }
}

function persistDismissed(keys: Set<string>): void {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    /* localStorage nicht verfügbar (z. B. Private Mode) – still ignorieren */
  }
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  // Dauerhaft abgeschaltete Meldungs-Schlüssel.
  const dismissedKeys = ref<Set<string>>(loadDismissed())

  function showToast(
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000,
    action?: Toast['action'],
    dismissKey?: string
  ) {
    // Dauerhaft abgeschaltete Meldungen gar nicht erst anzeigen.
    if (dismissKey && dismissedKeys.value.has(dismissKey)) return null

    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, duration, action, dismissKey }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: string | null) {
    if (!id) return
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration = 3000) {
    return showToast(message, 'success', duration)
  }

  function error(message: string, duration = 4000) {
    return showToast(message, 'error', duration)
  }

  function info(message: string, duration = 3000) {
    return showToast(message, 'info', duration)
  }

  /**
   * Subtile, abschaltbare Benachrichtigung. `key` ist ein stabiler Schlüssel
   * (üblicherweise der i18n-Schlüssel der Meldung). Ist er dauerhaft
   * abgeschaltet, erscheint nichts. Der Toast erhält einen
   * "Nicht mehr anzeigen"-Button.
   */
  function notify(key: string, message: string, type: Toast['type'] = 'info', duration = 2500) {
    return showToast(message, type, duration, undefined, key)
  }

  /** "Nicht mehr anzeigen": Schlüssel dauerhaft merken und aktive Toasts damit entfernen. */
  function dismissForever(key: string) {
    dismissedKeys.value.add(key)
    persistDismissed(dismissedKeys.value)
    toasts.value = toasts.value.filter((t) => t.dismissKey !== key)
  }

  function isDismissed(key: string) {
    return dismissedKeys.value.has(key)
  }

  /** Alle Abschaltungen zurücksetzen (Meldungen wieder aktivieren). */
  function resetDismissed() {
    dismissedKeys.value = new Set()
    persistDismissed(dismissedKeys.value)
  }

  return {
    toasts,
    dismissedKeys,
    showToast,
    removeToast,
    success,
    error,
    info,
    notify,
    dismissForever,
    isDismissed,
    resetDismissed,
  }
})
