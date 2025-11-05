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
  <div class="flex gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
    <button
      @click="switchLocale('de')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors',
        settings.locale === 'de'
          ? 'bg-white dark:bg-gray-800 shadow'
          : 'hover:bg-gray-300 dark:hover:bg-gray-600'
      ]"
    >
      DE
    </button>
    <button
      @click="switchLocale('en')"
      :class="[
        'px-3 py-1 rounded text-sm font-medium transition-colors',
        settings.locale === 'en'
          ? 'bg-white dark:bg-gray-800 shadow'
          : 'hover:bg-gray-300 dark:hover:bg-gray-600'
      ]"
    >
      EN
    </button>
  </div>
</template>
