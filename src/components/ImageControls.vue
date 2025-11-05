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
