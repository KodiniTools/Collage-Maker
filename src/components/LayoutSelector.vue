<script setup lang="ts">
import { computed } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'
import type { LayoutType } from '@/types'

const collage = useCollageStore()
const { t } = useI18n()

const layouts: { value: LayoutType; labelKey: string }[] = [
  { value: 'freestyle', labelKey: 'layout.freestyle' },
  { value: 'grid-2x2', labelKey: 'layout.grid2x2' },
  { value: 'grid-3x3', labelKey: 'layout.grid3x3' },
  { value: 'grid-2x3', labelKey: 'layout.grid2x3' },
  { value: 'magazine', labelKey: 'layout.magazine' },
  { value: 'spotlight', labelKey: 'layout.spotlight' },
  { value: 'hero', labelKey: 'layout.hero' },
  { value: 'sidebar', labelKey: 'layout.sidebar' },
  { value: 'mosaic', labelKey: 'layout.mosaic' },
  { value: 'diagonal', labelKey: 'layout.diagonal' },
  { value: 'panorama', labelKey: 'layout.panorama' },
  { value: 'focus', labelKey: 'layout.focus' },
  { value: 'triptych', labelKey: 'layout.triptych' },
  { value: 'masonry', labelKey: 'layout.masonry' }
]

// Anzahl ausgewählter Galerie-Bilder
const selectedGalleryCount = computed(() => collage.selectedGalleryIds.length)

// Anzahl Canvas-Bilder
const canvasImageCount = computed(() =>
  collage.images.filter(img => img.isGalleryTemplate !== true).length
)

function selectLayout(layout: LayoutType) {
  // Wenn Galerie-Bilder ausgewählt sind, füge sie zuerst zum Canvas hinzu
  if (selectedGalleryCount.value > 0) {
    collage.addSelectedGalleryToCanvas()
  }
  // Dann Layout anwenden
  collage.applyLayout(layout)
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('layout.title') }}</h2>

    <!-- Info wenn Galerie-Bilder ausgewählt -->
    <div
      v-if="selectedGalleryCount > 0"
      class="mb-3 p-2 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/30 text-xs"
    >
      <p class="font-medium text-accent-dark dark:text-accent">
        {{ t('layout.withSelectedImages', { count: selectedGalleryCount }) }}
      </p>
    </div>

    <!-- Info wenn keine Bilder zum Layouten -->
    <div
      v-else-if="canvasImageCount === 0"
      class="mb-3 p-2 bg-muted/10 dark:bg-slate/20 rounded-lg text-xs text-muted"
    >
      {{ t('layout.noImages') }}
    </div>

    <div class="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1" role="group" aria-label="Layout options">
      <button
        v-for="layout in layouts"
        :key="layout.value"
        @click="selectLayout(layout.value)"
        :class="[
          'p-3 rounded-lg border-2 transition-colors duration-150 text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 dark:focus:ring-offset-surface-dark',
          collage.settings.layout === layout.value
            ? 'border-accent bg-accent/10 dark:bg-accent/5 text-slate-dark dark:text-muted-light'
            : 'border-muted/50 dark:border-slate hover:border-accent'
        ]"
        :aria-pressed="collage.settings.layout === layout.value"
      >
        {{ t(layout.labelKey) }}
      </button>
    </div>
  </div>
</template>
