<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Background Color -->
  <div>
    <label class="block text-sm font-medium mb-2">
      {{ t('canvas.background') }}
    </label>
    <div class="flex gap-2">
      <input
        type="color"
        :value="collage.settings.backgroundColor"
        class="w-16 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
        @input="api.updateBackgroundColor(($event.target as HTMLInputElement).value)"
      />
      <input
        type="text"
        :value="collage.settings.backgroundColor"
        placeholder="#ffffff"
        class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm font-mono"
        @input="api.updateBackgroundColor(($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="collage.settings.backgroundImage.url" class="text-xs text-muted mt-1">
      {{ t('canvas.colorReplacesImage') }}
    </p>
  </div>
</template>
