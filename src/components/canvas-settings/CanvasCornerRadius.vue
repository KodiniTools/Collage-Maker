<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Ecken abrunden -->
  <div class="border-t border-line pt-4">
    <ControlSlider
      :label="t('canvas.cornerRadius')"
      :display-value="`${collage.settings.cornerRadius}px`"
      :value="collage.settings.cornerRadius"
      :min="0"
      :max="api.maxCornerRadius.value"
      :step="1"
      :show-reset="collage.settings.cornerRadius !== 0"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateCornerRadius"
      @reset="api.updateCornerRadius(0)"
    />
  </div>
</template>
