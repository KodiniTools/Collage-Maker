<script setup lang="ts">
  /**
   * Bilderliste (Galerie). Die Logik liegt in `useImageList`, die Teile unter
   * `components/image-list/`.
   */
  import { useI18n } from 'vue-i18n'
  import { useImageList } from '@/composables/useImageList'
  import { UiEmptyState, UiPanel } from '@/components/ui'
  import ImageListItem from './image-list/ImageListItem.vue'
  import ImageSelectionBar from './image-list/ImageSelectionBar.vue'
  import ImagePreviewModal from './image-list/ImagePreviewModal.vue'
  import ImageDeleteDialog from './image-list/ImageDeleteDialog.vue'

  const { t } = useI18n()
  const api = useImageList()
  const { galleryImages } = api
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
        <ImageListItem v-for="image in galleryImages" :key="image.id" :api="api" :image="image" />
      </div>

      <!-- Auswahl-Aktionen bzw. „Alle auswählen" (below list to prevent jumping) -->
      <ImageSelectionBar :api="api" />
    </template>

    <!-- Image Preview Modal -->
    <ImagePreviewModal :api="api" />

    <!-- Delete Confirmation -->
    <ImageDeleteDialog :api="api" />
  </UiPanel>
</template>
