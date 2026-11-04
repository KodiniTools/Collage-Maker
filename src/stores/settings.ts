import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme, Locale } from '@/types'
import { i18n, initialLocale } from '@/i18n'
import { ssiNavTranslations } from '@/i18n/nav'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'light')
  // Startsprache inkl. ?lang=de|en (hreflang-Ziel), siehe i18n/index.ts
  const locale = ref<Locale>(initialLocale)

  // MutationObserver state (declared early because theme watcher runs immediately)
  let themeObserver: MutationObserver | null = null
  let ignoreMutation = false

  // Theme watcher: html[data-theme] schaltet die Design-Tokens (--ds-*) und die
  // globale SSI-Navigation, body.light-theme hält Parität zum Playlist Generator,
  // html.dark bleibt als Altbestand für externe Skripte erhalten.
  watch(
    theme,
    (newTheme) => {
      localStorage.setItem('theme', newTheme)
      // Suppress MutationObserver while we set the attribute ourselves
      ignoreMutation = true
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      document.documentElement.setAttribute('data-theme', newTheme)
      document.body.classList.toggle('light-theme', newTheme === 'light')
      ignoreMutation = false
      // Sync SSI nav theme icons (moon/sun emoji)
      document.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
        icon.textContent = newTheme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F'
      })
    },
    { immediate: true }
  )

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
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
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
    stopListening,
  }
})
