<script setup lang="ts">
import { computed } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

const selectedImage = computed(() => collage.selectedImage)

function updateWidth(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { width: value })
  }
}

function updateHeight(value: number) {
  if (collage.selectedImageId) {
    collage.updateImage(collage.selectedImageId, { height: value })
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
        <label class="block text-sm font-medium mb-2">{{ t('imageControls.size') }}</label>
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
