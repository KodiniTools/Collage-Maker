<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { computed } from 'vue'
  import { UiButton, UiSelect } from '@/components/ui'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'
  import ControlColorInput from './ControlColorInput.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props

  const borderStyleOptions = computed(() => [
    { value: 'solid', label: t('imageControls.borderStyleSolid') },
    { value: 'dashed', label: t('imageControls.borderStyleDashed') },
    { value: 'dotted', label: t('imageControls.borderStyleDotted') },
    { value: 'double', label: t('imageControls.borderStyleDouble') },
  ])
</script>

<template>
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ t('imageControls.border') }}</span>
      <UiButton
        size="sm"
        :variant="image.borderEnabled ? 'primary' : 'secondary'"
        :aria-pressed="image.borderEnabled"
        @click="api.toggleBorder"
      >
        {{
          image.borderEnabled ? t('imageControls.borderEnabled') : t('imageControls.borderDisabled')
        }}
      </UiButton>
    </div>

    <div v-if="image.borderEnabled" class="space-y-3">
      <!-- Rahmenbreite -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.borderWidth')"
        :display-value="`${image.borderWidth}px`"
        :value="image.borderWidth"
        :min="1"
        :max="20"
        :show-reset="image.borderWidth !== 4"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateBorderWidth"
        @reset="api.applyToSelected({ borderWidth: 4 })"
      />

      <!-- Rahmenstil -->
      <UiSelect
        :model-value="image.borderStyle"
        :options="borderStyleOptions"
        :label="t('imageControls.borderStyle')"
        size="sm"
        @update:model-value="(v) => api.updateBorderStyle(v as CollageImage['borderStyle'])"
      />

      <!-- Rahmenfarbe -->
      <ControlColorInput
        :label="t('imageControls.borderColor')"
        :value="image.borderColor"
        @input="api.updateBorderColor"
      />

      <!-- Rahmenschatten -->
      <div class="border-t border-line-strong pt-3 mt-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-ink-2">{{ t('imageControls.borderShadow') }}</span>
          <UiButton
            size="sm"
            :variant="image.borderShadowEnabled ? 'primary' : 'secondary'"
            :aria-pressed="image.borderShadowEnabled"
            @click="api.toggleBorderShadow"
          >
            {{
              image.borderShadowEnabled
                ? t('imageControls.borderShadowEnabled')
                : t('imageControls.borderShadowDisabled')
            }}
          </UiButton>
        </div>

        <div v-if="image.borderShadowEnabled" class="space-y-2">
          <!-- Rahmenschatten Versatz X -->
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.borderShadowOffsetX')"
            :display-value="`${image.borderShadowOffsetX}px`"
            :value="image.borderShadowOffsetX"
            :min="-20"
            :max="20"
            :show-reset="image.borderShadowOffsetX !== 3"
            :reset-title="t('imageControls.resetValue')"
            @input="api.updateBorderShadowOffsetX"
            @reset="api.applyToSelected({ borderShadowOffsetX: 3 })"
          />

          <!-- Rahmenschatten Versatz Y -->
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.borderShadowOffsetY')"
            :display-value="`${image.borderShadowOffsetY}px`"
            :value="image.borderShadowOffsetY"
            :min="-20"
            :max="20"
            :show-reset="image.borderShadowOffsetY !== 3"
            :reset-title="t('imageControls.resetValue')"
            @input="api.updateBorderShadowOffsetY"
            @reset="api.applyToSelected({ borderShadowOffsetY: 3 })"
          />

          <!-- Rahmenschatten Weichzeichnung -->
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.borderShadowBlur')"
            :display-value="`${image.borderShadowBlur}px`"
            :value="image.borderShadowBlur"
            :min="0"
            :max="30"
            :show-reset="image.borderShadowBlur !== 6"
            :reset-title="t('imageControls.resetValue')"
            @input="api.updateBorderShadowBlur"
            @reset="api.applyToSelected({ borderShadowBlur: 6 })"
          />

          <!-- Rahmenschatten Farbe -->
          <ControlColorInput
            variant="sm"
            :label="t('imageControls.borderShadowColor')"
            :value="image.borderShadowColor"
            @input="api.updateBorderShadowColor"
          />
        </div>
      </div>
    </div>
  </div>
</template>
