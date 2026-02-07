<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types'

const settings = useSettingsStore()
const { locale } = useI18n()

function switchLocale(newLocale: Locale) {
  settings.setLocale(newLocale)
  locale.value = newLocale
}
</script>

<template>
  <div class="flex gap-1 p-1 bg-muted/20 dark:bg-navy/50 rounded-lg" role="group" aria-label="Language selection">
    <button
      @click="switchLocale('de')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent',
        settings.locale === 'de'
          ? 'bg-surface-light dark:bg-surface-dark shadow'
          : 'hover:bg-muted/30 dark:hover:bg-navy/70'
      ]"
      :aria-pressed="settings.locale === 'de'"
      aria-label="Deutsch"
    >
      de
    </button>
    <button
      @click="switchLocale('en')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent',
        settings.locale === 'en'
          ? 'bg-surface-light dark:bg-surface-dark shadow'
          : 'hover:bg-muted/30 dark:hover:bg-navy/70'
      ]"
      :aria-pressed="settings.locale === 'en'"
      aria-label="English"
    >
      en
    </button>
  </div>
</template>
