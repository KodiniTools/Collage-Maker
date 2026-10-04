<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import ResetButton from '@/components/ResetButton.vue'
  import { computed } from 'vue'
  import { UiIconButton, UiSelect } from '@/components/ui'
  import type { BackgroundImageFit } from '@/types'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api

  const fitOptions = computed(() => [
    { value: 'cover', label: t('canvas.fitCover') },
    { value: 'contain', label: t('canvas.fitContain') },
    { value: 'stretch', label: t('canvas.fitStretch') },
    { value: 'tile', label: t('canvas.fitTile') },
  ])
</script>

<template>
  <!-- Background Image -->
  <div v-if="collage.settings.backgroundImage.url" class="border-t border-line pt-4">
    <div class="flex items-center justify-between mb-2">
      <span class="block text-sm font-medium">
        {{ t('canvas.backgroundImage') }}
      </span>
      <span
        v-if="collage.isBackgroundSelected"
        class="text-xs px-2 py-0.5 bg-accent-soft text-ink rounded-full"
      >
        {{ t('canvas.selected') }}
      </span>
    </div>

    <!-- Preview -->
    <div
      class="relative mb-3 cursor-pointer rounded-md"
      :class="{
        'ring-2 ring-accent ring-offset-2 ring-offset-surface-1': collage.isBackgroundSelected,
      }"
      @click="collage.selectBackground(true)"
    >
      <img
        :src="collage.settings.backgroundImage.url"
        :alt="t('canvas.backgroundImage')"
        class="w-full h-24 object-cover rounded-md border border-line"
      />
      <UiIconButton
        :label="t('canvas.removeBackgroundImage')"
        variant="secondary"
        size="sm"
        round
        class="absolute top-1 right-1"
        @click.stop="api.removeBackground"
      >
        <svg
          class="text-danger"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </UiIconButton>
    </div>

    <!-- Fit Mode -->
    <div class="mb-3">
      <UiSelect
        :model-value="collage.settings.backgroundImage.fit"
        :options="fitOptions"
        :label="t('canvas.backgroundFit')"
        size="sm"
        @update:model-value="(v) => api.updateBackgroundFit(v as BackgroundImageFit)"
      />
    </div>

    <!-- Editing Controls (show when background is selected) -->
    <div v-if="collage.isBackgroundSelected" class="space-y-3 bg-surface-2 rounded-md p-3">
      <p class="text-xs font-medium text-ink mb-2">
        {{ t('canvas.editBackground') }}
      </p>

      <!-- Opacity -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="bg-opacity" class="text-xs font-medium text-ink-2">
            {{ t('imageControls.opacity') }}:
            {{ Math.round(collage.settings.backgroundImage.opacity * 100) }}%
          </label>
          <ResetButton
            v-if="collage.settings.backgroundImage.opacity !== 1"
            :label="t('imageControls.resetValue')"
            @click="api.updateBackgroundOpacity(1)"
          />
        </div>
        <input
          id="bg-opacity"
          type="range"
          :value="collage.settings.backgroundImage.opacity"
          min="0"
          max="1"
          step="0.01"
          class="w-full"
          @input="api.updateBackgroundOpacity(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Brightness -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="bg-brightness" class="text-xs font-medium text-ink-2">
            {{ t('imageControls.brightness') }}: {{ collage.settings.backgroundImage.brightness }}%
          </label>
          <ResetButton
            v-if="collage.settings.backgroundImage.brightness !== 100"
            :label="t('imageControls.resetValue')"
            @click="api.updateBackgroundBrightness(100)"
          />
        </div>
        <input
          id="bg-brightness"
          type="range"
          :value="collage.settings.backgroundImage.brightness"
          min="0"
          max="200"
          step="1"
          class="w-full"
          @input="api.updateBackgroundBrightness(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Contrast -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="bg-contrast" class="text-xs font-medium text-ink-2">
            {{ t('imageControls.contrast') }}: {{ collage.settings.backgroundImage.contrast }}%
          </label>
          <ResetButton
            v-if="collage.settings.backgroundImage.contrast !== 100"
            :label="t('imageControls.resetValue')"
            @click="api.updateBackgroundContrast(100)"
          />
        </div>
        <input
          id="bg-contrast"
          type="range"
          :value="collage.settings.backgroundImage.contrast"
          min="0"
          max="200"
          step="1"
          class="w-full"
          @input="api.updateBackgroundContrast(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Saturation -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="bg-saturation" class="text-xs font-medium text-ink-2">
            {{ t('imageControls.saturation') }}: {{ collage.settings.backgroundImage.saturation }}%
          </label>
          <ResetButton
            v-if="collage.settings.backgroundImage.saturation !== 100"
            :label="t('imageControls.resetValue')"
            @click="api.updateBackgroundSaturation(100)"
          />
        </div>
        <input
          id="bg-saturation"
          type="range"
          :value="collage.settings.backgroundImage.saturation"
          min="0"
          max="200"
          step="1"
          class="w-full"
          @input="api.updateBackgroundSaturation(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Blur -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="bg-blur" class="text-xs font-medium text-ink-2">
            {{ t('canvas.blur') }}: {{ collage.settings.backgroundImage.blur }}px
          </label>
          <ResetButton
            v-if="collage.settings.backgroundImage.blur !== 0"
            :label="t('imageControls.resetValue')"
            @click="api.updateBackgroundBlur(0)"
          />
        </div>
        <input
          id="bg-blur"
          type="range"
          :value="collage.settings.backgroundImage.blur"
          min="0"
          max="20"
          step="0.5"
          class="w-full"
          @input="api.updateBackgroundBlur(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <p class="text-xs text-ink-2 mt-2">
      {{ t('canvas.backgroundFitHint') }}
    </p>
  </div>
</template>
