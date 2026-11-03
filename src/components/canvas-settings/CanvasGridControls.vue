<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { UiSwitch } from '@/components/ui'
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
      <UiSwitch
        :model-value="collage.settings.gridEnabled"
        :label="t('grid.enabled')"
        label-hidden
        @update:model-value="api.toggleGrid()"
      />
    </div>

    <!-- Rastergröße -->
    <div v-if="collage.settings.gridEnabled" class="mt-3">
      <ControlSlider
        label-size="xs"
        :label="t('grid.size')"
        :display-value="`${collage.settings.gridSize}px`"
        :value="collage.settings.gridSize"
        :min="10"
        :max="200"
        :step="5"
        @input="api.updateGridSize"
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
