<script setup lang="ts">
  /** Textschatten: Schalter, Versatz, Unschärfe und Farbe. */
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { ColorField, UiSwitch } from '@/components/ui'
  import type { CollageText } from '@/types'
  import type { TextControlsApi } from '@/composables/useTextControls'

  const props = defineProps<{ text: CollageText; api: TextControlsApi }>()
  const { t } = useI18n()
  const {
    toggleShadow,
    updateShadowOffsetX,
    updateShadowOffsetY,
    updateShadowBlur,
    updateShadowColor,
  } = props.api
</script>

<template>
  <!-- Shadow Controls -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ t('text.shadow') }}</span>
      <UiSwitch
        :model-value="text.shadowEnabled"
        :label="t('text.shadow')"
        label-hidden
        @update:model-value="toggleShadow()"
      />
    </div>

    <div v-if="text.shadowEnabled" class="space-y-3">
      <ControlSlider
        label-size="xs"
        :label="t('text.shadowOffsetX')"
        :display-value="`${text.shadowOffsetX}px`"
        :value="text.shadowOffsetX"
        :min="-20"
        :max="20"
        :step="1"
        :show-reset="text.shadowOffsetX !== 2"
        :reset-title="t('imageControls.resetValue')"
        @input="updateShadowOffsetX"
        @reset="updateShadowOffsetX(2)"
      />
      <ControlSlider
        label-size="xs"
        :label="t('text.shadowOffsetY')"
        :display-value="`${text.shadowOffsetY}px`"
        :value="text.shadowOffsetY"
        :min="-20"
        :max="20"
        :step="1"
        :show-reset="text.shadowOffsetY !== 2"
        :reset-title="t('imageControls.resetValue')"
        @input="updateShadowOffsetY"
        @reset="updateShadowOffsetY(2)"
      />
      <ControlSlider
        label-size="xs"
        :label="t('text.shadowBlur')"
        :display-value="`${text.shadowBlur}px`"
        :value="text.shadowBlur"
        :min="0"
        :max="30"
        :step="1"
        :show-reset="text.shadowBlur !== 4"
        :reset-title="t('imageControls.resetValue')"
        @input="updateShadowBlur"
        @reset="updateShadowBlur(4)"
      />

      <!-- Shadow Color -->
      <div>
        <label for="text-shadow-color" class="block text-xs text-ink-2 mb-1">
          {{ t('text.shadowColor') }}
        </label>
        <div class="flex gap-2">
          <ColorField
            id="text-shadow-color"
            teleport-to="#modal-portal"
            :model-value="text.shadowColor"
            :label="t('text.shadowColor')"
            class="!w-12 !h-7 rounded-sm"
            @update:model-value="updateShadowColor"
          />
          <input
            type="text"
            :value="text.shadowColor"
            placeholder="#000000"
            :aria-label="t('text.shadowColor')"
            class="flex-1 px-2 py-1 border border-line-strong rounded-sm bg-surface-1 text-xs font-mono focus-visible:outline-none focus-visible:shadow-focus"
            @input="updateShadowColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
