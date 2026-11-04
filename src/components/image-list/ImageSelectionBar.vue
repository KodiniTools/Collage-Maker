<script setup lang="ts">
  /** Aktionsleiste unter der Liste: Auswahl-Aktionen bzw. „Alle auswählen". */
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import type { ImageListApi } from '@/composables/useImageList'

  const props = defineProps<{ api: ImageListApi }>()
  const { t } = useI18n()
  const {
    collage,
    selectedCount,
    setSelectedAsBackground,
    requestDeleteSelected,
    toggleSelectAll,
  } = props.api
</script>

<template>
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
