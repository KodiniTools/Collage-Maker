import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme, Locale } from '@/types'
import { i18n } from '@/i18n'

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

  // Locale watcher - sync localStorage, html lang, vue-i18n, and SSI nav buttons
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    i18n.global.locale.value = newLocale
    syncNavLangButtons(newLocale)
  })

  // Listen for theme-changed event from global SSI nav
  function onGlobalThemeChanged(e: Event) {
    const customEvent = e as CustomEvent<{ theme: string }>
    const newTheme = customEvent.detail?.theme as Theme
    if (newTheme && newTheme !== theme.value) {
      theme.value = newTheme
    }
  }

  // Intercept SSI nav language button clicks (capture phase)
  // to prevent the SSI nav's default reload and handle reactively
  function onNavLangClick(e: Event) {
    const target = (e.target as HTMLElement)?.closest('.global-nav-lang-btn') as HTMLElement | null
    if (!target) return

    const targetLang = target.getAttribute('data-lang') as Locale | null
    if (!targetLang || targetLang === locale.value) return

    // Stop the SSI nav's handler from running (which would reload)
    e.stopPropagation()
    e.preventDefault()

    // Update locale reactively — watcher handles the rest
    locale.value = targetLang
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
    // Capture phase so we run before the SSI nav's bubble-phase handler
    document.addEventListener('click', onNavLangClick, true)
  }

  function stopListening() {
    window.removeEventListener('theme-changed', onGlobalThemeChanged)
    document.removeEventListener('click', onNavLangClick, true)
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
