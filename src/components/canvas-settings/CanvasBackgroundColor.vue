<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { ColorField } from '@/components/ui'
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
      <ColorField
        teleport-to="#modal-portal"
        :model-value="collage.settings.backgroundColor"
        :label="t('canvas.background')"
        class="!w-16 !h-10 rounded-sm"
        @update:model-value="api.updateBackgroundColor"
      />
      <input
        type="text"
        :value="collage.settings.backgroundColor"
        placeholder="#ffffff"
        class="flex-1 px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm font-mono"
        @input="api.updateBackgroundColor(($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="collage.settings.backgroundImage.url" class="text-xs text-ink-2 mt-1">
      {{ t('canvas.colorReplacesImage') }}
    </p>
  </div>
</template>
