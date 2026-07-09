<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Zoom Control -->
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium">
        {{ t('canvas.zoom') }}: {{ Math.round(collage.canvasZoom * 100) }}%
      </label>
      <button
        class="text-xs px-2 py-1 bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 rounded transition-colors"
        @click="api.resetView"
      >
        {{ t('canvas.resetView') }}
      </button>
    </div>
    <input
      type="range"
      :value="collage.canvasZoom"
      min="0.25"
      max="4"
      step="0.05"
      class="w-full"
      @input="api.updateZoom(Number(($event.target as HTMLInputElement).value))"
    />
    <p class="text-xs text-muted mt-1">
      {{ t('canvas.zoomHint') }}
    </p>
  </div>
</template>
