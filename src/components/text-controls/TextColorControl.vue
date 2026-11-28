<script setup lang="ts">
  /** Textfarbe (ColorField und Hex-Feld) und Deckkraft. */
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { ColorField } from '@/components/ui'
  import type { CollageText } from '@/types'
  import type { TextControlsApi } from '@/composables/useTextControls'

  const props = defineProps<{ text: CollageText; api: TextControlsApi }>()
  const { t } = useI18n()
  const { updateColor, updateOpacity } = props.api
  const opacityPercent = computed(() => Math.round((props.text.opacity ?? 1) * 100))
</script>

<template>
  <div class="space-y-4">
    <!-- Text Color -->
    <div>
      <label for="text-color" class="block text-sm font-medium mb-2">{{ t('text.color') }}</label>
      <div class="flex gap-2">
        <ColorField
          id="text-color"
          teleport-to="#modal-portal"
          :model-value="text.color"
          :label="t('text.color')"
          class="!w-16 !h-9 rounded-sm"
          @update:model-value="updateColor"
        />
        <input
          type="text"
          :value="text.color"
          placeholder="#000000"
          :aria-label="t('text.color')"
          class="flex-1 px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm font-mono focus-visible:outline-none focus-visible:shadow-focus"
          @input="updateColor(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Deckkraft: Regler mit Zahlen-Spinner (0–100 %) -->
    <ControlSlider
      :label="t('text.opacity')"
      :display-value="`${opacityPercent}%`"
      :value="opacityPercent"
      :min="0"
      :max="100"
      :step="1"
      :show-reset="opacityPercent !== 100"
      :reset-title="t('imageControls.resetValue')"
      @input="updateOpacity"
      @reset="updateOpacity(100)"
    />
  </div>
</template>
