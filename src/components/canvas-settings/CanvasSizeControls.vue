<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ResetButton from '@/components/ResetButton.vue'
  import { UiButton, UiCallout } from '@/components/ui'
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
      <UiButton
        size="sm"
        :variant="api.keepAspect.value ? 'primary' : 'secondary'"
        :title="t('canvas.keepAspectRatio')"
        :aria-pressed="api.keepAspect.value"
        @click="api.toggleKeepAspect"
      >
        <template #icon>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path
              v-if="api.keepAspect.value"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
        </template>
        {{ api.keepAspect.value ? t('canvas.on') : t('canvas.off') }}
      </UiButton>
    </div>

    <!-- Inhalte mitskalieren -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('canvas.scaleContent') }}</span>
      <UiButton
        size="sm"
        :variant="api.scaleContent.value ? 'primary' : 'secondary'"
        :title="t('canvas.scaleContent')"
        :aria-pressed="api.scaleContent.value"
        @click="api.toggleScaleContent"
      >
        <template #icon>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </template>
        {{ api.scaleContent.value ? t('canvas.on') : t('canvas.off') }}
      </UiButton>
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
