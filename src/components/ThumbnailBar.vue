<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCollageStore } from '@/stores/collage'

  const { t } = useI18n()
  const collage = useCollageStore()

  // Nur Canvas-Bilder anzeigen (keine Gallery-Templates)
  const canvasImages = computed(() =>
    collage.images.filter((img) => img.isGalleryTemplate !== true)
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
    class="bg-surface-light dark:bg-surface-dark border-b border-muted/30 dark:border-slate/30 py-1.5 px-2 sm:py-2 sm:px-3"
  >
    <!-- Header: Label + Auswahl-Info (scrollt nicht mit den Thumbnails) -->
    <div class="flex items-center justify-between gap-2 mb-1.5">
      <span class="text-xs text-muted dark:text-muted-light font-medium truncate">
        {{ t('thumbnailBar.title') }} ({{ canvasImages.length }})
      </span>

      <div
        v-if="collage.selectedImageIds.length > 0"
        class="shrink-0 flex items-center gap-2"
      >
        <span class="text-xs text-muted dark:text-muted-light whitespace-nowrap">
          {{ t('thumbnailBar.selected', { count: collage.selectedImageIds.length }) }}
        </span>
        <button
          class="text-xs text-primary hover:text-primary-dark transition-colors whitespace-nowrap"
          @click="collage.deselectAllImages()"
        >
          {{ t('thumbnailBar.deselectAll') }}
        </button>
      </div>
    </div>

    <!-- Thumbnails: eigene horizontale Scroll-Zeile mit genug Abstand,
         damit die Ecken-Badges nicht die Nachbarn überdecken -->
    <div class="flex gap-3 items-center overflow-x-auto scrollbar-thin px-1 py-1">
      <div
        v-for="(img, index) in canvasImages"
        :key="img.id"
        class="relative group shrink-0 cursor-pointer rounded transition-all duration-150"
        :class="{
          'ring-2 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark':
            collage.isImageSelected(img.id),
          'hover:ring-2 hover:ring-muted/50': !collage.isImageSelected(img.id),
        }"
        :title="t('thumbnailBar.clickToSelect')"
        @click="handleThumbnailClick(img.id, $event)"
      >
        <!-- Thumbnail Image -->
        <img
          :src="img.url"
          :alt="t('thumbnailBar.imageAlt', { index: index + 1 })"
          class="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded"
          :style="{
            transform: `rotate(${img.rotation}deg)`,
            opacity: img.opacity,
          }"
        />

        <!-- Index Badge -->
        <span
          class="absolute -top-1 -left-1 w-4 h-4 bg-slate-dark dark:bg-muted-light text-surface-light dark:text-slate-dark text-[10px] font-bold rounded-full flex items-center justify-center ring-1 ring-surface-light dark:ring-surface-dark"
        >
          {{ index + 1 }}
        </span>

        <!-- Selection Checkmark -->
        <div
          v-if="collage.isImageSelected(img.id)"
          class="absolute -top-1 -right-1 w-4 h-4 bg-primary text-surface-light rounded-full flex items-center justify-center ring-1 ring-surface-light dark:ring-surface-dark"
        >
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <!-- Remove Button (on hover) -->
        <button
          class="absolute -bottom-1 -right-1 w-4 h-4 bg-warm hover:bg-warm-dark text-surface-light rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex ring-1 ring-surface-light dark:ring-surface-dark"
          :title="t('thumbnailBar.remove')"
          @click="handleRemove(img.id, $event)"
        >
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
    height: 6px;
  }

  @media (pointer: fine) {
    .scrollbar-thin::-webkit-scrollbar {
      height: 4px;
    }
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
