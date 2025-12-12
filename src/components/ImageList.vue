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

// Anzahl ausgewählter Galerie-Bilder
const selectedCount = computed(() => collage.selectedGalleryIds.length)

// Sind alle Bilder ausgewählt?
const allSelected = computed(() =>
  galleryImages.value.length > 0 &&
  galleryImages.value.every(img => collage.isGalleryImageSelected(img.id))
)

function handleDragStart(event: DragEvent, imageId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('imageId', imageId)
  }
}

function handleImageClick(imageId: string, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    // Mehrfachauswahl mit Ctrl/Cmd-Klick
    collage.toggleGallerySelection(imageId)
  } else {
    // Einzelauswahl - toggle
    if (collage.isGalleryImageSelected(imageId) && selectedCount.value === 1) {
      collage.deselectAllGalleryImages()
    } else {
      collage.deselectAllGalleryImages()
      collage.toggleGallerySelection(imageId)
    }
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    collage.deselectAllGalleryImages()
  } else {
    collage.selectAllGalleryImages()
  }
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('images.title') }} ({{ galleryImages.length }})</h2>

    <div v-if="galleryImages.length === 0" class="text-center py-8 text-muted">
      {{ t('images.empty') }}
    </div>

    <template v-else>
      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2 mb-3">
        <!-- Select All / Deselect All -->
        <button
          @click="toggleSelectAll"
          class="flex-1 min-w-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-muted/30 hover:bg-muted/10 dark:hover:bg-slate/20 transition-colors"
        >
          {{ allSelected ? t('gallery.deselectAll') : t('gallery.selectAll') }}
        </button>

        <!-- Add to Canvas Button -->
        <button
          v-if="selectedCount > 0"
          @click="collage.addSelectedGalleryToCanvas()"
          class="flex-1 min-w-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary-dark text-surface-light transition-colors flex items-center justify-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('gallery.addToCanvas', { count: selectedCount }) }}
        </button>

        <!-- Delete Selected Button -->
        <button
          v-if="selectedCount > 0"
          @click="collage.removeSelectedGalleryImages()"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-warm hover:bg-warm-dark text-surface-light transition-colors flex items-center justify-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ t('gallery.deleteSelected', { count: selectedCount }) }}
        </button>
      </div>

      <!-- Selection Info -->
      <p v-if="selectedCount > 0" class="text-xs text-muted mb-2">
        {{ t('gallery.selectedInfo', { count: selectedCount }) }}
      </p>
      <p v-else class="text-xs text-muted/70 mb-2">
        {{ t('gallery.hint') }}
      </p>

      <!-- Image List -->
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="image in galleryImages"
          :key="image.id"
          draggable="true"
          @dragstart="handleDragStart($event, image.id)"
          @click="handleImageClick(image.id, $event)"
          @keydown.enter="handleImageClick(image.id, $event as any)"
          tabindex="0"
          role="button"
          :aria-label="`Select image ${image.file.name}`"
          :class="[
            'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent',
            collage.isGalleryImageSelected(image.id)
              ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary'
              : 'hover:bg-muted/10 dark:hover:bg-slate/30'
          ]"
          :title="t('images.dragToCanvas') || 'Ziehen Sie das Bild auf das Canvas'"
        >
          <!-- Selection Checkbox -->
          <div
            :class="[
              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
              collage.isGalleryImageSelected(image.id)
                ? 'bg-primary border-primary'
                : 'border-muted/50 hover:border-primary/50'
            ]"
          >
            <svg
              v-if="collage.isGalleryImageSelected(image.id)"
              class="w-3 h-3 text-surface-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Thumbnail -->
          <img :src="image.url" :alt="image.file.name" class="w-12 h-12 object-cover rounded" />

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ image.file.name }}</p>
            <p class="text-xs text-muted">{{ Math.round(image.file.size / 1024) }} KB</p>
          </div>

          <!-- Remove Button -->
          <button
            @click.stop="collage.removeImage(image.id)"
            class="p-1 hover:bg-warm/20 dark:hover:bg-warm/10 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm"
            :aria-label="t('images.remove')"
          >
            <svg class="w-5 h-5 text-warm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
