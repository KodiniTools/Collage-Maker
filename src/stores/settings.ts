import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme, Locale } from '@/types'
import { i18n } from '@/i18n'

// SSI nav translations — keys must match the data-i18n attributes in nav.html
const ssiNavTranslations: Record<string, Record<string, string>> = {
  de: {
    'nav.audioTools':      'Audiotools',
    'nav.mp3Converter':    'MP3 Konverter',
    'nav.audioEqualizer':  'Interaktiver Audio Equalizer',
    'nav.modernPlayer':    'Moderner Musikplayer',
    'nav.ultimatePlayer':  'Ultimativer Musikplayer',
    'nav.playlistGenerator': 'Audioplaylist Generator',
    'nav.playlistConverter': 'Playlist zu WebM Konverter',
    'nav.alarmTool':       'Alarmtool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer':      'Visualizer',
    'nav.equalizer19':     '19-Band Equalizer',
    'nav.audioConverter':  'Audio Konverter',
    'nav.imageTools':      'Bildtools',
    'nav.imageConverter':  'Bildkonverter',
    'nav.batchImageEditor': 'Bildserie bearbeiten',
    'nav.photoCollage':    'Fotocollage',
    'nav.tools':           'Tools',
    'nav.colorExtractor':  'Kodini Farbextraktor',
    'nav.videoConverter':  'Videokonverter',
    'nav.contact':         'Kontakt',
    'aria.toggleTheme':    'Theme wechseln',
    'aria.selectLanguage': 'Sprache wählen',
    'aria.menuOpen':       'Menü öffnen',
    'aria.menuClose':      'Menü schliessen',
    'aria.mainNav':        'Hauptnavigation'
  },
  en: {
    'nav.audioTools':      'Audio Tools',
    'nav.mp3Converter':    'MP3 Converter',
    'nav.audioEqualizer':  'Interactive Audio Equalizer',
    'nav.modernPlayer':    'Modern Music Player',
    'nav.ultimatePlayer':  'Ultimate Music Player',
    'nav.playlistGenerator': 'Audio Playlist Generator',
    'nav.playlistConverter': 'Playlist to WebM Converter',
    'nav.alarmTool':       'Alarm Tool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer':      'Visualizer',
    'nav.equalizer19':     '19-Band Equalizer',
    'nav.audioConverter':  'Audio Converter',
    'nav.imageTools':      'Image Tools',
    'nav.imageConverter':  'Image Converter',
    'nav.batchImageEditor': 'Batch Image Editor',
    'nav.photoCollage':    'Photo Collage',
    'nav.tools':           'Tools',
    'nav.colorExtractor':  'Kodini Color Extractor',
    'nav.videoConverter':  'Video Converter',
    'nav.contact':         'Contact',
    'aria.toggleTheme':    'Toggle theme',
    'aria.selectLanguage': 'Select language',
    'aria.menuOpen':       'Open menu',
    'aria.menuClose':      'Close menu',
    'aria.mainNav':        'Main navigation'
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'light')
  const locale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'de')

  // MutationObserver state (declared early because theme watcher runs immediately)
  let themeObserver: MutationObserver | null = null
  let ignoreMutation = false

  // Theme watcher - sync both class="dark" (Tailwind) and data-theme (global nav CSS)
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    // Suppress MutationObserver while we set the attribute ourselves
    ignoreMutation = true
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    ignoreMutation = false
    // Sync SSI nav theme icons (moon/sun emoji)
    document.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
      icon.textContent = newTheme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F'
    })
  }, { immediate: true })

  // Locale watcher - sync localStorage, html lang, vue-i18n, SSI nav buttons & text
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    i18n.global.locale.value = newLocale
    syncNavLangButtons(newLocale)
    translateSsiNav(newLocale)
  })

  // Listen for locale-changed event from global SSI nav
  function onLocaleChanged(e: Event) {
    const customEvent = e as CustomEvent<{ locale: string }>
    const newLang = customEvent.detail?.locale as Locale
    if (newLang && newLang !== locale.value) {
      locale.value = newLang
    }
  }

  // Translate all SSI nav DOM elements using data-i18n attributes
  function translateSsiNav(lang: string) {
    const t = ssiNavTranslations[lang] || ssiNavTranslations['de']
    const nav = document.querySelector('.global-nav')
    if (!nav) return

    nav.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n')
      if (key && t[key]) el.textContent = t[key]
    })

    nav.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria')
      if (key && t[key]) el.setAttribute('aria-label', t[key])
    })

    nav.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title')
      if (key && t[key]) el.setAttribute('title', t[key])
    })
  }

  // Keep SSI nav buttons' active class in sync
  function syncNavLangButtons(lang: string) {
    document.querySelectorAll('.global-nav-lang-btn').forEach((btn) => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  function startThemeObserver() {
    themeObserver = new MutationObserver((mutations) => {
      if (ignoreMutation) return
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') as Theme
          if (newTheme && newTheme !== theme.value) {
            theme.value = newTheme
          }
        }
      }
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }

  function startListening() {
    window.addEventListener('locale-changed', onLocaleChanged)
    startThemeObserver()
  }

  function stopListening() {
    window.removeEventListener('locale-changed', onLocaleChanged)
    if (themeObserver) {
      themeObserver.disconnect()
      themeObserver = null
    }
  }

  // Auto-start listening
  startListening()

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setLocale(newLocale: Locale) {
    locale.value = newLocale
  }

  return {
    theme,
    locale,
    toggleTheme,
    setLocale,
    startListening,
    stopListening
  }
})
