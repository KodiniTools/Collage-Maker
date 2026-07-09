<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Ecken abrunden -->
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-medium">
        {{ t('canvas.cornerRadius') }}: {{ collage.settings.cornerRadius }}px
      </label>
      <button
        v-if="collage.settings.cornerRadius !== 0"
        class="text-xs text-muted hover:text-accent transition-colors"
        :title="t('imageControls.resetValue')"
        @click="api.updateCornerRadius(0)"
      >
        ↺
      </button>
    </div>
    <input
      type="range"
      :value="collage.settings.cornerRadius"
      min="0"
      :max="api.maxCornerRadius.value"
      step="1"
      class="w-full"
      :aria-label="t('canvas.cornerRadius')"
      @input="api.updateCornerRadius(Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>
