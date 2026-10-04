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
  <!-- Hilfsraster -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('grid.enabled') }}</span>
      <UiButton
        size="sm"
        :variant="collage.settings.gridEnabled ? 'primary' : 'secondary'"
        :aria-pressed="collage.settings.gridEnabled"
        @click="api.toggleGrid"
      >
        {{ collage.settings.gridEnabled ? t('grid.on') : t('grid.off') }}
      </UiButton>
    </div>

    <!-- Rastergröße -->
    <div v-if="collage.settings.gridEnabled" class="mt-3">
      <label for="canvas-grid-size" class="block text-xs text-ink-2 mb-1">
        {{ t('grid.size') }}: {{ collage.settings.gridSize }}px
      </label>
      <input
        id="canvas-grid-size"
        type="range"
        :value="collage.settings.gridSize"
        min="10"
        max="200"
        step="5"
        class="w-full"
        @input="api.updateGridSize(Number(($event.target as HTMLInputElement).value))"
      />
      <div class="flex justify-between text-xs text-ink-2 mt-1">
        <span>10px</span>
        <span>200px</span>
      </div>
    </div>

    <p class="text-xs text-ink-2 mt-3">
      {{ t('grid.hint') }}
    </p>
  </div>
</template>
