<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'
import type { BackgroundImageFit } from '@/types'

const collage = useCollageStore()
const { t } = useI18n()

function updateWidth(value: number) {
  collage.saveStateForUndoDebounced()
  collage.updateSettings({ width: value })
}

function updateHeight(value: number) {
  collage.saveStateForUndoDebounced()
  collage.updateSettings({ height: value })
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
  <div class="w-full bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4">
    <h2 class="text-lg font-semibold mb-4">{{ t('canvas.size') }}</h2>

    <div class="space-y-4">
      <!-- Canvas Width -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.width') }}: {{ collage.settings.width }}px
        </label>
        <input
          type="number"
          :value="collage.settings.width"
          @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
          min="400"
          max="4000"
          step="10"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
        />
      </div>

      <!-- Canvas Height -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('canvas.height') }}: {{ collage.settings.height }}px
        </label>
        <input
          type="number"
          :value="collage.settings.height"
          @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
          min="400"
          max="4000"
          step="10"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
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
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
            class="w-16 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
          />
          <input
            type="text"
            :value="collage.settings.backgroundColor"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
            placeholder="#ffffff"
            class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm font-mono"
          />
        </div>
        <p v-if="collage.settings.backgroundImage.url" class="text-xs text-muted mt-1">
          {{ t('canvas.colorReplacesImage') }}
        </p>
      </div>

      <!-- Background Image -->
      <div v-if="collage.settings.backgroundImage.url" class="border-t border-muted/30 dark:border-slate/30 pt-4">
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
            @click.stop="removeBackground"
            class="absolute top-1 right-1 p-1 bg-warm hover:bg-warm-dark text-surface-light rounded-full transition-colors"
            :title="t('canvas.removeBackgroundImage')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
            @change="updateBackgroundFit(($event.target as HTMLSelectElement).value as BackgroundImageFit)"
            class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
          >
            <option value="cover">{{ t('canvas.fitCover') }}</option>
            <option value="contain">{{ t('canvas.fitContain') }}</option>
            <option value="stretch">{{ t('canvas.fitStretch') }}</option>
            <option value="tile">{{ t('canvas.fitTile') }}</option>
          </select>
        </div>

        <!-- Editing Controls (show when background is selected) -->
        <div v-if="collage.isBackgroundSelected" class="space-y-3 bg-muted/10 dark:bg-navy/20 rounded-lg p-3">
          <p class="text-xs font-medium text-primary mb-2">{{ t('canvas.editBackground') }}</p>

          <!-- Opacity -->
          <div>
            <label class="block text-xs font-medium mb-1 text-muted">
              {{ t('imageControls.opacity') }}: {{ Math.round(collage.settings.backgroundImage.opacity * 100) }}%
            </label>
            <input
              type="range"
              :value="collage.settings.backgroundImage.opacity"
              @input="updateBackgroundOpacity(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="1"
              step="0.01"
              class="w-full accent-accent"
            />
          </div>

          <!-- Brightness -->
          <div>
            <label class="block text-xs font-medium mb-1 text-muted">
              {{ t('imageControls.brightness') }}: {{ collage.settings.backgroundImage.brightness }}%
            </label>
            <input
              type="range"
              :value="collage.settings.backgroundImage.brightness"
              @input="updateBackgroundBrightness(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              step="1"
              class="w-full accent-accent"
            />
          </div>

          <!-- Contrast -->
          <div>
            <label class="block text-xs font-medium mb-1 text-muted">
              {{ t('imageControls.contrast') }}: {{ collage.settings.backgroundImage.contrast }}%
            </label>
            <input
              type="range"
              :value="collage.settings.backgroundImage.contrast"
              @input="updateBackgroundContrast(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              step="1"
              class="w-full accent-accent"
            />
          </div>

          <!-- Saturation -->
          <div>
            <label class="block text-xs font-medium mb-1 text-muted">
              {{ t('imageControls.saturation') }}: {{ collage.settings.backgroundImage.saturation }}%
            </label>
            <input
              type="range"
              :value="collage.settings.backgroundImage.saturation"
              @input="updateBackgroundSaturation(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              step="1"
              class="w-full accent-accent"
            />
          </div>

          <!-- Blur -->
          <div>
            <label class="block text-xs font-medium mb-1 text-muted">
              {{ t('canvas.blur') }}: {{ collage.settings.backgroundImage.blur }}px
            </label>
            <input
              type="range"
              :value="collage.settings.backgroundImage.blur"
              @input="updateBackgroundBlur(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="20"
              step="0.5"
              class="w-full accent-accent"
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
            @click="resetView"
            class="text-xs px-2 py-1 bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 rounded transition-colors"
          >
            {{ t('canvas.resetView') }}
          </button>
        </div>
        <input
          type="range"
          :value="collage.canvasZoom"
          @input="updateZoom(Number(($event.target as HTMLInputElement).value))"
          min="0.25"
          max="4"
          step="0.05"
          class="w-full"
        />
        <p class="text-xs text-muted mt-1">
          {{ t('canvas.zoomHint') }}
        </p>
      </div>
    </div>
  </div>
</template>
