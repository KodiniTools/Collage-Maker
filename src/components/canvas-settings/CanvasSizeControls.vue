<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ResetButton from '@/components/ResetButton.vue'
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
    <div>
      <div class="flex items-center justify-between mb-2">
        <label for="canvas-width" class="text-sm font-medium">
          {{ t('canvas.width') }}: {{ collage.settings.width }}px
        </label>
        <ResetButton
          v-if="collage.settings.width !== api.DEFAULT_WIDTH"
          :label="t('imageControls.resetValue')"
          @click="api.resetWidth"
        />
      </div>
      <input
        id="canvas-width"
        type="number"
        :value="collage.settings.width"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="1"
        class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
        @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
      />
      <input
        type="range"
        :value="collage.settings.width"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="10"
        class="w-full mt-2"
        :aria-label="t('canvas.width')"
        @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Canvas Height -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label for="canvas-height" class="text-sm font-medium">
          {{ t('canvas.height') }}: {{ collage.settings.height }}px
        </label>
        <ResetButton
          v-if="collage.settings.height !== api.DEFAULT_HEIGHT"
          :label="t('imageControls.resetValue')"
          @click="api.resetHeight"
        />
      </div>
      <input
        id="canvas-height"
        type="number"
        :value="collage.settings.height"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="1"
        class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
        @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
      />
      <input
        type="range"
        :value="collage.settings.height"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="10"
        class="w-full mt-2"
        :aria-label="t('canvas.height')"
        @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Warnung bei sehr großer Leinwand (Mobile-Export-Limit) -->
    <UiCallout v-if="api.showLargeSizeWarning.value" type="warning">
      {{ t('canvas.largeSizeWarning') }}
    </UiCallout>
  </div>
</template>
