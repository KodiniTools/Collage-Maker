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
      <!-- Spiegelung -->
      <button
        :class="[
          'w-full px-3 py-2 text-sm rounded-md font-medium transition-colors',
          image.flipHorizontal
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        :aria-pressed="image.flipHorizontal"
        @click="api.toggleFlipHorizontal"
      >
        {{ t('imageControls.flipHorizontal') }}
      </button>

      <button
        :class="[
          'w-full px-3 py-2 text-sm rounded-md font-medium transition-colors',
          image.flipVertical
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        :aria-pressed="image.flipVertical"
        @click="api.toggleFlipVertical"
      >
        {{ t('imageControls.flipVertical') }}
      </button>

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
