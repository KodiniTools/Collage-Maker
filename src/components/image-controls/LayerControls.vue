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
        class="px-3 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-md text-sm"
        :title="t('imageControls.toFront')"
        @click="api.bringToFront"
      >
        {{ t('imageControls.toFront') }}
      </button>
      <button
        class="px-3 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-md text-sm"
        :title="t('imageControls.toBack')"
        @click="api.sendToBack"
      >
        {{ t('imageControls.toBack') }}
      </button>
      <button
        class="px-3 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md text-sm"
        :title="t('imageControls.forward')"
        @click="api.bringForward"
      >
        {{ t('imageControls.forward') }}
      </button>
      <button
        class="px-3 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md text-sm"
        :title="t('imageControls.backward')"
        @click="api.sendBackward"
      >
        {{ t('imageControls.backward') }}
      </button>
    </div>
  </div>
</template>
