<script setup lang="ts">
  import { ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useCanvasPan } from '@/composables/useCanvasPan'
  import { useAlignmentGuides } from '@/composables/useAlignmentGuides'
  import { useCanvasRenderer } from '@/composables/useCanvasRenderer'
  import { useDragResize } from '@/composables/useDragResize'

  const collage = useCollageStore()
  const canvas = ref<HTMLCanvasElement | null>(null)
  const container = ref<HTMLDivElement | null>(null)

  const { autoFitScale, panOffset, spacePressed } = useCanvasPan(container)
  const { activeGuides, detectAlignments, detectResizeAlignments, drawGuides } = useAlignmentGuides()
  const { getCtx } = useCanvasRenderer(canvas, drawGuides)
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, cursorStyle } = useDragResize(
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
    class="w-full bg-muted/10 dark:bg-navy/30 rounded-lg p-4 relative flex items-center justify-center transition-all duration-300"
    :style="{
      height: 'calc(100vh - 12rem)',
      overflow: 'hidden',
    }"
  >
    <!-- Zoom Info-Badge -->
    <div
      v-if="collage.canvasZoom !== 1"
      class="absolute top-2 right-2 z-10 bg-slate-dark/80 text-surface-light text-xs px-2 py-1 rounded pointer-events-none"
    >
      {{ Math.round(collage.canvasZoom * 100) }}%
    </div>
    <!-- Pan hint when zoomed -->
    <div
      v-if="collage.canvasZoom > 1"
      class="absolute top-2 left-2 z-10 bg-slate-dark/80 text-surface-light text-xs px-2 py-1 rounded pointer-events-none"
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
        class="shadow-lg outline-none transition-transform duration-200"
        :style="{
          transform: `scale(${autoFitScale})`,
          transformOrigin: 'center center',
          cursor: spacePressed && collage.canvasZoom > 1 ? 'grab' : cursorStyle,
          touchAction: 'none',
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
  </div>

  <!-- Image Preview Overlay -->
  <Teleport to="#modal-portal">
    <Transition name="preview-fade">
      <div
        v-if="previewUrl"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click.self="closePreview"
        @keydown.esc="closePreview"
      >
        <div class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
          <!-- Close button -->
          <button
            class="absolute -top-4 -right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-colors shadow-lg"
            aria-label="Vorschau schliessen"
            @click="closePreview"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <!-- Image -->
          <img
            :src="previewUrl"
            class="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            alt="Bildvorschau"
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
</style>
