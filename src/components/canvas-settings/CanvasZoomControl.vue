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
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium">
        {{ t('canvas.zoom') }}: {{ Math.round(collage.canvasZoom * 100) }}%
      </label>
      <button
        class="text-xs px-2 py-1 bg-surface-2 hover:bg-surface-3 rounded-sm transition-colors"
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
    <p class="text-xs text-ink-2 mt-1">
      {{ t('canvas.zoomHint') }}
    </p>
  </div>
</template>
