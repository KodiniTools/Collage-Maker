<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ResetButton from '@/components/ResetButton.vue'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Ecken abrunden -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-2">
      <label for="canvas-corner-radius" class="text-sm font-medium">
        {{ t('canvas.cornerRadius') }}: {{ collage.settings.cornerRadius }}px
      </label>
      <ResetButton
        v-if="collage.settings.cornerRadius !== 0"
        :label="t('imageControls.resetValue')"
        @click="api.updateCornerRadius(0)"
      />
    </div>
    <input
      id="canvas-corner-radius"
      type="range"
      :value="collage.settings.cornerRadius"
      min="0"
      :max="api.maxCornerRadius.value"
      step="1"
      class="w-full"
      @input="api.updateCornerRadius(Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>
