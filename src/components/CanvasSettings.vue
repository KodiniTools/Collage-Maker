<script setup lang="ts">
  import { ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import type { BackgroundImageFit } from '@/types'

  const collage = useCollageStore()
  const { t } = useI18n()

  // Standard-Canvasgröße (für die Reset-Buttons)
  const DEFAULT_WIDTH = 700
  const DEFAULT_HEIGHT = 740
  // Grenzen der Größen-Regler / -Eingaben
  const MIN_SIZE = 400
  const MAX_SIZE = 4000

  // Seitenverhältnis beibehalten: bei aktivierter Option wird die jeweils
  // andere Dimension proportional mitgeführt.
  const keepAspect = ref(false)
  const aspectRatio = ref(collage.settings.width / collage.settings.height)

  function toggleKeepAspect() {
    keepAspect.value = !keepAspect.value
    if (keepAspect.value) {
      // Aktuelles Verhältnis als Referenz merken
      aspectRatio.value = collage.settings.width / collage.settings.height
    }
  }

  function clampSize(value: number) {
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))
  }

  function applySize(width: number, height: number) {
    collage.saveStateForUndoDebounced()
    // Bilder proportional zur neuen Canvasgröße mitskalieren
    collage.resizeCanvas(width, height)
  }

  function updateWidth(value: number) {
    const width = value
    const height = keepAspect.value ? clampSize(width / aspectRatio.value) : collage.settings.height
    applySize(width, height)
  }

  function updateHeight(value: number) {
    const height = value
    const width = keepAspect.value ? clampSize(height * aspectRatio.value) : collage.settings.width
    applySize(width, height)
  }

  function resetWidth() {
    collage.saveStateForUndo()
    const height = keepAspect.value
      ? clampSize(DEFAULT_WIDTH / aspectRatio.value)
      : collage.settings.height
    collage.resizeCanvas(DEFAULT_WIDTH, height)
  }

  function resetHeight() {
    collage.saveStateForUndo()
    const width = keepAspect.value
      ? clampSize(DEFAULT_HEIGHT * aspectRatio.value)
      : collage.settings.width
    collage.resizeCanvas(width, DEFAULT_HEIGHT)
  }

  function updateBackgroundColor(value: string) {
    collage.saveStateForUndoDebounced()
    // Bei Farbauswahl das Hintergrundbild entfernen (skipUndo da oben bereits gespeichert)
    if (collage.settings.backgroundImage.url) {
      collage.removeBackgroundImage(true)
    }
    collage.updateSettings({ backgroundColor: value })
  }

  function updateBackgroundFit(value: BackgroundImageFit) {
    collage.saveStateForUndo()
    collage.setBackgroundImageFit(value)
  }

  function removeBackground() {
    // Undo wird in removeBackgroundImage gespeichert
    collage.removeBackgroundImage()
  }

  function updateBackgroundOpacity(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ opacity: value })
  }

  function updateBackgroundBrightness(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ brightness: value })
  }

  function updateBackgroundContrast(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ contrast: value })
  }

  function updateBackgroundSaturation(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ saturation: value })
  }

  function updateBackgroundBlur(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ blur: value })
  }

  function updateZoom(value: number) {
    collage.setCanvasZoom(value)
  }

  function resetView() {
    collage.resetCanvasView()
  }
</script>

<template>
  <div
    class="w-full bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
  >
    <h2 class="text-lg font-semibold mb-4">{{ t('canvas.size') }}</h2>

    <div class="space-y-4">
      <!-- Seitenverhältnis beibehalten -->
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t('canvas.keepAspectRatio') }}</label>
        <button
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
            keepAspect
              ? 'bg-accent hover:bg-accent-dark text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
          ]"
          :title="t('canvas.keepAspectRatio')"
          :aria-pressed="keepAspect"
          @click="toggleKeepAspect"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="keepAspect"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          {{ keepAspect ? t('canvas.on') : t('canvas.off') }}
        </button>
      </div>

      <!-- Canvas Width -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium">
            {{ t('canvas.width') }}: {{ collage.settings.width }}px
          </label>
          <button
            v-if="collage.settings.width !== DEFAULT_WIDTH"
            class="text-xs text-muted hover:text-accent transition-colors"
            :title="t('imageControls.resetValue')"
            @click="resetWidth"
          >
            ↺
          </button>
        </div>
        <input
          type="number"
          :value="collage.settings.width"
          :min="MIN_SIZE"
          :max="MAX_SIZE"
          step="10"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
          @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
        />
        <input
          type="range"
          :value="collage.settings.width"
          :min="MIN_SIZE"
          :max="MAX_SIZE"
          step="10"
          class="w-full mt-2"
          :aria-label="t('canvas.width')"
          @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Canvas Height -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium">
            {{ t('canvas.height') }}: {{ collage.settings.height }}px
          </label>
          <button
            v-if="collage.settings.height !== DEFAULT_HEIGHT"
            class="text-xs text-muted hover:text-accent transition-colors"
            :title="t('imageControls.resetValue')"
            @click="resetHeight"
          >
            ↺
          </button>
        </div>
        <input
          type="number"
          :value="collage.settings.height"
          :min="MIN_SIZE"
          :max="MAX_SIZE"
          step="10"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
          @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
        />
        <input
          type="range"
          :value="collage.settings.height"
          :min="MIN_SIZE"
          :max="MAX_SIZE"
          step="10"
          class="w-full mt-2"
          :aria-label="t('canvas.height')"
          @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- Background Color -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.background') }}
        </label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="collage.settings.backgroundColor"
            class="w-16 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            :value="collage.settings.backgroundColor"
            placeholder="#ffffff"
            class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm font-mono"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
          />
        </div>
        <p v-if="collage.settings.backgroundImage.url" class="text-xs text-muted mt-1">
          {{ t('canvas.colorReplacesImage') }}
        </p>
      </div>

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
            @click.stop="removeBackground"
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
              updateBackgroundFit(($event.target as HTMLSelectElement).value as BackgroundImageFit)
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
                @click="updateBackgroundOpacity(1)"
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
              @input="updateBackgroundOpacity(Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <!-- Brightness -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-muted">
                {{ t('imageControls.brightness') }}:
                {{ collage.settings.backgroundImage.brightness }}%
              </label>
              <button
                v-if="collage.settings.backgroundImage.brightness !== 100"
                class="text-xs text-accent hover:text-accent-dark transition-colors"
                :title="t('imageControls.resetValue')"
                @click="updateBackgroundBrightness(100)"
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
              @input="updateBackgroundBrightness(Number(($event.target as HTMLInputElement).value))"
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
                @click="updateBackgroundContrast(100)"
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
              @input="updateBackgroundContrast(Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <!-- Saturation -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-muted">
                {{ t('imageControls.saturation') }}:
                {{ collage.settings.backgroundImage.saturation }}%
              </label>
              <button
                v-if="collage.settings.backgroundImage.saturation !== 100"
                class="text-xs text-accent hover:text-accent-dark transition-colors"
                :title="t('imageControls.resetValue')"
                @click="updateBackgroundSaturation(100)"
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
              @input="updateBackgroundSaturation(Number(($event.target as HTMLInputElement).value))"
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
                @click="updateBackgroundBlur(0)"
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
              @input="updateBackgroundBlur(Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <p class="text-xs text-muted mt-2">
          {{ t('canvas.backgroundFitHint') }}
        </p>
      </div>

      <!-- Zoom Control -->
      <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium">
            {{ t('canvas.zoom') }}: {{ Math.round(collage.canvasZoom * 100) }}%
          </label>
          <button
            class="text-xs px-2 py-1 bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 rounded transition-colors"
            @click="resetView"
          >
            {{ t('canvas.resetView') }}
          </button>
        </div>
        <input
          type="range"
          :value="collage.canvasZoom"
          min="0.25"
          max="4"
          step="0.05"
          class="w-full"
          @input="updateZoom(Number(($event.target as HTMLInputElement).value))"
        />
        <p class="text-xs text-muted mt-1">
          {{ t('canvas.zoomHint') }}
        </p>
      </div>
    </div>
  </div>
</template>
