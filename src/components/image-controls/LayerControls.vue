<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div>
    <span class="block text-sm font-medium mb-2">{{ t('imageControls.layer') }}</span>
    <div class="grid grid-cols-2 gap-2">
      <UiButton variant="secondary" size="sm" @click="api.bringToFront">
        {{ t('imageControls.toFront') }}
      </UiButton>
      <UiButton variant="secondary" size="sm" @click="api.sendToBack">
        {{ t('imageControls.toBack') }}
      </UiButton>
      <UiButton variant="secondary" size="sm" @click="api.bringForward">
        {{ t('imageControls.forward') }}
      </UiButton>
      <UiButton variant="secondary" size="sm" @click="api.sendBackward">
        {{ t('imageControls.backward') }}
      </UiButton>
    </div>
  </div>
</template>
