<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { computed } from 'vue'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { UiSelect, UiSwitch } from '@/components/ui'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'
  import type { CanvasBorderSettings } from '@/types'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api

  const borderStyleOptions = computed(() => [
    { value: 'solid', label: t('imageControls.borderStyleSolid') },
    { value: 'dashed', label: t('imageControls.borderStyleDashed') },
    { value: 'dotted', label: t('imageControls.borderStyleDotted') },
    { value: 'double', label: t('imageControls.borderStyleDouble') },
  ])
</script>

<template>
  <!-- Canvas-Rahmen -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ t('canvas.border') }}</span>
      <UiSwitch
        :model-value="collage.settings.border.enabled"
        :label="t('canvas.border')"
        label-hidden
        @update:model-value="api.toggleCanvasBorder()"
      />
    </div>

    <div v-if="collage.settings.border.enabled" class="space-y-3">
      <!-- Rahmenbreite -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.borderWidth')"
        :display-value="`${collage.settings.border.width}px`"
        :value="collage.settings.border.width"
        :min="1"
        :max="100"
        :step="1"
        @input="api.updateBorderWidth"
      />

      <!-- Rahmenstil -->
      <UiSelect
        :model-value="collage.settings.border.style"
        :options="borderStyleOptions"
        :label="t('imageControls.borderStyle')"
        size="sm"
        @update:model-value="(v) => api.updateBorderStyle(v as CanvasBorderSettings['style'])"
      />

      <!-- Rahmenfarbe -->
      <div>
        <label for="canvas-border-color" class="block text-xs text-ink-2 mb-1">
          {{ t('imageControls.borderColor') }}
        </label>
        <div class="flex gap-2">
          <input
            id="canvas-border-color"
            type="color"
            :value="collage.settings.border.color"
            class="w-12 h-9 rounded-sm border border-line-strong cursor-pointer"
            @input="api.updateBorderColor(($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            :value="collage.settings.border.color"
            :aria-label="t('imageControls.borderColor')"
            class="flex-1 px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm font-mono focus-visible:outline-none focus-visible:shadow-focus"
            @input="api.updateBorderColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
