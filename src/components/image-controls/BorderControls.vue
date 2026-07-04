<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'
  import ControlColorInput from './ControlColorInput.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <div class="flex items-center justify-between mb-3">
      <label class="text-sm font-medium">{{ t('imageControls.border') }}</label>
      <button
        :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          image.borderEnabled
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        @click="api.toggleBorder"
      >
        {{
          image.borderEnabled ? t('imageControls.borderEnabled') : t('imageControls.borderDisabled')
        }}
      </button>
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
      <div>
        <label class="block text-xs text-muted mb-1">
          {{ t('imageControls.borderStyle') }}
        </label>
        <select
          :value="image.borderStyle"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
          @change="api.updateBorderStyle(($event.target as HTMLSelectElement).value as any)"
        >
          <option value="solid">{{ t('imageControls.borderStyleSolid') }}</option>
          <option value="dashed">{{ t('imageControls.borderStyleDashed') }}</option>
          <option value="dotted">{{ t('imageControls.borderStyleDotted') }}</option>
          <option value="double">{{ t('imageControls.borderStyleDouble') }}</option>
        </select>
      </div>

      <!-- Rahmenfarbe -->
      <ControlColorInput
        :label="t('imageControls.borderColor')"
        :value="image.borderColor"
        @input="api.updateBorderColor"
      />

      <!-- Rahmenschatten -->
      <div class="border-t border-muted/50 dark:border-slate pt-3 mt-3">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs text-muted">{{ t('imageControls.borderShadow') }}</label>
          <button
            :class="[
              'px-2 py-1 text-xs rounded transition-colors',
              image.borderShadowEnabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
            ]"
            @click="api.toggleBorderShadow"
          >
            {{
              image.borderShadowEnabled
                ? t('imageControls.borderShadowEnabled')
                : t('imageControls.borderShadowDisabled')
            }}
          </button>
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
