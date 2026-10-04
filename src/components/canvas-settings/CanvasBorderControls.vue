<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'
  import type { CanvasBorderSettings } from '@/types'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Canvas-Rahmen -->
  <div class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-3">
      <label class="text-sm font-medium">{{ t('canvas.border') }}</label>
      <button
        :class="[
          'px-3 py-1 text-xs rounded-sm transition-colors',
          collage.settings.border.enabled
            ? 'bg-accent hover:bg-accent-hover text-on-accent'
            : 'bg-surface-2 hover:bg-surface-3 text-ink',
        ]"
        :aria-pressed="collage.settings.border.enabled"
        @click="api.toggleCanvasBorder"
      >
        {{ collage.settings.border.enabled ? t('canvas.on') : t('canvas.off') }}
      </button>
    </div>

    <div v-if="collage.settings.border.enabled" class="space-y-3">
      <!-- Rahmenbreite -->
      <div>
        <label class="block text-xs text-ink-2 mb-1">
          {{ t('imageControls.borderWidth') }}: {{ collage.settings.border.width }}px
        </label>
        <input
          type="range"
          :value="collage.settings.border.width"
          min="1"
          max="100"
          step="1"
          class="w-full"
          @input="api.updateBorderWidth(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Rahmenstil -->
      <div>
        <label class="block text-xs text-ink-2 mb-1">{{ t('imageControls.borderStyle') }}</label>
        <select
          :value="collage.settings.border.style"
          class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm"
          @change="
            api.updateBorderStyle(
              ($event.target as HTMLSelectElement).value as CanvasBorderSettings['style']
            )
          "
        >
          <option value="solid">{{ t('imageControls.borderStyleSolid') }}</option>
          <option value="dashed">{{ t('imageControls.borderStyleDashed') }}</option>
          <option value="dotted">{{ t('imageControls.borderStyleDotted') }}</option>
          <option value="double">{{ t('imageControls.borderStyleDouble') }}</option>
        </select>
      </div>

      <!-- Rahmenfarbe -->
      <div>
        <label class="block text-xs text-ink-2 mb-1">{{ t('imageControls.borderColor') }}</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="collage.settings.border.color"
            class="w-12 h-10 rounded-sm border border-line-strong cursor-pointer"
            @input="api.updateBorderColor(($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            :value="collage.settings.border.color"
            class="flex-1 px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm font-mono"
            @input="api.updateBorderColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
