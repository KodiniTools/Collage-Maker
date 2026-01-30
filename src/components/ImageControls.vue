<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

// Einzelauswahl (Backward-kompatibel)
const selectedImage = computed(() => collage.selectedImage)
// Mehrfachauswahl
const selectedImages = computed(() => collage.selectedImages)
const selectedCount = computed(() => collage.selectedImageIds.length)
const isMultiSelection = computed(() => selectedCount.value > 1)

const aspectRatio = ref(1)

// Berechne Seitenverhältnis wenn Bild ausgewählt wird
watch(selectedImage, (img) => {
  if (img) {
    aspectRatio.value = img.width / img.height
  }
}, { immediate: true })

// Referenzbild für Slider-Werte (erstes ausgewähltes Bild)
const displayImage = computed(() => selectedImages.value[0] || null)

// Hilfsfunktion: Updates auf alle ausgewählten Bilder anwenden
function applyToSelected(updates: Record<string, any>) {
  if (isMultiSelection.value) {
    collage.updateSelectedImages(updates)
  } else if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, updates)
  }
}

function updateWidth(value: number) {
  if (collage.selectedImageId && selectedImage.value) {
    const updates: any = { width: value }
    if (collage.lockAspectRatio) {
      updates.height = value / aspectRatio.value
    }
    collage.updateImage(collage.selectedImageId, updates)
  }
}

function updateHeight(value: number) {
  if (collage.selectedImageId && selectedImage.value) {
    const updates: any = { height: value }
    if (collage.lockAspectRatio) {
      updates.width = value * aspectRatio.value
    }
    collage.updateImage(collage.selectedImageId, updates)
  }
}

function updatePositionX(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { x: value })
  }
}

function updatePositionY(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { y: value })
  }
}

function toggleAspectRatio() {
  collage.setLockAspectRatio(!collage.lockAspectRatio)
  if (collage.lockAspectRatio && selectedImage.value) {
    // Aktualisiere Seitenverhältnis beim Aktivieren
    aspectRatio.value = selectedImage.value.width / selectedImage.value.height
  }
}

function updateRotation(value: number) {
  applyToSelected({ rotation: value })
}

function updateOpacity(value: number) {
  applyToSelected({ opacity: value })
}

function updateBorderRadius(value: number) {
  applyToSelected({ borderRadius: value })
}

function toggleBorder() {
  // Bei Mehrfachauswahl: Einheitlich aktivieren oder deaktivieren
  if (isMultiSelection.value) {
    const anyEnabled = selectedImages.value.some(img => img.borderEnabled)
    applyToSelected({ borderEnabled: !anyEnabled })
  } else if (selectedImage.value) {
    applyToSelected({ borderEnabled: !selectedImage.value.borderEnabled })
  }
}

function updateBorderWidth(value: number) {
  applyToSelected({ borderWidth: value })
}

function updateBorderColor(value: string) {
  applyToSelected({ borderColor: value })
}

function updateBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double') {
  applyToSelected({ borderStyle: value })
}

function toggleBorderShadow() {
  if (isMultiSelection.value) {
    const anyEnabled = selectedImages.value.some(img => img.borderShadowEnabled)
    applyToSelected({ borderShadowEnabled: !anyEnabled })
  } else if (selectedImage.value) {
    applyToSelected({ borderShadowEnabled: !selectedImage.value.borderShadowEnabled })
  }
}

function updateBorderShadowOffsetX(value: number) {
  applyToSelected({ borderShadowOffsetX: value })
}

function updateBorderShadowOffsetY(value: number) {
  applyToSelected({ borderShadowOffsetY: value })
}

function updateBorderShadowBlur(value: number) {
  applyToSelected({ borderShadowBlur: value })
}

function updateBorderShadowColor(value: string) {
  applyToSelected({ borderShadowColor: value })
}

function toggleShadow() {
  if (isMultiSelection.value) {
    const anyEnabled = selectedImages.value.some(img => img.shadowEnabled)
    applyToSelected({ shadowEnabled: !anyEnabled })
  } else if (selectedImage.value) {
    applyToSelected({ shadowEnabled: !selectedImage.value.shadowEnabled })
  }
}

function updateShadowOffsetX(value: number) {
  applyToSelected({ shadowOffsetX: value })
}

function updateShadowOffsetY(value: number) {
  applyToSelected({ shadowOffsetY: value })
}

function updateShadowBlur(value: number) {
  applyToSelected({ shadowBlur: value })
}

function updateShadowColor(value: string) {
  applyToSelected({ shadowColor: value })
}

function deleteImage() {
  if (isMultiSelection.value) {
    collage.removeSelectedImages()
  } else if (collage.selectedImageId) {
    collage.removeImage(collage.selectedImageId)
  }
}

function bringToFront() {
  if (selectedImages.value.length > 0) {
    const maxZ = Math.max(...collage.images.map(img => img.zIndex), 0)
    // Bei Mehrfachauswahl: Alle nach vorne, aber relative Reihenfolge beibehalten
    selectedImages.value
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach((img, index) => {
        collage.updateImage(img.id, { zIndex: maxZ + 1 + index })
      })
  }
}

function sendToBack() {
  if (selectedImages.value.length > 0) {
    const minZ = Math.min(...collage.images.map(img => img.zIndex), 0)
    // Bei Mehrfachauswahl: Alle nach hinten, aber relative Reihenfolge beibehalten
    selectedImages.value
      .sort((a, b) => b.zIndex - a.zIndex)
      .forEach((img, index) => {
        collage.updateImage(img.id, { zIndex: minZ - 1 - index })
      })
  }
}

// Bildbearbeitungs-Filter Funktionen
function updateBrightness(value: number) {
  applyToSelected({ brightness: value })
}

function updateContrast(value: number) {
  applyToSelected({ contrast: value })
}

function updateHighlights(value: number) {
  applyToSelected({ highlights: value })
}

function updateShadows(value: number) {
  applyToSelected({ shadows: value })
}

function updateSaturation(value: number) {
  applyToSelected({ saturation: value })
}

function updateWarmth(value: number) {
  applyToSelected({ warmth: value })
}

function updateSharpness(value: number) {
  applyToSelected({ sharpness: value })
}

function resetImageChanges() {
  // Setze alle Bearbeitungen auf Standardwerte zurück
  // Position und Größe bleiben erhalten (gehören zum Layout)
  const defaultValues = {
    rotation: 0,
    opacity: 1,
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'solid' as const,
    borderShadowEnabled: false,
    borderShadowOffsetX: 3,
    borderShadowOffsetY: 3,
    borderShadowBlur: 6,
    borderShadowColor: '#000000',
    shadowEnabled: false,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    shadowBlur: 10,
    shadowColor: '#000000',
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0
  }
  applyToSelected(defaultValues)
}

// Alle Canvas-Bilder auswählen
function selectAllImages() {
  collage.selectAllCanvasImages()
}

// Auswahl aufheben
function deselectAll() {
  collage.deselectAllImages()
}
</script>

<template>
  <div class="bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4">
    <h3 class="text-lg font-semibold mb-4">{{ t('imageControls.title') }}</h3>

    <!-- Mehrfachauswahl-Anzeige -->
    <div v-if="selectedCount > 0" class="space-y-4">
      <!-- Info-Banner für Mehrfachauswahl -->
      <div v-if="isMultiSelection" class="bg-accent/20 border border-accent/50 rounded-lg p-3 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-dark dark:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium text-sm">
              {{ t('imageControls.multiSelection', { count: selectedCount }) }}
            </span>
          </div>
          <button
            @click="deselectAll"
            class="text-xs text-muted hover:text-slate-dark dark:hover:text-muted underline"
          >
            {{ t('imageControls.deselectAll') }}
          </button>
        </div>
        <p class="text-xs text-muted mt-1">
          {{ t('imageControls.multiSelectionHint') }}
        </p>
      </div>

      <!-- Auswahl-Buttons -->
      <div class="flex gap-2 mb-4">
        <button
          @click="selectAllImages"
          class="flex-1 px-3 py-2 text-xs bg-muted/20 dark:bg-slate/50 hover:bg-muted/30 dark:hover:bg-slate/70 rounded-md transition-colors"
        >
          {{ t('imageControls.selectAll') }}
        </button>
        <button
          v-if="selectedCount > 0"
          @click="deselectAll"
          class="flex-1 px-3 py-2 text-xs bg-muted/20 dark:bg-slate/50 hover:bg-muted/30 dark:hover:bg-slate/70 rounded-md transition-colors"
        >
          {{ t('imageControls.deselectAll') }}
        </button>
      </div>
      <!-- Größe Controls (nur bei Einzelauswahl) -->
      <div v-if="!isMultiSelection && selectedImage">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium">{{ t('imageControls.size') }}</label>
          <button
            @click="toggleAspectRatio"
            :class="[
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              collage.lockAspectRatio
                ? 'bg-accent/20 text-slate-dark dark:text-accent'
                : 'bg-muted/10 dark:bg-slate/30 text-slate dark:text-muted'
            ]"
            :title="t('imageControls.lockAspectRatio')"
          >
            <svg
              v-if="collage.lockAspectRatio"
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <svg
              v-else
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span>{{ collage.lockAspectRatio ? t('imageControls.locked') : t('imageControls.unlocked') }}</span>
          </button>
        </div>
        <div class="space-y-2">
          <div>
            <label class="text-xs text-muted">{{ t('canvas.width') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.width)"
              @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="2000"
              class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            />
          </div>
          <div>
            <label class="text-xs text-muted">{{ t('canvas.height') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.height)"
              @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="2000"
              class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            />
          </div>
        </div>
        <p class="text-xs text-muted mt-1">
          {{ t('imageControls.shiftHint') }}
        </p>
      </div>

      <!-- Position Controls (nur bei Einzelauswahl) -->
      <div v-if="!isMultiSelection && selectedImage">
        <label class="text-sm font-medium mb-2 block">{{ t('imageControls.position') }}</label>
        <div class="space-y-2">
          <div>
            <label class="text-xs text-muted">{{ t('imageControls.positionX') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.x)"
              @input="updatePositionX(Number(($event.target as HTMLInputElement).value))"
              class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            />
          </div>
          <div>
            <label class="text-xs text-muted">{{ t('imageControls.positionY') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.y)"
              @input="updatePositionY(Number(($event.target as HTMLInputElement).value))"
              class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            />
          </div>
        </div>
      </div>

      <!-- Rotation Control -->
      <div v-if="displayImage">
        <label class="block text-sm font-medium mb-2">
          {{ t('controls.rotate') }}: {{ Math.round(displayImage.rotation) }}°
        </label>
        <input
          type="range"
          :value="displayImage.rotation"
          @input="updateRotation(Number(($event.target as HTMLInputElement).value))"
          min="-180"
          max="180"
          class="w-full"
        />
      </div>

      <!-- Opacity Control -->
      <div v-if="displayImage">
        <label class="block text-sm font-medium mb-2">
          {{ t('imageControls.opacity') }}: {{ Math.round(displayImage.opacity * 100) }}%
        </label>
        <input
          type="range"
          :value="displayImage.opacity"
          @input="updateOpacity(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="1"
          step="0.01"
          class="w-full"
        />
      </div>

      <!-- Border Radius Control -->
      <div v-if="displayImage">
        <label class="block text-sm font-medium mb-2">
          {{ t('imageControls.borderRadius') }}: {{ Math.round(displayImage.borderRadius) }}px
        </label>
        <input
          type="range"
          :value="displayImage.borderRadius"
          @input="updateBorderRadius(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="100"
          class="w-full"
        />
      </div>

      <!-- Bildbearbeitungs-Filter -->
      <div v-if="displayImage" class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <h4 class="text-sm font-semibold mb-3">{{ t('imageControls.imageFilters') }}</h4>

        <div class="space-y-3">
          <!-- Helligkeit -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.brightness') }}: {{ Math.round(displayImage.brightness ?? 100) }}%
            </label>
            <input
              type="range"
              :value="displayImage.brightness ?? 100"
              @input="updateBrightness(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Kontrast -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.contrast') }}: {{ Math.round(displayImage.contrast ?? 100) }}%
            </label>
            <input
              type="range"
              :value="displayImage.contrast ?? 100"
              @input="updateContrast(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Lichter -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.highlights') }}: {{ Math.round(displayImage.highlights ?? 0) }}
            </label>
            <input
              type="range"
              :value="displayImage.highlights ?? 0"
              @input="updateHighlights(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Tiefen -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.shadows') }}: {{ Math.round(displayImage.shadows ?? 0) }}
            </label>
            <input
              type="range"
              :value="displayImage.shadows ?? 0"
              @input="updateShadows(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Sättigung -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.saturation') }}: {{ Math.round(displayImage.saturation ?? 100) }}%
            </label>
            <input
              type="range"
              :value="displayImage.saturation ?? 100"
              @input="updateSaturation(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Wärme -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.warmth') }}: {{ Math.round(displayImage.warmth ?? 0) }}
            </label>
            <input
              type="range"
              :value="displayImage.warmth ?? 0"
              @input="updateWarmth(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Schärfen -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.sharpness') }}: {{ Math.round(displayImage.sharpness ?? 0) }}
            </label>
            <input
              type="range"
              :value="displayImage.sharpness ?? 0"
              @input="updateSharpness(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="100"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Border Controls -->
      <div v-if="displayImage" class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('imageControls.border') }}</label>
          <button
            @click="toggleBorder"
            :class="[
              'px-3 py-1 text-xs rounded transition-colors',
              displayImage.borderEnabled
                ? 'bg-accent hover:bg-accent-dark text-slate-dark'
                : 'bg-muted/20 dark:bg-slate/50 hover:bg-muted/30 dark:hover:bg-slate/70 text-slate dark:text-muted'
            ]"
          >
            {{ displayImage.borderEnabled ? t('imageControls.borderEnabled') : t('imageControls.borderDisabled') }}
          </button>
        </div>

        <div v-if="displayImage.borderEnabled" class="space-y-3">
          <!-- Border Width -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.borderWidth') }}: {{ displayImage.borderWidth }}px
            </label>
            <input
              type="range"
              :value="displayImage.borderWidth"
              @input="updateBorderWidth(Number(($event.target as HTMLInputElement).value))"
              min="1"
              max="20"
              class="w-full"
            />
          </div>

          <!-- Border Style -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.borderStyle') }}
            </label>
            <select
              :value="displayImage.borderStyle"
              @change="updateBorderStyle(($event.target as HTMLSelectElement).value as any)"
              class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
            >
              <option value="solid">{{ t('imageControls.borderStyleSolid') }}</option>
              <option value="dashed">{{ t('imageControls.borderStyleDashed') }}</option>
              <option value="dotted">{{ t('imageControls.borderStyleDotted') }}</option>
              <option value="double">{{ t('imageControls.borderStyleDouble') }}</option>
            </select>
          </div>

          <!-- Border Color -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.borderColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="displayImage.borderColor"
                @input="updateBorderColor(($event.target as HTMLInputElement).value)"
                class="w-12 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
              />
              <input
                type="text"
                :value="displayImage.borderColor"
                @input="updateBorderColor(($event.target as HTMLInputElement).value)"
                class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
              />
            </div>
          </div>

          <!-- Border Shadow Toggle -->
          <div class="border-t border-muted/50 dark:border-slate pt-3 mt-3">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-muted">{{ t('imageControls.borderShadow') }}</label>
              <button
                @click="toggleBorderShadow"
                :class="[
                  'px-2 py-1 text-xs rounded transition-colors',
                  displayImage.borderShadowEnabled
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ displayImage.borderShadowEnabled ? t('imageControls.borderShadowEnabled') : t('imageControls.borderShadowDisabled') }}
              </button>
            </div>

            <div v-if="displayImage.borderShadowEnabled" class="space-y-2">
              <!-- Border Shadow Offset X -->
              <div>
                <label class="block text-xs text-muted mb-1">
                  {{ t('imageControls.borderShadowOffsetX') }}: {{ displayImage.borderShadowOffsetX }}px
                </label>
                <input
                  type="range"
                  :value="displayImage.borderShadowOffsetX"
                  @input="updateBorderShadowOffsetX(Number(($event.target as HTMLInputElement).value))"
                  min="-20"
                  max="20"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Offset Y -->
              <div>
                <label class="block text-xs text-muted mb-1">
                  {{ t('imageControls.borderShadowOffsetY') }}: {{ displayImage.borderShadowOffsetY }}px
                </label>
                <input
                  type="range"
                  :value="displayImage.borderShadowOffsetY"
                  @input="updateBorderShadowOffsetY(Number(($event.target as HTMLInputElement).value))"
                  min="-20"
                  max="20"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Blur -->
              <div>
                <label class="block text-xs text-muted mb-1">
                  {{ t('imageControls.borderShadowBlur') }}: {{ displayImage.borderShadowBlur }}px
                </label>
                <input
                  type="range"
                  :value="displayImage.borderShadowBlur"
                  @input="updateBorderShadowBlur(Number(($event.target as HTMLInputElement).value))"
                  min="0"
                  max="30"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Color -->
              <div>
                <label class="block text-xs text-muted mb-1">
                  {{ t('imageControls.borderShadowColor') }}
                </label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    :value="displayImage.borderShadowColor"
                    @input="updateBorderShadowColor(($event.target as HTMLInputElement).value)"
                    class="w-12 h-8 rounded border border-muted/50 dark:border-slate cursor-pointer"
                  />
                  <input
                    type="text"
                    :value="displayImage.borderShadowColor"
                    @input="updateBorderShadowColor(($event.target as HTMLInputElement).value)"
                    class="flex-1 px-2 py-1 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shadow Controls -->
      <div v-if="displayImage" class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('imageControls.shadow') }}</label>
          <button
            @click="toggleShadow"
            :class="[
              'px-3 py-1 text-xs rounded transition-colors',
              displayImage.shadowEnabled
                ? 'bg-accent hover:bg-accent-dark text-slate-dark'
                : 'bg-muted/20 dark:bg-slate/50 hover:bg-muted/30 dark:hover:bg-slate/70 text-slate dark:text-muted'
            ]"
          >
            {{ displayImage.shadowEnabled ? t('imageControls.shadowEnabled') : t('imageControls.shadowEnabled') }}
          </button>
        </div>

        <div v-if="displayImage.shadowEnabled" class="space-y-3">
          <!-- Shadow Offset X -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.shadowOffsetX') }}: {{ displayImage.shadowOffsetX }}px
            </label>
            <input
              type="range"
              :value="displayImage.shadowOffsetX"
              @input="updateShadowOffsetX(Number(($event.target as HTMLInputElement).value))"
              min="-50"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Offset Y -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.shadowOffsetY') }}: {{ displayImage.shadowOffsetY }}px
            </label>
            <input
              type="range"
              :value="displayImage.shadowOffsetY"
              @input="updateShadowOffsetY(Number(($event.target as HTMLInputElement).value))"
              min="-50"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Blur -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.shadowBlur') }}: {{ displayImage.shadowBlur }}px
            </label>
            <input
              type="range"
              :value="displayImage.shadowBlur"
              @input="updateShadowBlur(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Color -->
          <div>
            <label class="block text-xs text-muted mb-1">
              {{ t('imageControls.shadowColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="displayImage.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                class="w-12 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
              />
              <input
                type="text"
                :value="displayImage.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Z-Index Controls -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('imageControls.layer') }}</label>
        <div class="flex gap-2">
          <button
            @click="bringToFront"
            class="flex-1 px-3 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-md text-sm"
          >
            {{ t('imageControls.toFront') }}
          </button>
          <button
            @click="sendToBack"
            class="flex-1 px-3 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-md text-sm"
          >
            {{ t('imageControls.toBack') }}
          </button>
        </div>
      </div>

      <!-- Reset Changes Button -->
      <button
        @click="resetImageChanges"
        class="w-full px-4 py-2 bg-warm hover:bg-warm-dark text-surface-light rounded-md font-medium"
      >
        {{ t('imageControls.resetChanges') }}
      </button>

      <!-- Delete Button -->
      <button
        @click="deleteImage"
        class="w-full px-4 py-2 bg-warm hover:bg-warm-dark text-surface-light rounded-md font-medium"
      >
        {{ isMultiSelection ? t('imageControls.deleteMultiple', { count: selectedCount }) : t('imageControls.delete') }}
      </button>
    </div>

    <div v-else class="text-center text-muted py-8">
      <p>{{ t('imageControls.noSelection') }}</p>
      <p class="text-xs mt-2">{{ t('imageControls.ctrlClickHint') }}</p>
    </div>
  </div>
</template>
