<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'
  import ControlColorInput from './ControlColorInput.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ t('imageControls.shadow') }}</span>
      <UiButton
        size="sm"
        :variant="image.shadowEnabled ? 'primary' : 'secondary'"
        :aria-pressed="image.shadowEnabled"
        @click="api.toggleShadow"
      >
        {{ image.shadowEnabled ? t('canvas.on') : t('canvas.off') }}
      </UiButton>
    </div>

    <div v-if="image.shadowEnabled" class="space-y-3">
      <!-- Schatten Versatz X -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.shadowOffsetX')"
        :display-value="`${image.shadowOffsetX}px`"
        :value="image.shadowOffsetX"
        :min="-50"
        :max="50"
        :show-reset="image.shadowOffsetX !== 5"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateShadowOffsetX"
        @reset="api.applyToSelected({ shadowOffsetX: 5 })"
      />

      <!-- Schatten Versatz Y -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.shadowOffsetY')"
        :display-value="`${image.shadowOffsetY}px`"
        :value="image.shadowOffsetY"
        :min="-50"
        :max="50"
        :show-reset="image.shadowOffsetY !== 5"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateShadowOffsetY"
        @reset="api.applyToSelected({ shadowOffsetY: 5 })"
      />

      <!-- Schatten Weichzeichnung -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.shadowBlur')"
        :display-value="`${image.shadowBlur}px`"
        :value="image.shadowBlur"
        :min="0"
        :max="50"
        :show-reset="image.shadowBlur !== 10"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateShadowBlur"
        @reset="api.applyToSelected({ shadowBlur: 10 })"
      />

      <!-- Schatten Farbe -->
      <ControlColorInput
        :label="t('imageControls.shadowColor')"
        :value="image.shadowColor"
        @input="api.updateShadowColor"
      />
    </div>
  </div>
</template>
