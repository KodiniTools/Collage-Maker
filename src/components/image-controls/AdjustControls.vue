<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div class="space-y-4">
    <!-- Rotation -->
    <ControlSlider
      :label="t('controls.rotate')"
      :display-value="`${Math.round(image.rotation)}°`"
      :value="image.rotation"
      :min="-180"
      :max="180"
      :show-reset="image.rotation !== 0"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateRotation"
      @reset="api.applyToSelected({ rotation: 0 })"
    />

    <!-- Deckkraft -->
    <ControlSlider
      :label="t('imageControls.opacity')"
      :display-value="`${Math.round(image.opacity * 100)}%`"
      :value="image.opacity"
      :min="0"
      :max="1"
      :step="0.01"
      :show-reset="image.opacity !== 1"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateOpacity"
      @reset="api.applyToSelected({ opacity: 1 })"
    />

    <!-- Eckenradius -->
    <ControlSlider
      :label="t('imageControls.borderRadius')"
      :display-value="`${Math.round(image.borderRadius)}px`"
      :value="image.borderRadius"
      :min="0"
      :max="100"
      :show-reset="image.borderRadius !== 0"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateBorderRadius"
      @reset="api.applyToSelected({ borderRadius: 0 })"
    />
  </div>
</template>
