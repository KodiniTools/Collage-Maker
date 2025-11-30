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

function updateZoom(value: number) {
  collage.setCanvasZoom(value)
}

function resetZoom() {
  collage.setCanvasZoom(1)
}
</script>

<template>
  <div class="w-full bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4">
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
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
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
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
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
            class="w-16 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
          />
          <input
            type="text"
            :value="collage.settings.backgroundColor"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
            placeholder="#ffffff"
            class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm font-mono"
          />
        </div>
      </div>

      <!-- Zoom Control -->
      <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium">
            {{ t('canvas.zoom') }}: {{ Math.round(collage.canvasZoom * 100) }}%
          </label>
          <button
            @click="resetZoom"
            class="text-xs px-2 py-1 bg-muted/20 dark:bg-slate/50 hover:bg-muted/30 dark:hover:bg-slate/70 rounded transition-colors"
          >
            {{ t('canvas.resetZoom') }}
          </button>
        </div>
        <input
          type="range"
          :value="collage.canvasZoom"
          @input="updateZoom(Number(($event.target as HTMLInputElement).value))"
          min="0.25"
          max="2"
          step="0.05"
          class="w-full"
        />
        <p class="text-xs text-muted mt-1">
          {{ t('canvas.zoomHint') }}
        </p>
      </div>
    </div>
  </div>
</template>
