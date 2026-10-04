<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
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
      <label for="canvas-zoom" class="block text-sm font-medium">
        {{ t('canvas.zoom') }}: {{ Math.round(collage.canvasZoom * 100) }}%
      </label>
      <UiButton variant="secondary" size="sm" @click="api.resetView">
        {{ t('canvas.resetView') }}
      </UiButton>
    </div>
    <input
      id="canvas-zoom"
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
