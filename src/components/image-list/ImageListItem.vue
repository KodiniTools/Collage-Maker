<script setup lang="ts">
  /** Ein Eintrag der Bilderliste: Auswahl, Drag & Drop, Doppelklick-Vorschau, Löschen. */
  import { useI18n } from 'vue-i18n'
  import { UiIconButton } from '@/components/ui'
  import { formatFileSize } from '@/utils/fileInfo'
  import type { CollageImage } from '@/types'
  import type { ImageListApi } from '@/composables/useImageList'

  const props = defineProps<{ api: ImageListApi; image: CollageImage }>()
  const { t } = useI18n()
  const {
    collage,
    handleDragStart,
    handleImageClick,
    handleDoubleClick,
    onItemTouchStart,
    onItemTouchMove,
    onItemTouchEnd,
    onImageLoad,
    dimensionsText,
    requestDelete,
  } = props.api
</script>

<template>
  <div
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
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
        }}<template v-if="dimensionsText(image.id)"> • {{ dimensionsText(image.id) }}</template>
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
</template>
