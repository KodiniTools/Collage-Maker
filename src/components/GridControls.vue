<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

function toggleGrid() {
  collage.updateSettings({
    gridEnabled: !collage.settings.gridEnabled
  })
}

function updateGridSize(value: number) {
  collage.updateSettings({
    gridSize: value
  })
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('grid.title') }}</h2>

    <div class="space-y-4">
      <!-- Grid Toggle -->
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t('grid.enabled') }}</label>
        <button
          @click="toggleGrid"
          :class="[
            'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
            collage.settings.gridEnabled
              ? 'bg-accent hover:bg-accent-dark text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted'
          ]"
        >
          {{ collage.settings.gridEnabled ? t('grid.on') : t('grid.off') }}
        </button>
      </div>

      <!-- Grid Size Slider -->
      <div v-if="collage.settings.gridEnabled">
        <label class="block text-sm font-medium mb-2">
          {{ t('grid.size') }}: {{ collage.settings.gridSize }}px
        </label>
        <input
          type="range"
          :value="collage.settings.gridSize"
          @input="updateGridSize(Number(($event.target as HTMLInputElement).value))"
          min="10"
          max="200"
          step="5"
          class="w-full accent-accent"
        />
        <div class="flex justify-between text-xs text-muted mt-1">
          <span>10px</span>
          <span>200px</span>
        </div>
      </div>

      <!-- Info Text -->
      <p class="text-xs text-muted border-t border-muted/30 dark:border-slate/30 pt-3">
        {{ t('grid.hint') }}
      </p>
    </div>
  </div>
</template>
