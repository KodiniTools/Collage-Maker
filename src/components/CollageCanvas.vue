<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCollageStore } from '@/stores/collage'
  import { useCanvasPan } from '@/composables/useCanvasPan'
  import { useAlignmentGuides } from '@/composables/useAlignmentGuides'
  import { useCanvasRenderer } from '@/composables/useCanvasRenderer'
  import { useDragResize } from '@/composables/useDragResize'
  import QuickActionToolbar from '@/components/QuickActionToolbar.vue'
  import { UiButton, UiIconButton } from '@/components/ui'

  const { t } = useI18n()
  const collage = useCollageStore()
  const canvas = ref<HTMLCanvasElement | null>(null)
  const container = ref<HTMLDivElement | null>(null)

  // Bilder auf dem Canvas (ohne Galerie-Templates). Die Zoom-Steuerung ist
  // nur sinnvoll, sobald mindestens ein Bild platziert wurde.
  const hasCanvasImages = computed(() =>
    collage.images.some((img) => img.isGalleryTemplate !== true)
  )

  // Zoom-Steuerung (Schrittweite 25 %)
  const ZOOM_STEP = 0.25
  function zoomBy(delta: number) {
    collage.setCanvasZoom(Math.round((collage.canvasZoom + delta) * 100) / 100)
  }

  const { autoFitScale, panOffset, spacePressed } = useCanvasPan(container)
  const { activeGuides, detectAlignments, detectResizeAlignments, drawGuides } =
    useAlignmentGuides()
  const { getCtx } = useCanvasRenderer(canvas, drawGuides, autoFitScale)
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cursorStyle,
  } = useDragResize(
    canvas,
    autoFitScale,
    panOffset,
    spacePressed,
    { activeGuides, detectAlignments, detectResizeAlignments },
    getCtx,
    showPreviewAt
  )

  // Image preview overlay on double-click / double-tap
  const previewUrl = ref<string | null>(null)

  function showPreviewAt(clientX: number, clientY: number) {
    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    const zoom = autoFitScale.value
    const x = (clientX - rect.left) / zoom
    const y = (clientY - rect.top) / zoom

    const hit = [...collage.images]
      .filter((img) => img.isGalleryTemplate !== true)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height)

    if (hit) previewUrl.value = hit.url
  }

  function handleDblClick(e: MouseEvent) {
    showPreviewAt(e.clientX, e.clientY)
  }

  function closePreview() {
    previewUrl.value = null
  }

  // Drag-Drop Funktionalität für Bilder aus der Galerie
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()

    if (!canvas.value || !e.dataTransfer) return

    const imageId = e.dataTransfer.getData('imageId')
    if (!imageId) return

    // Berechne die Drop-Position relativ zum Canvas (mit Auto-Fit-Zoom)
    const rect = canvas.value.getBoundingClientRect()
    const zoom = autoFitScale.value
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Dupliziere das Bild an der Drop-Position
    collage.duplicateImageToPosition(imageId, x, y)
  }
</script>

<template>
  <div
    ref="container"
    class="group w-full bg-surface-2 rounded-md p-4 relative flex items-center justify-center transition-all duration-slow"
    :style="{
      height: 'calc(100vh - 12rem)',
      overflow: 'hidden',
    }"
  >
    <!-- Zoom-Steuerung: nur aktiv, sobald Bilder auf dem Canvas liegen;
         auf Zeigegeräten erst bei Mouse-Over (oder Tastaturfokus) eingeblendet -->
    <div
      v-if="hasCanvasImages"
      class="zoom-control absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-surface-1 border border-line text-ink rounded-md shadow-overlay px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
    >
      <UiIconButton
        :label="t('shortcuts.zoomOut')"
        size="sm"
        :disabled="collage.canvasZoom <= 0.25"
        @click="zoomBy(-ZOOM_STEP)"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M20 12H4" />
        </svg>
      </UiIconButton>
      <UiButton
        variant="ghost"
        size="sm"
        class="min-w-[3.25rem] tabular-nums"
        :title="t('shortcuts.resetZoom')"
        :aria-label="t('shortcuts.resetZoom')"
        @click="collage.resetCanvasView()"
      >
        {{ Math.round(collage.canvasZoom * 100) }}%
      </UiButton>
      <UiIconButton
        :label="t('shortcuts.zoomIn')"
        size="sm"
        :disabled="collage.canvasZoom >= 4"
        @click="zoomBy(ZOOM_STEP)"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M12 4v16m8-8H4" />
        </svg>
      </UiIconButton>
    </div>
    <!-- Pan hint when zoomed -->
    <div
      v-if="collage.canvasZoom > 1"
      class="absolute top-2 left-2 z-10 bg-surface-1 border border-line text-ink-2 text-xs px-2 py-1 rounded-sm pointer-events-none"
    >
      <span class="hidden sm:inline">Space + Drag / Arrows to pan</span>
      <span class="sm:hidden">2 Finger zum Verschieben</span>
    </div>
    <!-- Canvas Wrapper - centered with auto-fit scaling and pan offset -->
    <div
      class="flex items-center justify-center transition-transform"
      :style="{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
      }"
    >
      <canvas
        ref="canvas"
        tabindex="-1"
        data-collage-canvas
        class="outline-none transition-transform"
        :style="{
          transform: `scale(${autoFitScale})`,
          transformOrigin: 'center center',
          cursor: spacePressed && collage.canvasZoom > 1 ? 'grab' : cursorStyle,
          touchAction: 'none',
          borderRadius: `${collage.settings.cornerRadius}px`,
        }"
        style="image-rendering: high-quality"
        @mousedown.prevent="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @dblclick="handleDblClick"
        @dragover="handleDragOver"
        @drop="handleDrop"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      />
    </div>

    <!-- Quick-Action-Toolbar: schwebt direkt am ausgewählten Bild/Text -->
    <QuickActionToolbar
      :canvas-el="canvas"
      :container-el="container"
      :auto-fit-scale="autoFitScale"
      :pan-offset="panOffset"
    />
  </div>

  <!-- Image Preview Overlay -->
  <Teleport to="#modal-portal">
    <Transition name="preview-fade">
      <div
        v-if="previewUrl"
        class="fixed inset-0 z-backdrop flex items-center justify-center bg-black/50"
        @click.self="closePreview"
        @keydown.esc="closePreview"
      >
        <div class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
          <!-- Close button -->
          <UiIconButton
            :label="t('common.close')"
            variant="secondary"
            round
            class="absolute -top-4 -right-4 z-10"
            @click="closePreview"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </UiIconButton>
          <!-- Image -->
          <img
            :src="previewUrl"
            class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-overlay"
            :alt="t('gallery.preview')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .preview-fade-enter-active,
  .preview-fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .preview-fade-enter-from,
  .preview-fade-leave-to {
    opacity: 0;
  }

  /* Auf Geräten ohne Hover (Touch) lässt sich die Zoom-Steuerung nicht per
   Mouse-Over einblenden – dort bleibt sie dauerhaft sichtbar. */
  @media (hover: none) {
    .zoom-control {
      opacity: 1;
    }
  }
</style>
