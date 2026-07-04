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
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <h4 class="text-sm font-semibold mb-3">{{ t('imageControls.imageFilters') }}</h4>

    <div class="space-y-3">
      <!-- Helligkeit -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.brightness')"
        :display-value="`${Math.round(image.brightness ?? 100)}%`"
        :value="image.brightness ?? 100"
        :min="0"
        :max="200"
        :show-reset="(image.brightness ?? 100) !== 100"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateBrightness"
        @reset="api.applyToSelected({ brightness: 100 })"
      />

      <!-- Kontrast -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.contrast')"
        :display-value="`${Math.round(image.contrast ?? 100)}%`"
        :value="image.contrast ?? 100"
        :min="0"
        :max="200"
        :show-reset="(image.contrast ?? 100) !== 100"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateContrast"
        @reset="api.applyToSelected({ contrast: 100 })"
      />

      <!-- Lichter -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.highlights')"
        :display-value="`${Math.round(image.highlights ?? 0)}`"
        :value="image.highlights ?? 0"
        :min="-100"
        :max="100"
        :show-reset="(image.highlights ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateHighlights"
        @reset="api.applyToSelected({ highlights: 0 })"
      />

      <!-- Tiefen -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.shadows')"
        :display-value="`${Math.round(image.shadows ?? 0)}`"
        :value="image.shadows ?? 0"
        :min="-100"
        :max="100"
        :show-reset="(image.shadows ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateShadows"
        @reset="api.applyToSelected({ shadows: 0 })"
      />

      <!-- Sättigung -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.saturation')"
        :display-value="`${Math.round(image.saturation ?? 100)}%`"
        :value="image.saturation ?? 100"
        :min="0"
        :max="200"
        :show-reset="(image.saturation ?? 100) !== 100"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateSaturation"
        @reset="api.applyToSelected({ saturation: 100 })"
      />

      <!-- Wärme -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.warmth')"
        :display-value="`${Math.round(image.warmth ?? 0)}`"
        :value="image.warmth ?? 0"
        :min="-100"
        :max="100"
        :show-reset="(image.warmth ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateWarmth"
        @reset="api.applyToSelected({ warmth: 0 })"
      />

      <!-- Schärfen -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.sharpness')"
        :display-value="`${Math.round(image.sharpness ?? 0)}`"
        :value="image.sharpness ?? 0"
        :min="0"
        :max="100"
        :show-reset="(image.sharpness ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateSharpness"
        @reset="api.applyToSelected({ sharpness: 0 })"
      />
    </div>
  </div>
</template>
