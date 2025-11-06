<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

function updateWidth(value: number) {
  collage.updateSettings({ width: value })
}

function updateHeight(value: number) {
  collage.updateSettings({ height: value })
}

function updateBackgroundColor(value: string) {
  collage.updateSettings({ backgroundColor: value })
}
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h2 class="text-lg font-semibold mb-4">{{ t('canvas.size') }}</h2>

    <div class="space-y-4">
      <!-- Canvas Width -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.width') }}: {{ collage.settings.width }}px
        </label>
        <input
          type="number"
          :value="collage.settings.width"
          @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
          min="400"
          max="4000"
          step="10"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        />
      </div>

      <!-- Canvas Height -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.height') }}: {{ collage.settings.height }}px
        </label>
        <input
          type="number"
          :value="collage.settings.height"
          @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
          min="400"
          max="4000"
          step="10"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        />
      </div>

      <!-- Background Color -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.background') }}
        </label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="collage.settings.backgroundColor"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
            class="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            :value="collage.settings.backgroundColor"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
            placeholder="#ffffff"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-mono"
          />
        </div>
      </div>
    </div>
  </div>
</template>
