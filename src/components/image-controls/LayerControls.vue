<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div>
    <label class="block text-sm font-medium mb-2">{{ t('imageControls.layer') }}</label>
    <div class="grid grid-cols-2 gap-2">
      <button
        class="px-3 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-sm text-sm"
        :title="t('imageControls.toFront')"
        @click="api.bringToFront"
      >
        {{ t('imageControls.toFront') }}
      </button>
      <button
        class="px-3 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-sm text-sm"
        :title="t('imageControls.toBack')"
        @click="api.sendToBack"
      >
        {{ t('imageControls.toBack') }}
      </button>
      <button
        class="px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-sm text-sm"
        :title="t('imageControls.forward')"
        @click="api.bringForward"
      >
        {{ t('imageControls.forward') }}
      </button>
      <button
        class="px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-sm text-sm"
        :title="t('imageControls.backward')"
        @click="api.sendBackward"
      >
        {{ t('imageControls.backward') }}
      </button>
    </div>
  </div>
</template>
