<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { BackgroundImageFit } from '@/types'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Background Image -->
  <div
    v-if="collage.settings.backgroundImage.url"
    class="border-t border-muted/30 dark:border-slate/30 pt-4"
  >
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium">
        {{ t('canvas.backgroundImage') }}
      </label>
      <span
        v-if="collage.isBackgroundSelected"
        class="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full"
      >
        {{ t('canvas.selected') }}
      </span>
    </div>

    <!-- Preview -->
    <div
      class="relative mb-3 cursor-pointer"
      :class="{ 'ring-2 ring-primary ring-offset-2 rounded-lg': collage.isBackgroundSelected }"
      @click="collage.selectBackground(true)"
    >
      <img
        :src="collage.settings.backgroundImage.url"
        :alt="t('canvas.backgroundImage')"
        class="w-full h-24 object-cover rounded-lg border border-muted/30 dark:border-slate/30"
      />
      <button
        class="absolute top-1 right-1 p-1 bg-warm hover:bg-warm-dark text-surface-light rounded-full transition-colors"
        :title="t('canvas.removeBackgroundImage')"
        @click.stop="api.removeBackground"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Fit Mode -->
    <div class="mb-3">
      <label class="block text-xs font-medium mb-1.5 text-muted">
        {{ t('canvas.backgroundFit') }}
      </label>
      <select
        :value="collage.settings.backgroundImage.fit"
        class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
        @change="
          api.updateBackgroundFit(($event.target as HTMLSelectElement).value as BackgroundImageFit)
        "
      >
        <option value="cover">{{ t('canvas.fitCover') }}</option>
        <option value="contain">{{ t('canvas.fitContain') }}</option>
        <option value="stretch">{{ t('canvas.fitStretch') }}</option>
        <option value="tile">{{ t('canvas.fitTile') }}</option>
      </select>
    </div>

    <!-- Editing Controls (show when background is selected) -->
    <div
      v-if="collage.isBackgroundSelected"
      class="space-y-3 bg-muted/10 dark:bg-navy/20 rounded-lg p-3"
    >
      <p class="text-xs font-medium text-primary mb-2">{{ t('canvas.editBackground') }}</p>

      <!-- Opacity -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-medium text-muted">
            {{ t('imageControls.opacity') }}:
            {{ Math.round(collage.settings.backgroundImage.opacity * 100) }}%
          </label>
          <button
            v-if="collage.settings.backgroundImage.opacity !== 1"
            class="text-xs text-accent hover:text-accent-dark transition-colors"
            :title="t('imageControls.resetValue')"
            @click="api.updateBackgroundOpacity(1)"
          >
            ↺
          </button>
        </div>
        <input
          type="range"
          :value="collage.settings.backgroundImage.opacity"
          min="0"
          max="1"
          step="0.01"
          class="w-full accent-accent"
          @input="api.updateBackgroundOpacity(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Brightness -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-medium text-muted">
            {{ t('imageControls.brightness') }}: {{ collage.settings.backgroundImage.brightness }}%
          </label>
          <button
            v-if="collage.settings.backgroundImage.brightness !== 100"
            class="text-xs text-accent hover:text-accent-dark transition-colors"
            :title="t('imageControls.resetValue')"
            @click="api.updateBackgroundBrightness(100)"
          >
            ↺
          </button>
        </div>
        <input
          type="range"
          :value="collage.settings.backgroundImage.brightness"
          min="0"
          max="200"
          step="1"
          class="w-full accent-accent"
          @input="api.updateBackgroundBrightness(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Contrast -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-medium text-muted">
            {{ t('imageControls.contrast') }}: {{ collage.settings.backgroundImage.contrast }}%
          </label>
          <button
            v-if="collage.settings.backgroundImage.contrast !== 100"
            class="text-xs text-accent hover:text-accent-dark transition-colors"
            :title="t('imageControls.resetValue')"
            @click="api.updateBackgroundContrast(100)"
          >
            ↺
          </button>
        </div>
        <input
          type="range"
          :value="collage.settings.backgroundImage.contrast"
          min="0"
          max="200"
          step="1"
          class="w-full accent-accent"
          @input="api.updateBackgroundContrast(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Saturation -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-medium text-muted">
            {{ t('imageControls.saturation') }}: {{ collage.settings.backgroundImage.saturation }}%
          </label>
          <button
            v-if="collage.settings.backgroundImage.saturation !== 100"
            class="text-xs text-accent hover:text-accent-dark transition-colors"
            :title="t('imageControls.resetValue')"
            @click="api.updateBackgroundSaturation(100)"
          >
            ↺
          </button>
        </div>
        <input
          type="range"
          :value="collage.settings.backgroundImage.saturation"
          min="0"
          max="200"
          step="1"
          class="w-full accent-accent"
          @input="api.updateBackgroundSaturation(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Blur -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-medium text-muted">
            {{ t('canvas.blur') }}: {{ collage.settings.backgroundImage.blur }}px
          </label>
          <button
            v-if="collage.settings.backgroundImage.blur !== 0"
            class="text-xs text-accent hover:text-accent-dark transition-colors"
            :title="t('imageControls.resetValue')"
            @click="api.updateBackgroundBlur(0)"
          >
            ↺
          </button>
        </div>
        <input
          type="range"
          :value="collage.settings.backgroundImage.blur"
          min="0"
          max="20"
          step="0.5"
          class="w-full accent-accent"
          @input="api.updateBackgroundBlur(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <p class="text-xs text-muted mt-2">
      {{ t('canvas.backgroundFitHint') }}
    </p>
  </div>
</template>
