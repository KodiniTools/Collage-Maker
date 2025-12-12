<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCollageStore } from '@/stores/collage'

const { t } = useI18n()
const collage = useCollageStore()

// Nur Canvas-Bilder anzeigen (keine Gallery-Templates)
const canvasImages = computed(() =>
  collage.images.filter(img => img.isGalleryTemplate !== true)
)

function handleThumbnailClick(id: string, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    // Mehrfachauswahl mit Ctrl/Cmd-Klick
    collage.toggleImageSelection(id)
  } else {
    // Einzelauswahl
    collage.selectImage(id)
  }
  // Text-Auswahl aufheben wenn Bild ausgewählt wird
  collage.selectText(null)
}

function handleRemove(id: string, event: MouseEvent) {
  event.stopPropagation()
  collage.removeImage(id)
}
</script>

<template>
  <div
    v-if="canvasImages.length > 0"
    class="bg-surface-light dark:bg-surface-dark border-b border-muted/30 dark:border-slate/30 py-2 px-3"
  >
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-thin">
      <!-- Label -->
      <span class="text-xs text-muted dark:text-muted-light shrink-0 font-medium">
        {{ t('thumbnailBar.title') }}
      </span>

      <!-- Thumbnails -->
      <div class="flex gap-2 items-center">
        <div
          v-for="(img, index) in canvasImages"
          :key="img.id"
          class="relative group shrink-0 cursor-pointer transition-all duration-150"
          :class="{
            'ring-2 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark': collage.isImageSelected(img.id),
            'hover:ring-2 hover:ring-muted/50': !collage.isImageSelected(img.id)
          }"
          @click="handleThumbnailClick(img.id, $event)"
          :title="t('thumbnailBar.clickToSelect')"
        >
          <!-- Thumbnail Image -->
          <img
            :src="img.url"
            :alt="t('thumbnailBar.imageAlt', { index: index + 1 })"
            class="h-12 w-12 object-cover rounded"
            :style="{
              transform: `rotate(${img.rotation}deg)`,
              opacity: img.opacity
            }"
          />

          <!-- Index Badge -->
          <span
            class="absolute -top-1 -left-1 w-4 h-4 bg-slate-dark dark:bg-muted-light text-surface-light dark:text-slate-dark text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ index + 1 }}
          </span>

          <!-- Selection Checkmark -->
          <div
            v-if="collage.isImageSelected(img.id)"
            class="absolute -top-1 -right-1 w-4 h-4 bg-primary text-surface-light rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Remove Button (on hover) -->
          <button
            class="absolute -bottom-1 -right-1 w-4 h-4 bg-warm hover:bg-warm-dark text-surface-light rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
            @click="handleRemove(img.id, $event)"
            :title="t('thumbnailBar.remove')"
          >
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Selection Info -->
      <div
        v-if="collage.selectedImageIds.length > 0"
        class="ml-auto shrink-0 flex items-center gap-2"
      >
        <span class="text-xs text-muted dark:text-muted-light">
          {{ t('thumbnailBar.selected', { count: collage.selectedImageIds.length }) }}
        </span>
        <button
          v-if="collage.selectedImageIds.length > 0"
          @click="collage.deselectAllImages()"
          class="text-xs text-primary hover:text-primary-dark transition-colors"
        >
          {{ t('thumbnailBar.deselectAll') }}
        </button>
      </div>
    </div>

    <!-- Hint for multi-select -->
    <p class="text-[10px] text-muted/70 dark:text-muted-light/70 mt-1">
      {{ t('thumbnailBar.hint') }}
    </p>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
