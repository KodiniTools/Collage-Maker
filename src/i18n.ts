import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import { resolveInitialLocale } from './config/seo'

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem('locale')
  } catch {
    return null
  }
}

// ?lang=en (hreflang-Ziel) hat Vorrang vor der gespeicherten Sprache. Das Ergebnis
// wird gespeichert, damit Settings-Store und SSI-Navigation dieselbe Sprache zeigen.
export const initialLocale = resolveInitialLocale(
  globalThis.location?.search ?? '',
  readStoredLocale()
)
try {
  localStorage.setItem('locale', initialLocale)
} catch {
  // Speicher gesperrt: Sprache gilt nur für diesen Aufruf
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    de,
    en,
  },
})
