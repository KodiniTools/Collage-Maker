<script setup lang="ts">
import { computed } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

// Nur Galerie-Templates anzeigen (keine Canvas-Instanzen)
const galleryImages = computed(() =>
  collage.images.filter(img => img.isGalleryTemplate === true)
)

function handleDragStart(event: DragEvent, imageId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('imageId', imageId)
  }
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('images.title') }} ({{ galleryImages.length }})</h2>

    <div v-if="galleryImages.length === 0" class="text-center py-8 text-muted">
      {{ t('images.empty') }}
    </div>

    <div v-else class="space-y-2 max-h-64 overflow-y-auto">
      <div
        v-for="image in galleryImages"
        :key="image.id"
        draggable="true"
        @dragstart="handleDragStart($event, image.id)"
        @click="collage.selectImage(image.id)"
        :class="[
          'flex items-center gap-3 p-2 rounded-lg cursor-move transition-colors',
          collage.selectedImageId === image.id
            ? 'bg-accent/10 dark:bg-accent/5'
            : 'hover:bg-muted/10 dark:hover:bg-slate/30'
        ]"
        :title="t('images.dragToCanvas') || 'Ziehen Sie das Bild auf das Canvas'"
      >
        <img :src="image.url" :alt="image.file.name" class="w-12 h-12 object-cover rounded" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ image.file.name }}</p>
          <p class="text-xs text-muted">{{ Math.round(image.file.size / 1024) }} KB</p>
        </div>
        <button
          @click.stop="collage.removeImage(image.id)"
          class="p-1 hover:bg-warm/20 dark:hover:bg-warm/10 rounded transition-colors"
          :aria-label="t('images.remove')"
        >
          <svg class="w-5 h-5 text-warm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
