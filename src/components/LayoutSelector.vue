<script setup lang="ts">
  import { computed } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import { UiCallout, UiPanel } from '@/components/ui'
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
    { value: 'masonry', labelKey: 'layout.masonry' },
  ]

  // Anzahl ausgewählter Galerie-Bilder
  const selectedGalleryCount = computed(() => collage.selectedGalleryIds.length)

  // Anzahl Canvas-Bilder
  const canvasImageCount = computed(
    () => collage.images.filter((img) => img.isGalleryTemplate !== true).length
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
  <UiPanel :title="t('layout.title')">
    <!-- Info wenn Galerie-Bilder ausgewählt -->
    <UiCallout v-if="selectedGalleryCount > 0" type="info" class="mb-3">
      {{ t('layout.withSelectedImages', { count: selectedGalleryCount }) }}
    </UiCallout>

    <!-- Info wenn keine Bilder zum Layouten -->
    <UiCallout v-else-if="canvasImageCount === 0" type="info" class="mb-3">
      {{ t('layout.noImages') }}
    </UiCallout>

    <div
      class="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[400px] overflow-y-auto pr-1"
      role="group"
      :aria-label="t('layout.title')"
    >
      <button
        v-for="layout in layouts"
        :key="layout.value"
        :class="[
          'p-3 rounded-md border transition-colors text-sm font-medium',
          'focus-visible:outline-none focus-visible:shadow-focus',
          collage.settings.layout === layout.value
            ? 'border-accent bg-accent-soft text-ink'
            : 'border-line-strong hover:border-accent',
        ]"
        :aria-pressed="collage.settings.layout === layout.value"
        @click="selectLayout(layout.value)"
      >
        {{ t(layout.labelKey) }}
      </button>
    </div>
  </UiPanel>
</template>
