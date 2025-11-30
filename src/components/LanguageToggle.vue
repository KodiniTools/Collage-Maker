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
  <div class="flex gap-1 p-1 bg-muted/20 dark:bg-slate/50 rounded-lg">
    <button
      @click="switchLocale('de')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors',
        settings.locale === 'de'
          ? 'bg-surface-light dark:bg-surface-dark shadow'
          : 'hover:bg-muted/30 dark:hover:bg-slate/70'
      ]"
    >
      de
    </button>
    <button
      @click="switchLocale('en')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors',
        settings.locale === 'en'
          ? 'bg-surface-light dark:bg-surface-dark shadow'
          : 'hover:bg-muted/30 dark:hover:bg-slate/70'
      ]"
    >
      en
    </button>
  </div>
</template>
