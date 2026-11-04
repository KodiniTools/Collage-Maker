<script setup lang="ts">
  /** Textkontur: Schalter, Breite und Farbe. */
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { ColorField, UiSwitch } from '@/components/ui'
  import type { CollageText } from '@/types'
  import type { TextControlsApi } from '@/composables/useTextControls'

  const props = defineProps<{ text: CollageText; api: TextControlsApi }>()
  const { t } = useI18n()
  const { toggleStroke, updateStrokeWidth, updateStrokeColor } = props.api
</script>

<template>
  <!-- Stroke (Textumrandung) Controls -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ t('text.stroke') }}</span>
      <UiSwitch
        :model-value="text.strokeEnabled"
        :label="t('text.stroke')"
        label-hidden
        @update:model-value="toggleStroke()"
      />
    </div>

    <div v-if="text.strokeEnabled" class="space-y-3">
      <ControlSlider
        label-size="xs"
        :label="t('text.strokeWidth')"
        :display-value="`${text.strokeWidth}px`"
        :value="text.strokeWidth"
        :min="1"
        :max="10"
        :step="1"
        :show-reset="text.strokeWidth !== 2"
        :reset-title="t('imageControls.resetValue')"
        @input="updateStrokeWidth"
        @reset="updateStrokeWidth(2)"
      />

      <!-- Stroke Color -->
      <div>
        <label for="text-stroke-color" class="block text-xs text-ink-2 mb-1">
          {{ t('text.strokeColor') }}
        </label>
        <div class="flex gap-2">
          <ColorField
            id="text-stroke-color"
            teleport-to="#modal-portal"
            :model-value="text.strokeColor"
            :label="t('text.strokeColor')"
            class="!w-12 !h-7 rounded-sm"
            @update:model-value="updateStrokeColor"
          />
          <input
            type="text"
            :value="text.strokeColor"
            placeholder="#ffffff"
            :aria-label="t('text.strokeColor')"
            class="flex-1 px-2 py-1 border border-line-strong rounded-sm bg-surface-1 text-xs font-mono focus-visible:outline-none focus-visible:shadow-focus"
            @input="updateStrokeColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
