<script setup lang="ts">
import { computed } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

const backgroundColor = computed({
  get: () => collage.settings.backgroundColor,
  set: (value: string) => {
    collage.updateSettings({ backgroundColor: value })
  }
})

// Vordefinierte Farben für schnelle Auswahl
const presetColors = [
  '#ffffff', // Weiß
  '#f3f4f6', // Hell-Grau
  '#000000', // Schwarz
  '#1f2937', // Dunkel-Grau
  '#ef4444', // Rot
  '#3b82f6', // Blau
  '#10b981', // Grün
  '#f59e0b', // Orange
  '#8b5cf6', // Lila
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h3 class="text-lg font-semibold mb-4">{{ t('canvasSettings.title') }}</h3>

    <div class="space-y-4">
      <!-- Hintergrundfarbe -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvasSettings.backgroundColor') }}
        </label>

        <!-- Farbauswahl mit Vorschau -->
        <div class="flex items-center gap-3 mb-3">
          <input
            v-model="backgroundColor"
            type="color"
            class="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <div class="flex-1">
            <input
              v-model="backgroundColor"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <!-- Vordefinierte Farben -->
        <div>
          <label class="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
            {{ t('canvasSettings.presetColors') }}
          </label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="color in presetColors"
              :key="color"
              @click="backgroundColor = color"
              :class="[
                'w-full aspect-square rounded border-2 transition-all hover:scale-110',
                backgroundColor === color
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-300 dark:border-gray-600'
              ]"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>
      </div>

      <!-- Canvas Größe Info -->
      <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium mb-2">
          {{ t('canvasSettings.size') }}
        </label>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ collage.settings.width }} × {{ collage.settings.height }} px
        </div>
      </div>
    </div>
  </div>
</template>
