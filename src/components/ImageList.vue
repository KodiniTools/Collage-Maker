<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

function handleDragStart(event: DragEvent, imageId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('imageId', imageId)
  }
}

function handleImageClick(event: MouseEvent, imageId: string) {
  event.preventDefault()
  collage.selectImage(imageId)
}

</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('images.title') }} ({{ collage.images.length }})</h2>
    
    <div v-if="collage.images.length === 0" class="text-center py-8 text-gray-500">
      {{ t('images.empty') }}
    </div>
    
    <div v-else class="space-y-2 max-h-64 overflow-y-auto">
      <div
        v-for="image in collage.images"
        :key="image.id"
        draggable="true"
        @dragstart="handleDragStart($event, image.id)"
        @click="handleImageClick($event, image.id)"
        :class="[
          'flex items-center gap-3 p-2 rounded-lg cursor-move transition-colors',
          collage.selectedImageId === image.id
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
        :title="t('images.dragToCanvas') || 'Ziehen Sie das Bild auf das Canvas'"
      >
        <img :src="image.url" :alt="image.file.name" class="w-12 h-12 object-cover rounded" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ image.file.name }}</p>
          <p class="text-xs text-gray-500">{{ Math.round(image.file.size / 1024) }} KB</p>
        </div>
        <button
          @click.stop="collage.removeImage(image.id)"
          class="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          :aria-label="t('images.remove')"
        >
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
