<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'
  import ControlSlider from './ControlSlider.vue'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props

  // Klappbare Untersektion – standardmäßig eingeklappt
  const expanded = ref(false)

  // Seitenverhältnis-Presets für den Zuschnitt (Breite : Höhe)
  const cropPresets: { label: string; ratio: number }[] = [
    { label: '1:1', ratio: 1 },
    { label: '4:3', ratio: 4 / 3 },
    { label: '3:2', ratio: 3 / 2 },
    { label: '16:9', ratio: 16 / 9 },
    { label: '3:4', ratio: 3 / 4 },
    { label: '2:3', ratio: 2 / 3 },
    { label: '9:16', ratio: 9 / 16 },
  ]

  // Insets in Prozent (0..90) für die freien Zuschnitt-Slider
  const pct = (v: number) => Math.round(v * 100)
</script>

<template>
  <div class="border-t border-line pt-4">
    <!-- Klapp-Kopfzeile -->
    <button
      type="button"
      class="flex items-center justify-between w-full text-left rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="text-sm font-medium">{{ t('imageControls.transform') }}</span>
      <svg
        class="w-4 h-4 text-ink-2 transition-transform"
        :class="{ 'rotate-180': expanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.75"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="expanded" class="space-y-3 mt-3">
      <!-- Spiegelung -->
      <div class="grid grid-cols-2 gap-2">
        <UiButton
          size="sm"
          :variant="image.flipHorizontal ? 'primary' : 'secondary'"
          :title="t('imageControls.flipHorizontal')"
          :aria-pressed="image.flipHorizontal"
          @click="api.toggleFlipHorizontal"
        >
          <template #icon>
            <svg
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
              <path d="M4 12H2M10 12H8M16 12h-2M22 12h-2" />
            </svg>
          </template>
          {{ t('imageControls.flipHorizontalShort') }}
        </UiButton>

        <UiButton
          size="sm"
          :variant="image.flipVertical ? 'primary' : 'secondary'"
          :title="t('imageControls.flipVertical')"
          :aria-pressed="image.flipVertical"
          @click="api.toggleFlipVertical"
        >
          <template #icon>
            <svg
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
              <path d="M12 20v2M12 14v2M12 8v2M12 2v2" />
            </svg>
          </template>
          {{ t('imageControls.flipVerticalShort') }}
        </UiButton>
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

      <!-- Freies Verzerren (Distort): Eckpunkte einzeln ziehen -->
      <div class="border-t border-line pt-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-ink-2">{{ t('imageControls.distort') }}</span>
          <UiButton
            size="sm"
            :variant="image.distortEnabled ? 'primary' : 'secondary'"
            :title="t('imageControls.distortHint')"
            :aria-pressed="!!image.distortEnabled"
            @click="api.toggleDistort"
          >
            {{
              image.distortEnabled ? t('imageControls.distortOn') : t('imageControls.distortOff')
            }}
          </UiButton>
        </div>
        <div v-if="image.distortEnabled" class="grid grid-cols-2 gap-1.5 mt-2">
          <UiButton
            variant="secondary"
            size="sm"
            :disabled="!image.cornerOffsets || api.isApplyingDistort.value"
            :title="t('imageControls.distortReset')"
            @click="api.resetDistort"
          >
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </template>
            {{ t('imageControls.distortResetShort') }}
          </UiButton>
          <UiButton
            variant="primary"
            size="sm"
            :disabled="!api.canApplyDistort.value || api.isApplyingDistort.value"
            :aria-busy="api.isApplyingDistort.value"
            :title="t('imageControls.distortApplyHint')"
            @click="api.applyDistort"
          >
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </template>
            {{ t('imageControls.distortApply') }}
          </UiButton>
        </div>
      </div>

      <!-- Zuschneiden (Crop): Presets & freies Zuschneiden -->
      <div class="border-t border-line pt-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-ink-2">{{ t('imageControls.crop') }}</span>
          <UiButton
            v-if="api.isCropped.value"
            variant="ghost"
            size="sm"
            :title="t('imageControls.cropReset')"
            @click="api.resetCrop"
          >
            <template #icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </template>
            {{ t('imageControls.cropFree') }}
          </UiButton>
        </div>

        <!-- Seitenverhältnis-Presets -->
        <div class="grid grid-cols-4 gap-1.5">
          <UiButton
            v-for="preset in cropPresets"
            :key="preset.label"
            variant="secondary"
            size="sm"
            :title="t('imageControls.cropPresetHint', { ratio: preset.label })"
            @click="api.applyCropPreset(preset.ratio)"
          >
            {{ preset.label }}
          </UiButton>
        </div>

        <!-- Freies Zuschneiden über die vier Ränder -->
        <div class="space-y-2 mt-3">
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.cropTop')"
            :display-value="`${pct(api.cropInsets.value.top)}%`"
            :value="pct(api.cropInsets.value.top)"
            :min="0"
            :max="90"
            :show-reset="api.cropInsets.value.top > 0"
            :reset-title="t('imageControls.resetValue')"
            @input="(v) => api.updateCropInset('top', v / 100)"
            @reset="api.updateCropInset('top', 0)"
          />
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.cropBottom')"
            :display-value="`${pct(api.cropInsets.value.bottom)}%`"
            :value="pct(api.cropInsets.value.bottom)"
            :min="0"
            :max="90"
            :show-reset="api.cropInsets.value.bottom > 0"
            :reset-title="t('imageControls.resetValue')"
            @input="(v) => api.updateCropInset('bottom', v / 100)"
            @reset="api.updateCropInset('bottom', 0)"
          />
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.cropLeft')"
            :display-value="`${pct(api.cropInsets.value.left)}%`"
            :value="pct(api.cropInsets.value.left)"
            :min="0"
            :max="90"
            :show-reset="api.cropInsets.value.left > 0"
            :reset-title="t('imageControls.resetValue')"
            @input="(v) => api.updateCropInset('left', v / 100)"
            @reset="api.updateCropInset('left', 0)"
          />
          <ControlSlider
            label-size="xs"
            :label="t('imageControls.cropRight')"
            :display-value="`${pct(api.cropInsets.value.right)}%`"
            :value="pct(api.cropInsets.value.right)"
            :min="0"
            :max="90"
            :show-reset="api.cropInsets.value.right > 0"
            :reset-title="t('imageControls.resetValue')"
            @input="(v) => api.updateCropInset('right', v / 100)"
            @reset="api.updateCropInset('right', 0)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
