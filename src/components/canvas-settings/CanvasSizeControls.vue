<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { UiCallout, UiSwitch } from '@/components/ui'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <div class="space-y-4">
    <!-- Seitenverhältnis beibehalten -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('canvas.keepAspectRatio') }}</span>
      <UiSwitch
        :model-value="api.keepAspect.value"
        :label="t('canvas.keepAspectRatio')"
        label-hidden
        @update:model-value="api.toggleKeepAspect()"
      />
    </div>

    <!-- Inhalte mitskalieren -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('canvas.scaleContent') }}</span>
      <UiSwitch
        :model-value="api.scaleContent.value"
        :label="t('canvas.scaleContent')"
        label-hidden
        @update:model-value="api.toggleScaleContent()"
      />
    </div>

    <!-- Canvas Width -->
    <ControlSlider
      :label="t('canvas.width')"
      :display-value="`${collage.settings.width}px`"
      :value="collage.settings.width"
      :min="api.MIN_SIZE"
      :max="api.MAX_SIZE"
      :step="1"
      :show-reset="collage.settings.width !== api.DEFAULT_WIDTH"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateWidth"
      @reset="api.resetWidth"
    />

    <!-- Canvas Height -->
    <ControlSlider
      :label="t('canvas.height')"
      :display-value="`${collage.settings.height}px`"
      :value="collage.settings.height"
      :min="api.MIN_SIZE"
      :max="api.MAX_SIZE"
      :step="1"
      :show-reset="collage.settings.height !== api.DEFAULT_HEIGHT"
      :reset-title="t('imageControls.resetValue')"
      @input="api.updateHeight"
      @reset="api.resetHeight"
    />

    <!-- Warnung bei sehr großer Leinwand (Mobile-Export-Limit) -->
    <UiCallout v-if="api.showLargeSizeWarning.value" type="warning">
      {{ t('canvas.largeSizeWarning') }}
    </UiCallout>
  </div>
</template>
