import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme, Locale } from '@/types'

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

  // Locale watcher
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
  })

  // Listen for theme-changed event from global SSI nav
  function onGlobalThemeChanged(e: Event) {
    const customEvent = e as CustomEvent<{ theme: string }>
    const newTheme = customEvent.detail?.theme as Theme
    if (newTheme && newTheme !== theme.value) {
      theme.value = newTheme
    }
  }

  function startListening() {
    window.addEventListener('theme-changed', onGlobalThemeChanged)
  }

  function stopListening() {
    window.removeEventListener('theme-changed', onGlobalThemeChanged)
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
