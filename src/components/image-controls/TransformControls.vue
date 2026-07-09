<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props

  // Klappbare Untersektion – standardmäßig eingeklappt
  const expanded = ref(false)
</script>

<template>
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <!-- Klapp-Kopfzeile -->
    <button
      class="flex items-center justify-between w-full text-left"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="text-sm font-medium">{{ t('imageControls.transform') }}</span>
      <svg
        class="w-4 h-4 text-muted transition-transform"
        :class="{ 'rotate-180': expanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="expanded" class="space-y-3 mt-3">
      <!-- Spiegelung (kompakte Icon-Buttons) -->
      <div class="grid grid-cols-2 gap-2">
        <button
          :class="[
            'flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md font-medium transition-colors',
            image.flipHorizontal
              ? 'bg-accent hover:bg-accent-dark text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
          ]"
          :title="t('imageControls.flipHorizontal')"
          :aria-label="t('imageControls.flipHorizontal')"
          :aria-pressed="image.flipHorizontal"
          @click="api.toggleFlipHorizontal"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
            <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
            <path d="M4 12H2M10 12H8M16 12h-2M22 12h-2" />
          </svg>
          {{ t('imageControls.flipHorizontalShort') }}
        </button>

        <button
          :class="[
            'flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md font-medium transition-colors',
            image.flipVertical
              ? 'bg-accent hover:bg-accent-dark text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
          ]"
          :title="t('imageControls.flipVertical')"
          :aria-label="t('imageControls.flipVertical')"
          :aria-pressed="image.flipVertical"
          @click="api.toggleFlipVertical"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
            <path d="M12 20v2M12 14v2M12 8v2M12 2v2" />
          </svg>
          {{ t('imageControls.flipVerticalShort') }}
        </button>
      </div>

      <!-- Neigung horizontal -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.skewHorizontal')"
        :display-value="`${Math.round(image.skewX ?? 0)}°`"
        :value="image.skewX ?? 0"
        :min="-60"
        :max="60"
        :show-reset="(image.skewX ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateSkewX"
        @reset="api.applyToSelected({ skewX: 0 })"
      />

      <!-- Neigung vertikal -->
      <ControlSlider
        label-size="xs"
        :label="t('imageControls.skewVertical')"
        :display-value="`${Math.round(image.skewY ?? 0)}°`"
        :value="image.skewY ?? 0"
        :min="-60"
        :max="60"
        :show-reset="(image.skewY ?? 0) !== 0"
        :reset-title="t('imageControls.resetValue')"
        @input="api.updateSkewY"
        @reset="api.applyToSelected({ skewY: 0 })"
      />
    </div>
  </div>
</template>
