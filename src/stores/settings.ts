import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme, Locale } from '@/types'
import { i18n } from '@/i18n'

// SSI nav translations — mirrors the navTranslations in nav.html so the
// Vue app can translate the SSI navigation when locale changes from any source.
const ssiNavTranslations: Record<string, Record<string, string>> = {
  de: {
    'nav.aria':           'Hauptnavigation',
    'nav.audiotools':     'Audiotools',
    'nav.mp3converter':   'MP3 Konverter',
    'nav.audioequalizer': 'Interactive Audio Equalizer',
    'nav.modernplayer':   'Moderner Musikplayer',
    'nav.ultimateplayer': 'Ultimativer Musikplayer',
    'nav.playlistgen':    'Audio Playlist Generator',
    'nav.playlistconv':   'Audio Playlist Konverter',
    'nav.alarmtool':      'Modernes Alarmtool',
    'nav.normalizer':     'Audio Normalizer',
    'nav.visualizer':     'Audio Visualizer',
    'nav.eq19':           '19 Band Equalizer',
    'nav.audioconv':      'Audio Konverter',
    'nav.imagetools':     'Bildtools',
    'nav.imageconv':      'Bildkonverter',
    'nav.batchedit':      'Bildserie bearbeiten',
    'nav.collage':        'Fotocollage',
    'nav.tools':          'Tools',
    'nav.colorextractor': 'Kodini Farbextraktor',
    'nav.videoconv':      'Videokonverter',
    'nav.contact':        'Kontakt',
    'nav.themeAria':      'Theme wechseln',
    'nav.themeTitle':     'Hell/Dunkel umschalten',
    'nav.langAria':       'Sprache wählen'
  },
  en: {
    'nav.aria':           'Main Navigation',
    'nav.audiotools':     'Audio Tools',
    'nav.mp3converter':   'MP3 Converter',
    'nav.audioequalizer': 'Interactive Audio Equalizer',
    'nav.modernplayer':   'Modern Music Player',
    'nav.ultimateplayer': 'Ultimate Music Player',
    'nav.playlistgen':    'Audio Playlist Generator',
    'nav.playlistconv':   'Audio Playlist Converter',
    'nav.alarmtool':      'Modern Alarm Tool',
    'nav.normalizer':     'Audio Normalizer',
    'nav.visualizer':     'Audio Visualizer',
    'nav.eq19':           '19 Band Equalizer',
    'nav.audioconv':      'Audio Converter',
    'nav.imagetools':     'Image Tools',
    'nav.imageconv':      'Image Converter',
    'nav.batchedit':      'Batch Image Editor',
    'nav.collage':        'Photo Collage',
    'nav.tools':          'Tools',
    'nav.colorextractor': 'Kodini Color Extractor',
    'nav.videoconv':      'Video Converter',
    'nav.contact':        'Contact',
    'nav.themeAria':      'Toggle theme',
    'nav.themeTitle':     'Switch Light/Dark',
    'nav.langAria':       'Select language'
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'light')
  const locale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'de')

  // Theme watcher - sync both class="dark" (Tailwind) and data-theme (global nav CSS)
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, { immediate: true })

  // Locale watcher - sync localStorage, html lang, vue-i18n, SSI nav buttons & text
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    i18n.global.locale.value = newLocale
    syncNavLangButtons(newLocale)
    translateSsiNav(newLocale)
  })

  // Listen for theme-changed event from global SSI nav
  function onGlobalThemeChanged(e: Event) {
    const customEvent = e as CustomEvent<{ theme: string }>
    const newTheme = customEvent.detail?.theme as Theme
    if (newTheme && newTheme !== theme.value) {
      theme.value = newTheme
    }
  }

  // Listen for language-changed event from global SSI nav
  function onLanguageChanged(e: Event) {
    const customEvent = e as CustomEvent<{ lang: string }>
    const newLang = customEvent.detail?.lang as Locale
    if (newLang && newLang !== locale.value) {
      locale.value = newLang
    }
  }

  // Translate all SSI nav DOM elements using data-nav-i18n attributes
  function translateSsiNav(lang: string) {
    const t = ssiNavTranslations[lang] || ssiNavTranslations['de']
    const nav = document.querySelector('.global-nav')
    if (!nav) return

    nav.querySelectorAll('[data-nav-i18n]').forEach((el) => {
      const key = el.getAttribute('data-nav-i18n')
      if (key && t[key]) el.textContent = t[key]
    })

    nav.querySelectorAll('[data-nav-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-nav-i18n-aria')
      if (key && t[key]) el.setAttribute('aria-label', t[key])
    })

    nav.querySelectorAll('[data-nav-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-nav-i18n-title')
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

  function startListening() {
    window.addEventListener('theme-changed', onGlobalThemeChanged)
    window.addEventListener('language-changed', onLanguageChanged)
  }

  function stopListening() {
    window.removeEventListener('theme-changed', onGlobalThemeChanged)
    window.removeEventListener('language-changed', onLanguageChanged)
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
