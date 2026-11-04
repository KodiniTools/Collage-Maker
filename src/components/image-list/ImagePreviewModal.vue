<script setup lang="ts">
  /** Bildvorschau per Doppelklick (breit, deshalb kein UiDialog). */
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiIconButton } from '@/components/ui'
  import { formatFileSize, getFileExtension } from '@/utils/fileInfo'
  import type { ImageListApi } from '@/composables/useImageList'

  const props = defineProps<{ api: ImageListApi }>()
  const { t } = useI18n()
  const {
    collage,
    showPreview,
    previewImage,
    closePreview,
    onImageLoad,
    dimensionsText,
    toggleSelectionAndClose,
    addToCanvasAndClose,
    setAsBackgroundAndClose,
  } = props.api
</script>

<template>
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
</template>
