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
  const { renderCanvas, getCtx } = useCanvasRenderer(canvas, drawGuides)
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDragResize(
    canvas,
    autoFitScale,
    panOffset,
    spacePressed,
    { activeGuides, detectAlignments, detectResizeAlignments },
    getCtx
  )

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
      Space + Drag / Arrows to pan
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
        :class="spacePressed && collage.canvasZoom > 1 ? 'cursor-grab' : 'cursor-move'"
        :style="{
          transform: `scale(${autoFitScale})`,
          transformOrigin: 'center center',
        }"
        style="image-rendering: high-quality"
        @mousedown.prevent="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @dragover="handleDragOver"
        @drop="handleDrop"
      />
    </div>
  </div>
</template>
