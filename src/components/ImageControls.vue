<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

const selectedImage = computed(() => collage.selectedImage)
const aspectRatio = ref(1)

// Berechne Seitenverhältnis wenn Bild ausgewählt wird
watch(selectedImage, (img) => {
  if (img) {
    aspectRatio.value = img.width / img.height
  }
}, { immediate: true })

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

function toggleAspectRatio() {
  collage.setLockAspectRatio(!collage.lockAspectRatio)
  if (collage.lockAspectRatio && selectedImage.value) {
    // Aktualisiere Seitenverhältnis beim Aktivieren
    aspectRatio.value = selectedImage.value.width / selectedImage.value.height
  }
}

function updateRotation(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { rotation: value })
  }
}

function updateOpacity(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { opacity: value })
  }
}

function updateBorderRadius(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderRadius: value })
  }
}

function toggleBorder() {
  if (collage.selectedImageId && selectedImage.value) {
    collage.updateImage(collage.selectedImageId, {
      borderEnabled: !selectedImage.value.borderEnabled
    })
  }
}

function updateBorderWidth(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderWidth: value })
  }
}

function updateBorderColor(value: string) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderColor: value })
  }
}

function updateBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double') {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderStyle: value })
  }
}

function toggleBorderShadow() {
  if (collage.selectedImageId && selectedImage.value) {
    collage.updateImage(collage.selectedImageId, {
      borderShadowEnabled: !selectedImage.value.borderShadowEnabled
    })
  }
}

function updateBorderShadowOffsetX(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderShadowOffsetX: value })
  }
}

function updateBorderShadowOffsetY(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderShadowOffsetY: value })
  }
}

function updateBorderShadowBlur(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderShadowBlur: value })
  }
}

function updateBorderShadowColor(value: string) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { borderShadowColor: value })
  }
}

function toggleShadow() {
  if (collage.selectedImageId && selectedImage.value) {
    collage.updateImage(collage.selectedImageId, {
      shadowEnabled: !selectedImage.value.shadowEnabled
    })
  }
}

function updateShadowOffsetX(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { shadowOffsetX: value })
  }
}

function updateShadowOffsetY(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { shadowOffsetY: value })
  }
}

function updateShadowBlur(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { shadowBlur: value })
  }
}

function updateShadowColor(value: string) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { shadowColor: value })
  }
}

function deleteImage() {
  if (collage.selectedImageId) {
    collage.removeImage(collage.selectedImageId)
  }
}

function bringToFront() {
  if (collage.selectedImageId && selectedImage.value) {
    const maxZ = Math.max(...collage.images.map(img => img.zIndex), 0)
    collage.updateImage(collage.selectedImageId, { zIndex: maxZ + 1 })
  }
}

function sendToBack() {
  if (collage.selectedImageId && selectedImage.value) {
    const minZ = Math.min(...collage.images.map(img => img.zIndex), 0)
    collage.updateImage(collage.selectedImageId, { zIndex: minZ - 1 })
  }
}

// Bildbearbeitungs-Filter Funktionen
function updateBrightness(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { brightness: value })
  }
}

function updateContrast(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { contrast: value })
  }
}

function updateHighlights(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { highlights: value })
  }
}

function updateShadows(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { shadows: value })
  }
}

function updateSaturation(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { saturation: value })
  }
}

function updateWarmth(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { warmth: value })
  }
}

function updateSharpness(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { sharpness: value })
  }
}

function resetImageChanges() {
  if (collage.selectedImageId && selectedImage.value) {
    // Setze alle Bearbeitungen auf Standardwerte zurück
    // Position und Größe bleiben erhalten (gehören zum Layout)
    collage.updateImage(collage.selectedImageId, {
      rotation: 0,
      opacity: 1,
      borderRadius: 0,
      borderEnabled: false,
      borderWidth: 4,
      borderColor: '#000000',
      borderStyle: 'solid',
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
    })
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h3 class="text-lg font-semibold mb-4">{{ t('imageControls.title') }}</h3>

    <div v-if="selectedImage" class="space-y-4">
      <!-- Größe Controls -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium">{{ t('imageControls.size') }}</label>
          <button
            @click="toggleAspectRatio"
            :class="[
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              collage.lockAspectRatio
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
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
            <label class="text-xs text-gray-600 dark:text-gray-400">{{ t('canvas.width') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.width)"
              @input="updateWidth(Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="2000"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 dark:text-gray-400">{{ t('canvas.height') }}</label>
            <input
              type="number"
              :value="Math.round(selectedImage.height)"
              @input="updateHeight(Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="2000"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 {{ t('imageControls.shiftHint') }}
        </p>
      </div>

      <!-- Rotation Control -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('controls.rotate') }}: {{ Math.round(selectedImage.rotation) }}°
        </label>
        <input
          type="range"
          :value="selectedImage.rotation"
          @input="updateRotation(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="360"
          class="w-full"
        />
      </div>

      <!-- Opacity Control -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('imageControls.opacity') }}: {{ Math.round(selectedImage.opacity * 100) }}%
        </label>
        <input
          type="range"
          :value="selectedImage.opacity"
          @input="updateOpacity(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="1"
          step="0.01"
          class="w-full"
        />
      </div>

      <!-- Border Radius Control -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('imageControls.borderRadius') }}: {{ Math.round(selectedImage.borderRadius) }}px
        </label>
        <input
          type="range"
          :value="selectedImage.borderRadius"
          @input="updateBorderRadius(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="100"
          class="w-full"
        />
      </div>

      <!-- Bildbearbeitungs-Filter -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 class="text-sm font-semibold mb-3">{{ t('imageControls.imageFilters') }}</h4>

        <div class="space-y-3">
          <!-- Helligkeit -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.brightness') }}: {{ Math.round(selectedImage.brightness ?? 100) }}%
            </label>
            <input
              type="range"
              :value="selectedImage.brightness ?? 100"
              @input="updateBrightness(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Kontrast -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.contrast') }}: {{ Math.round(selectedImage.contrast ?? 100) }}%
            </label>
            <input
              type="range"
              :value="selectedImage.contrast ?? 100"
              @input="updateContrast(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Lichter -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.highlights') }}: {{ Math.round(selectedImage.highlights ?? 0) }}
            </label>
            <input
              type="range"
              :value="selectedImage.highlights ?? 0"
              @input="updateHighlights(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Tiefen -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.shadows') }}: {{ Math.round(selectedImage.shadows ?? 0) }}
            </label>
            <input
              type="range"
              :value="selectedImage.shadows ?? 0"
              @input="updateShadows(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Sättigung -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.saturation') }}: {{ Math.round(selectedImage.saturation ?? 100) }}%
            </label>
            <input
              type="range"
              :value="selectedImage.saturation ?? 100"
              @input="updateSaturation(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="200"
              class="w-full"
            />
          </div>

          <!-- Wärme -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.warmth') }}: {{ Math.round(selectedImage.warmth ?? 0) }}
            </label>
            <input
              type="range"
              :value="selectedImage.warmth ?? 0"
              @input="updateWarmth(Number(($event.target as HTMLInputElement).value))"
              min="-100"
              max="100"
              class="w-full"
            />
          </div>

          <!-- Schärfen -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.sharpness') }}: {{ Math.round(selectedImage.sharpness ?? 0) }}
            </label>
            <input
              type="range"
              :value="selectedImage.sharpness ?? 0"
              @input="updateSharpness(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="100"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Border Controls -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('imageControls.border') }}</label>
          <button
            @click="toggleBorder"
            :class="[
              'px-3 py-1 text-xs rounded transition-colors',
              selectedImage.borderEnabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            ]"
          >
            {{ selectedImage.borderEnabled ? t('imageControls.borderEnabled') : t('imageControls.borderDisabled') }}
          </button>
        </div>

        <div v-if="selectedImage.borderEnabled" class="space-y-3">
          <!-- Border Width -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.borderWidth') }}: {{ selectedImage.borderWidth }}px
            </label>
            <input
              type="range"
              :value="selectedImage.borderWidth"
              @input="updateBorderWidth(Number(($event.target as HTMLInputElement).value))"
              min="1"
              max="20"
              class="w-full"
            />
          </div>

          <!-- Border Style -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.borderStyle') }}
            </label>
            <select
              :value="selectedImage.borderStyle"
              @change="updateBorderStyle(($event.target as HTMLSelectElement).value as any)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
            >
              <option value="solid">{{ t('imageControls.borderStyleSolid') }}</option>
              <option value="dashed">{{ t('imageControls.borderStyleDashed') }}</option>
              <option value="dotted">{{ t('imageControls.borderStyleDotted') }}</option>
              <option value="double">{{ t('imageControls.borderStyleDouble') }}</option>
            </select>
          </div>

          <!-- Border Color -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.borderColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="selectedImage.borderColor"
                @input="updateBorderColor(($event.target as HTMLInputElement).value)"
                class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                :value="selectedImage.borderColor"
                @input="updateBorderColor(($event.target as HTMLInputElement).value)"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          </div>

          <!-- Border Shadow Toggle -->
          <div class="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">{{ t('imageControls.borderShadow') }}</label>
              <button
                @click="toggleBorderShadow"
                :class="[
                  'px-2 py-1 text-xs rounded transition-colors',
                  selectedImage.borderShadowEnabled
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ selectedImage.borderShadowEnabled ? t('imageControls.borderShadowEnabled') : t('imageControls.borderShadowDisabled') }}
              </button>
            </div>

            <div v-if="selectedImage.borderShadowEnabled" class="space-y-2">
              <!-- Border Shadow Offset X -->
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ t('imageControls.borderShadowOffsetX') }}: {{ selectedImage.borderShadowOffsetX }}px
                </label>
                <input
                  type="range"
                  :value="selectedImage.borderShadowOffsetX"
                  @input="updateBorderShadowOffsetX(Number(($event.target as HTMLInputElement).value))"
                  min="-20"
                  max="20"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Offset Y -->
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ t('imageControls.borderShadowOffsetY') }}: {{ selectedImage.borderShadowOffsetY }}px
                </label>
                <input
                  type="range"
                  :value="selectedImage.borderShadowOffsetY"
                  @input="updateBorderShadowOffsetY(Number(($event.target as HTMLInputElement).value))"
                  min="-20"
                  max="20"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Blur -->
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ t('imageControls.borderShadowBlur') }}: {{ selectedImage.borderShadowBlur }}px
                </label>
                <input
                  type="range"
                  :value="selectedImage.borderShadowBlur"
                  @input="updateBorderShadowBlur(Number(($event.target as HTMLInputElement).value))"
                  min="0"
                  max="30"
                  class="w-full"
                />
              </div>

              <!-- Border Shadow Color -->
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ t('imageControls.borderShadowColor') }}
                </label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    :value="selectedImage.borderShadowColor"
                    @input="updateBorderShadowColor(($event.target as HTMLInputElement).value)"
                    class="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    :value="selectedImage.borderShadowColor"
                    @input="updateBorderShadowColor(($event.target as HTMLInputElement).value)"
                    class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shadow Controls -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('imageControls.shadow') }}</label>
          <button
            @click="toggleShadow"
            :class="[
              'px-3 py-1 text-xs rounded transition-colors',
              selectedImage.shadowEnabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            ]"
          >
            {{ selectedImage.shadowEnabled ? t('imageControls.shadowEnabled') : t('imageControls.shadowEnabled') }}
          </button>
        </div>

        <div v-if="selectedImage.shadowEnabled" class="space-y-3">
          <!-- Shadow Offset X -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.shadowOffsetX') }}: {{ selectedImage.shadowOffsetX }}px
            </label>
            <input
              type="range"
              :value="selectedImage.shadowOffsetX"
              @input="updateShadowOffsetX(Number(($event.target as HTMLInputElement).value))"
              min="-50"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Offset Y -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.shadowOffsetY') }}: {{ selectedImage.shadowOffsetY }}px
            </label>
            <input
              type="range"
              :value="selectedImage.shadowOffsetY"
              @input="updateShadowOffsetY(Number(($event.target as HTMLInputElement).value))"
              min="-50"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Blur -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.shadowBlur') }}: {{ selectedImage.shadowBlur }}px
            </label>
            <input
              type="range"
              :value="selectedImage.shadowBlur"
              @input="updateShadowBlur(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="50"
              class="w-full"
            />
          </div>

          <!-- Shadow Color -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('imageControls.shadowColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="selectedImage.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                :value="selectedImage.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
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
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            {{ t('imageControls.toFront') }}
          </button>
          <button
            @click="sendToBack"
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            {{ t('imageControls.toBack') }}
          </button>
        </div>
      </div>

      <!-- Reset Changes Button -->
      <button
        @click="resetImageChanges"
        class="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium"
      >
        {{ t('imageControls.resetChanges') }}
      </button>

      <!-- Delete Button -->
      <button
        @click="deleteImage"
        class="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
      >
        {{ t('imageControls.delete') }}
      </button>
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
      {{ t('imageControls.noSelection') }}
    </div>
  </div>
</template>
