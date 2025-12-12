<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'
import type { CollageImage } from '@/types'

const collage = useCollageStore()
const { selectedGalleryIds, images } = storeToRefs(collage)
const { t } = useI18n()

// Preview Modal State
const showPreview = ref(false)
const previewImage = ref<CollageImage | null>(null)

// Nur Galerie-Templates anzeigen (keine Canvas-Instanzen)
const galleryImages = computed(() =>
  images.value.filter(img => img.isGalleryTemplate === true)
)

// Anzahl ausgewählter Galerie-Bilder
const selectedCount = computed(() => selectedGalleryIds.value.length)

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

function handleDoubleClick(image: CollageImage) {
  previewImage.value = image
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
  previewImage.value = null
}

function toggleSelectAll() {
  if (allSelected.value) {
    collage.deselectAllGalleryImages()
  } else {
    collage.selectAllGalleryImages()
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getImageDimensions(image: CollageImage): string {
  return `${Math.round(image.width)} × ${Math.round(image.height)} px`
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'UNKNOWN'
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('images.title') }} ({{ galleryImages.length }})</h2>

    <div v-if="galleryImages.length === 0" class="text-center py-8 text-muted">
      {{ t('images.empty') }}
    </div>

    <template v-else>
      <!-- Hint -->
      <p class="text-[10px] text-muted/70 mb-2">
        {{ t('gallery.hint') }}
      </p>

      <!-- Image List (always first to prevent jumping) -->
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="image in galleryImages"
          :key="image.id"
          draggable="true"
          @dragstart="handleDragStart($event, image.id)"
          @click="handleImageClick(image.id, $event)"
          @dblclick="handleDoubleClick(image)"
          @keydown.enter="handleImageClick(image.id, $event as any)"
          tabindex="0"
          role="button"
          :aria-label="`Select image ${image.file.name}`"
          :class="[
            'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent',
            collage.isGalleryImageSelected(image.id)
              ? 'bg-primary/15 dark:bg-primary/25 ring-2 ring-primary shadow-sm'
              : 'hover:bg-muted/10 dark:hover:bg-slate/30'
          ]"
          :title="t('gallery.doubleClickHint')"
        >
          <!-- Selection Checkbox - Improved -->
          <div
            @click.stop="collage.toggleGallerySelection(image.id)"
            :class="[
              'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer',
              collage.isGalleryImageSelected(image.id)
                ? 'bg-primary border-primary shadow-md scale-110'
                : 'border-muted/50 hover:border-primary hover:bg-primary/10'
            ]"
          >
            <svg
              v-if="collage.isGalleryImageSelected(image.id)"
              class="w-4 h-4 text-surface-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Thumbnail with selection indicator -->
          <div class="relative">
            <img
              :src="image.url"
              :alt="image.file.name"
              class="w-12 h-12 object-cover rounded"
              :class="{ 'ring-2 ring-primary': collage.isGalleryImageSelected(image.id) }"
            />
            <!-- Selection number badge -->
            <span
              v-if="collage.isGalleryImageSelected(image.id)"
              class="absolute -top-1 -right-1 w-4 h-4 bg-primary text-surface-light text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {{ collage.selectedGalleryIds.indexOf(image.id) + 1 }}
            </span>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ image.file.name }}</p>
            <p class="text-xs text-muted">{{ formatFileSize(image.file.size) }}</p>
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

      <!-- Selection Action Bar (below list to prevent jumping) -->
      <div
        v-if="selectedCount > 0"
        class="mt-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30"
      >
        <p class="text-sm font-medium text-primary dark:text-primary-light mb-2">
          {{ t('gallery.selectedInfo', { count: selectedCount }) }}
        </p>
        <div class="flex flex-col gap-2">
          <!-- Add to Canvas Button - Prominent -->
          <button
            @click="collage.addSelectedGalleryToCanvas()"
            class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-dark text-surface-light transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ t('gallery.addSelectedToCanvas') }}
          </button>

          <div class="flex gap-2">
            <!-- Delete Selected Button -->
            <button
              @click="collage.removeSelectedGalleryImages()"
              class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-warm hover:bg-warm-dark text-surface-light transition-colors flex items-center justify-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {{ t('gallery.deleteSelected', { count: selectedCount }) }}
            </button>

            <!-- Deselect Button -->
            <button
              @click="collage.deselectAllGalleryImages()"
              class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-muted/30 hover:bg-muted/10 dark:hover:bg-slate/20 transition-colors"
            >
              {{ t('gallery.deselectAll') }}
            </button>
          </div>
        </div>
        <p class="text-[10px] text-muted mt-2">
          {{ t('gallery.layoutHint') }}
        </p>
      </div>

      <!-- Select All Button (when nothing selected) -->
      <div v-else class="mt-3 flex flex-wrap gap-2">
        <button
          @click="toggleSelectAll"
          class="flex-1 min-w-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-muted/30 hover:bg-muted/10 dark:hover:bg-slate/20 transition-colors"
        >
          {{ t('gallery.selectAll') }}
        </button>
      </div>
    </template>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <div
        v-if="showPreview && previewImage"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        @click.self="closePreview"
      >
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-muted/30 dark:border-slate/30">
            <h3 class="text-lg font-semibold truncate pr-4">{{ t('gallery.preview') }}</h3>
            <button
              @click="closePreview"
              class="p-1 hover:bg-muted/20 dark:hover:bg-slate/30 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Image -->
          <div class="p-4 flex justify-center bg-muted/10 dark:bg-slate/20">
            <img
              :src="previewImage.url"
              :alt="previewImage.file.name"
              class="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
            />
          </div>

          <!-- Info -->
          <div class="p-4 space-y-3">
            <!-- Filename -->
            <div>
              <p class="text-xs text-muted uppercase tracking-wide mb-1">{{ t('gallery.previewTitle') }}</p>
              <p class="font-medium truncate">{{ previewImage.file.name }}</p>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-3 gap-4">
              <!-- Format -->
              <div class="text-center p-2 bg-muted/10 dark:bg-slate/20 rounded-lg">
                <p class="text-xs text-muted uppercase tracking-wide mb-1">{{ t('gallery.previewFormat') }}</p>
                <p class="font-semibold text-primary">{{ getFileExtension(previewImage.file.name) }}</p>
              </div>

              <!-- Size -->
              <div class="text-center p-2 bg-muted/10 dark:bg-slate/20 rounded-lg">
                <p class="text-xs text-muted uppercase tracking-wide mb-1">{{ t('gallery.previewSize') }}</p>
                <p class="font-semibold">{{ formatFileSize(previewImage.file.size) }}</p>
              </div>

              <!-- Dimensions -->
              <div class="text-center p-2 bg-muted/10 dark:bg-slate/20 rounded-lg">
                <p class="text-xs text-muted uppercase tracking-wide mb-1">{{ t('gallery.previewDimensions') }}</p>
                <p class="font-semibold">{{ getImageDimensions(previewImage) }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-2">
              <button
                @click="collage.toggleGallerySelection(previewImage.id); closePreview()"
                :class="[
                  'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  collage.isGalleryImageSelected(previewImage.id)
                    ? 'bg-muted/20 hover:bg-muted/30 dark:bg-slate/30 dark:hover:bg-slate/40'
                    : 'bg-primary hover:bg-primary-dark text-surface-light'
                ]"
              >
                {{ collage.isGalleryImageSelected(previewImage.id) ? t('gallery.deselectImage') : t('gallery.selectImage') }}
              </button>
              <button
                @click="collage.deselectAllGalleryImages(); collage.toggleGallerySelection(previewImage.id); collage.addSelectedGalleryToCanvas(); closePreview()"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-accent hover:bg-accent-dark text-slate-dark transition-colors"
              >
                {{ t('gallery.addThisToCanvas') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
