<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'
  import { useGalleryTouchDrag } from '@/composables/useGalleryTouchDrag'
  import { UiButton, UiDialog, UiEmptyState, UiIconButton, UiPanel } from '@/components/ui'

  const collage = useCollageStore()
  const { selectedGalleryIds, images } = storeToRefs(collage)
  const { t } = useI18n()

  // Touch-Drag vom Galerie-Eintrag auf das Canvas (Ersatz für HTML5-DnD auf Mobil)
  const { onItemTouchStart, onItemTouchMove, onItemTouchEnd } = useGalleryTouchDrag()

  // Preview Modal State
  const showPreview = ref(false)
  const previewImage = ref<CollageImage | null>(null)

  // Delete Confirmation State ('single' = einzelnes Bild, 'selected' = Mehrfachauswahl)
  const showDeleteConfirm = ref(false)
  const deleteMode = ref<'single' | 'selected'>('single')
  const imageToDelete = ref<CollageImage | null>(null)

  // „Nicht mehr fragen"-Einstellung (persistiert in localStorage)
  const SKIP_CONFIRM_KEY = 'collage-skip-gallery-delete-confirm'
  const skipDeleteConfirm = ref(localStorage.getItem(SKIP_CONFIRM_KEY) === 'true')
  const dontAskAgain = ref(false)

  // Anzahl der betroffenen Canvas-Instanzen (für den Hinweis im Dialog)
  const deleteInstanceCount = computed(() => {
    if (deleteMode.value === 'single') {
      return imageToDelete.value ? collage.countGalleryImageInstances(imageToDelete.value.id) : 0
    }
    return selectedGalleryIds.value.reduce(
      (sum, id) => sum + collage.countGalleryImageInstances(id),
      0
    )
  })

  // Stammt das Hintergrundbild der Leinwand aus den zu löschenden Bildern?
  const deleteAffectsBackground = computed(() => {
    if (deleteMode.value === 'single') {
      return imageToDelete.value ? collage.isGalleryImageBackground(imageToDelete.value.id) : false
    }
    return selectedGalleryIds.value.some((id) => collage.isGalleryImageBackground(id))
  })

  // Führt die eigentliche Löschung aus und zeigt einen „Rückgängig"-Toast.
  function performDelete(mode: 'single' | 'selected', image: CollageImage | null) {
    if (mode === 'single') {
      if (!image) return
      collage.removeGalleryImage(image.id)
      collage.showUndoToast('toast.imageDeleted')
    } else {
      const count = selectedCount.value
      collage.removeSelectedGalleryImages()
      collage.showUndoToast('toast.imagesDeleted', { count })
    }
  }

  function requestDelete(image: CollageImage) {
    if (skipDeleteConfirm.value) {
      performDelete('single', image)
      return
    }
    deleteMode.value = 'single'
    imageToDelete.value = image
    showDeleteConfirm.value = true
  }

  function requestDeleteSelected() {
    if (selectedCount.value === 0) return
    if (skipDeleteConfirm.value) {
      performDelete('selected', null)
      return
    }
    deleteMode.value = 'selected'
    imageToDelete.value = null
    showDeleteConfirm.value = true
  }

  function cancelDelete() {
    showDeleteConfirm.value = false
    imageToDelete.value = null
    dontAskAgain.value = false
  }

  function confirmDelete() {
    // „Nicht mehr fragen" persistieren, falls angehakt
    if (dontAskAgain.value) {
      skipDeleteConfirm.value = true
      localStorage.setItem(SKIP_CONFIRM_KEY, 'true')
    }
    performDelete(deleteMode.value, imageToDelete.value)
    cancelDelete()
  }

  // Nur Galerie-Templates anzeigen (keine Canvas-Instanzen)
  const galleryImages = computed(() => images.value.filter((img) => img.isGalleryTemplate === true))

  // Anzahl ausgewählter Galerie-Bilder
  const selectedCount = computed(() => selectedGalleryIds.value.length)

  // Sind alle Bilder ausgewählt?
  const allSelected = computed(
    () =>
      galleryImages.value.length > 0 &&
      galleryImages.value.every((img) => collage.isGalleryImageSelected(img.id))
  )

  function handleDragStart(event: DragEvent, imageId: string) {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('imageId', imageId)
    }
  }

  function handleImageClick(imageId: string, event: MouseEvent | KeyboardEvent) {
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

  function toggleSelectionAndClose() {
    if (previewImage.value) collage.toggleGallerySelection(previewImage.value.id)
    closePreview()
  }

  function addToCanvasAndClose() {
    if (!previewImage.value) return
    collage.deselectAllGalleryImages()
    collage.toggleGallerySelection(previewImage.value.id)
    collage.addSelectedGalleryToCanvas()
    closePreview()
  }

  function setAsBackgroundAndClose() {
    if (!previewImage.value) return
    collage.setBackgroundImage(previewImage.value.url)
    collage.selectBackground(true)
    closePreview()
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

  // Echte Pixelmaße direkt aus dem geladenen Bild lesen (nicht die
  // Canvas-Platzhaltergröße), damit die Originalauflösung angezeigt wird.
  const naturalDims = ref<Record<string, { w: number; h: number }>>({})

  function onImageLoad(id: string, event: Event) {
    const el = event.target as HTMLImageElement
    if (el.naturalWidth > 0) {
      naturalDims.value[id] = { w: el.naturalWidth, h: el.naturalHeight }
    }
  }

  function dimensionsText(id: string): string {
    const d = naturalDims.value[id]
    return d ? `${d.w} × ${d.h} px` : ''
  }

  function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase() || 'UNKNOWN'
  }

  function setSelectedAsBackground() {
    const selectedImage = images.value.find(
      (img) => img.isGalleryTemplate === true && selectedGalleryIds.value.includes(img.id)
    )
    if (selectedImage) {
      collage.setBackgroundImage(selectedImage.url)
      collage.deselectAllGalleryImages()
      collage.selectBackground(true) // Hintergrundbild nach dem Setzen auswählen
    }
  }
</script>

<template>
  <UiPanel :title="t('images.title')" :count="galleryImages.length">
    <UiEmptyState v-if="galleryImages.length === 0" :title="t('images.empty')" />

    <template v-else>
      <!-- Hint -->
      <p class="text-xs text-ink-3 mb-2">
        {{ t('gallery.hint') }}
      </p>

      <!-- Image List (always first to prevent jumping) -->
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="image in galleryImages"
          :key="image.id"
          draggable="true"
          tabindex="0"
          role="button"
          :aria-label="`${t('gallery.selectImage')}: ${image.file.name}`"
          :class="[
            'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
            'focus-visible:outline-none focus-visible:shadow-focus',
            collage.isGalleryImageSelected(image.id)
              ? 'bg-accent-soft ring-2 ring-accent'
              : 'hover:bg-surface-2',
          ]"
          :title="t('gallery.doubleClickHint')"
          style="touch-action: pan-y"
          @dragstart="handleDragStart($event, image.id)"
          @click="handleImageClick(image.id, $event)"
          @dblclick="handleDoubleClick(image)"
          @keydown.enter="handleImageClick(image.id, $event)"
          @touchstart.passive="onItemTouchStart($event, image.id)"
          @touchmove.passive="onItemTouchMove($event)"
          @touchend="onItemTouchEnd"
          @touchcancel="onItemTouchEnd"
        >
          <!-- Selection Checkbox -->
          <div
            :class="[
              'w-6 h-6 rounded-sm border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
              collage.isGalleryImageSelected(image.id)
                ? 'bg-accent border-accent text-on-accent'
                : 'border-line-strong hover:border-accent hover:bg-accent-soft',
            ]"
            @click.stop="collage.toggleGallerySelection(image.id)"
          >
            <svg
              v-if="collage.isGalleryImageSelected(image.id)"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <!-- Thumbnail with selection indicator -->
          <div class="relative">
            <img
              :src="image.url"
              :alt="image.file.name"
              class="w-12 h-12 object-cover rounded-sm"
              :class="{ 'ring-2 ring-accent': collage.isGalleryImageSelected(image.id) }"
              @load="onImageLoad(image.id, $event)"
            />
            <!-- Selection number badge -->
            <span
              v-if="collage.isGalleryImageSelected(image.id)"
              class="absolute -top-1 -right-1 w-4 h-4 bg-accent text-on-accent text-xs font-bold rounded-full flex items-center justify-center"
            >
              {{ collage.selectedGalleryIds.indexOf(image.id) + 1 }}
            </span>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ image.file.name }}</p>
            <p class="text-xs text-ink-2">
              {{ formatFileSize(image.file.size)
              }}<template v-if="dimensionsText(image.id)">
                • {{ dimensionsText(image.id) }}</template
              >
            </p>
          </div>

          <!-- Remove Button -->
          <UiIconButton :label="t('images.remove')" size="sm" @click.stop="requestDelete(image)">
            <svg class="text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </UiIconButton>
        </div>
      </div>

      <!-- Selection Action Bar (below list to prevent jumping) -->
      <div v-if="selectedCount > 0" class="mt-3 p-3 bg-accent-soft rounded-md border border-line">
        <p class="text-sm font-medium text-ink mb-2">
          {{ t('gallery.selectedInfo', { count: selectedCount }) }}
        </p>
        <div class="flex flex-col gap-2">
          <UiButton variant="primary" size="sm" block @click="collage.addSelectedGalleryToCanvas()">
            <template #icon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            {{ t('gallery.addSelectedToCanvas') }}
          </UiButton>

          <!-- Set as Background Button (only when 1 image selected) -->
          <UiButton
            v-if="selectedCount === 1"
            variant="secondary"
            size="sm"
            block
            @click="setSelectedAsBackground"
          >
            <template #icon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </template>
            {{ t('gallery.setAsBackground') }}
          </UiButton>

          <div class="flex gap-2">
            <UiButton variant="danger" size="sm" class="flex-1" @click="requestDeleteSelected">
              {{ t('gallery.deleteSelected', { count: selectedCount }) }}
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              class="flex-1"
              @click="collage.deselectAllGalleryImages()"
            >
              {{ t('gallery.deselectAll') }}
            </UiButton>
          </div>
        </div>
        <p class="text-xs text-ink-2 mt-2">
          {{ t('gallery.layoutHint') }}
        </p>
      </div>

      <!-- Select All Button (when nothing selected) -->
      <div v-else class="mt-3">
        <UiButton variant="secondary" size="sm" block @click="toggleSelectAll">
          {{ t('gallery.selectAll') }}
        </UiButton>
      </div>
    </template>

    <!-- Image Preview Modal (breit, deshalb kein UiDialog) -->
    <Teleport to="#modal-portal">
      <div
        v-if="showPreview && previewImage"
        class="fixed inset-0 z-backdrop flex items-center justify-center p-4 bg-black/50"
        @click.self="closePreview"
      >
        <div
          class="bg-surface-1 rounded-lg shadow-overlay max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-line"
        >
          <!-- Header -->
          <div class="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-line">
            <h3 class="text-lg font-semibold truncate text-ink">
              {{ t('gallery.preview') }}
            </h3>
            <UiIconButton :label="t('common.close')" size="sm" @click="closePreview">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiIconButton>
          </div>

          <!-- Image -->
          <div class="p-2 sm:p-4 flex justify-center bg-surface-2">
            <img
              :src="previewImage.url"
              :alt="previewImage.file.name"
              class="max-w-full max-h-[50vh] object-contain rounded-md"
              @load="onImageLoad(previewImage.id, $event)"
            />
          </div>

          <!-- Info -->
          <div class="p-3 sm:p-4 space-y-3">
            <!-- Filename -->
            <div>
              <p class="text-xs text-ink-2 uppercase tracking-wide mb-1">
                {{ t('gallery.previewTitle') }}
              </p>
              <p class="font-medium truncate text-ink">
                {{ previewImage.file.name }}
              </p>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4">
              <div class="text-center p-2 bg-surface-2 rounded-md">
                <p class="text-xs text-ink-2 uppercase tracking-wide mb-1">
                  {{ t('gallery.previewFormat') }}
                </p>
                <p class="font-semibold text-ink">
                  {{ getFileExtension(previewImage.file.name) }}
                </p>
              </div>
              <div class="text-center p-2 bg-surface-2 rounded-md">
                <p class="text-xs text-ink-2 uppercase tracking-wide mb-1">
                  {{ t('gallery.previewSize') }}
                </p>
                <p class="font-semibold text-ink">
                  {{ formatFileSize(previewImage.file.size) }}
                </p>
              </div>
              <div class="text-center p-2 bg-surface-2 rounded-md">
                <p class="text-xs text-ink-2 uppercase tracking-wide mb-1">
                  {{ t('gallery.previewDimensions') }}
                </p>
                <p class="font-semibold text-ink">
                  {{ dimensionsText(previewImage.id) || '…' }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 pt-2">
              <div class="flex gap-2">
                <UiButton variant="secondary" class="flex-1" @click="toggleSelectionAndClose">
                  {{
                    collage.isGalleryImageSelected(previewImage.id)
                      ? t('gallery.deselectImage')
                      : t('gallery.selectImage')
                  }}
                </UiButton>
                <UiButton variant="primary" class="flex-1" @click="addToCanvasAndClose">
                  {{ t('gallery.addThisToCanvas') }}
                </UiButton>
              </div>
              <UiButton variant="secondary" block @click="setAsBackgroundAndClose">
                <template #icon>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </template>
                {{ t('gallery.setAsBackground') }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <UiDialog
      teleport-to="#modal-portal"
      :open="showDeleteConfirm"
      :title="
        deleteMode === 'single'
          ? t('gallery.deleteConfirmTitle')
          : t('gallery.deleteSelectedConfirmTitle', { count: selectedCount })
      "
      :description="
        deleteMode === 'single'
          ? t('gallery.deleteConfirmMessage')
          : t('gallery.deleteSelectedConfirmMessage')
      "
      :close-label="t('common.close')"
      @close="cancelDelete"
    >
      <div class="space-y-3">
        <p v-if="deleteMode === 'single' && imageToDelete" class="text-sm text-ink break-words">
          {{ imageToDelete.file.name }}
        </p>
        <p v-if="deleteInstanceCount > 0" class="text-sm text-danger font-medium">
          {{ t('gallery.deleteConfirmOnCanvas', { count: deleteInstanceCount }) }}
        </p>
        <p v-if="deleteAffectsBackground" class="text-sm text-danger font-medium">
          {{ t('gallery.deleteConfirmBackground') }}
        </p>
        <label class="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
          <input
            v-model="dontAskAgain"
            type="checkbox"
            class="w-4 h-4 accent-accent cursor-pointer"
          />
          {{ t('gallery.dontAskAgain') }}
        </label>
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="cancelDelete">
          {{ t('gallery.deleteConfirmCancel') }}
        </UiButton>
        <UiButton variant="danger" @click="confirmDelete">
          {{ t('gallery.deleteConfirmConfirm') }}
        </UiButton>
      </template>
    </UiDialog>
  </UiPanel>
</template>
