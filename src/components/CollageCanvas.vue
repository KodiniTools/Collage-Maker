<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useCollageStore } from '@/stores/collage'

const collage = useCollageStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragImageStart = ref({ x: 0, y: 0, width: 0, height: 0, rotation: 0 })
const resizeHandle = ref<string>('')

let ctx: CanvasRenderingContext2D | null = null
const loadedImages = new Map<string, HTMLImageElement>()
const HANDLE_SIZE = 10
const ROTATION_HANDLE_OFFSET = 30

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    renderCanvas()
  }
})

watch(() => [collage.images, collage.settings], () => {
  nextTick(() => renderCanvas())
}, { deep: true })

async function renderCanvas() {
  if (!canvas.value || !ctx) return

  canvas.value.width = collage.settings.width
  canvas.value.height = collage.settings.height

  // Background
  ctx.fillStyle = collage.settings.backgroundColor
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // Bilder laden und zeichnen
  for (const img of [...collage.images].sort((a, b) => a.zIndex - b.zIndex)) {
    let htmlImg = loadedImages.get(img.id)

    if (!htmlImg) {
      htmlImg = new Image()
      htmlImg.src = img.url
      loadedImages.set(img.id, htmlImg)
      await new Promise((resolve) => {
        htmlImg!.onload = resolve
      })
    }

    ctx.save()
    ctx.translate(img.x + img.width / 2, img.y + img.height / 2)
    ctx.rotate((img.rotation * Math.PI) / 180)
    ctx.drawImage(htmlImg, -img.width / 2, -img.height / 2, img.width, img.height)

    // Highlight für selektiertes Bild
    if (collage.selectedImageId === img.id) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.strokeRect(-img.width / 2, -img.height / 2, img.width, img.height)

      // Resize-Handles (4 Ecken)
      const handles = [
        { x: -img.width / 2, y: -img.height / 2, cursor: 'nwse-resize' }, // top-left
        { x: img.width / 2, y: -img.height / 2, cursor: 'nesw-resize' },  // top-right
        { x: img.width / 2, y: img.height / 2, cursor: 'nwse-resize' },   // bottom-right
        { x: -img.width / 2, y: img.height / 2, cursor: 'nesw-resize' }   // bottom-left
      ]

      ctx.fillStyle = '#3b82f6'
      handles.forEach(handle => {
        ctx.fillRect(
          handle.x - HANDLE_SIZE / 2,
          handle.y - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        )
      })

      // Rotations-Handle (oben in der Mitte)
      ctx.beginPath()
      ctx.arc(0, -img.height / 2 - ROTATION_HANDLE_OFFSET, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

      // Linie zum Rotations-Handle
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, -img.height / 2)
      ctx.lineTo(0, -img.height / 2 - ROTATION_HANDLE_OFFSET)
      ctx.stroke()
    }

    ctx.restore()
  }
}

function getHandleAtPosition(img: any, x: number, y: number): string | null {
  // Transformiere Punkt in lokale Bildkoordinaten
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2
  const angle = (img.rotation * Math.PI) / 180

  // Rotiere Punkt zurück
  const cos = Math.cos(-angle)
  const sin = Math.sin(-angle)
  const dx = x - centerX
  const dy = y - centerY
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  const halfWidth = img.width / 2
  const halfHeight = img.height / 2
  const handleThreshold = HANDLE_SIZE * 1.5

  // Prüfe Rotations-Handle
  if (
    Math.abs(localX) < handleThreshold &&
    Math.abs(localY - (-halfHeight - ROTATION_HANDLE_OFFSET)) < handleThreshold
  ) {
    return 'rotate'
  }

  // Prüfe Resize-Handles
  const handles = [
    { name: 'nw', x: -halfWidth, y: -halfHeight },
    { name: 'ne', x: halfWidth, y: -halfHeight },
    { name: 'se', x: halfWidth, y: halfHeight },
    { name: 'sw', x: -halfWidth, y: halfHeight }
  ]

  for (const handle of handles) {
    if (
      Math.abs(localX - handle.x) < handleThreshold &&
      Math.abs(localY - handle.y) < handleThreshold
    ) {
      return handle.name
    }
  }

  return null
}

function isPointInImage(img: any, x: number, y: number): boolean {
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2
  const angle = (img.rotation * Math.PI) / 180

  const cos = Math.cos(-angle)
  const sin = Math.sin(-angle)
  const dx = x - centerX
  const dy = y - centerY
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  return (
    Math.abs(localX) <= img.width / 2 &&
    Math.abs(localY) <= img.height / 2
  )
}

function handleMouseDown(e: MouseEvent) {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  // Prüfe zuerst, ob ein Handle des selektierten Bildes angeklickt wurde
  if (collage.selectedImageId) {
    const selectedImg = collage.images.find(img => img.id === collage.selectedImageId)
    if (selectedImg) {
      const handle = getHandleAtPosition(selectedImg, x, y)
      if (handle) {
        if (handle === 'rotate') {
          isRotating.value = true
        } else {
          isResizing.value = true
          resizeHandle.value = handle
        }
        dragStartPos.value = { x, y }
        dragImageStart.value = {
          x: selectedImg.x,
          y: selectedImg.y,
          width: selectedImg.width,
          height: selectedImg.height,
          rotation: selectedImg.rotation
        }
        return
      }
    }
  }

  // Finde angeklicktes Bild (von oben nach unten)
  const clickedImage = [...collage.images]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(img => isPointInImage(img, x, y))

  if (clickedImage) {
    collage.selectImage(clickedImage.id)
    isDragging.value = true
    dragStartPos.value = { x, y }
    dragImageStart.value = {
      x: clickedImage.x,
      y: clickedImage.y,
      width: clickedImage.width,
      height: clickedImage.height,
      rotation: clickedImage.rotation
    }
  } else {
    collage.selectImage(null)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  if (!isDragging.value && !isResizing.value && !isRotating.value) return
  if (!collage.selectedImageId) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const selectedImg = collage.images.find(img => img.id === collage.selectedImageId)
  if (!selectedImg) return

  if (isRotating.value) {
    // Rotation
    const centerX = dragImageStart.value.x + dragImageStart.value.width / 2
    const centerY = dragImageStart.value.y + dragImageStart.value.height / 2
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90
    collage.updateImage(collage.selectedImageId, {
      rotation: angle
    })
  } else if (isResizing.value) {
    // Resizing
    const centerX = dragImageStart.value.x + dragImageStart.value.width / 2
    const centerY = dragImageStart.value.y + dragImageStart.value.height / 2
    const angle = (dragImageStart.value.rotation * Math.PI) / 180

    // Transformiere Mausposition in lokale Koordinaten
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const dx = x - centerX
    const dy = y - centerY
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos

    let newWidth = dragImageStart.value.width
    let newHeight = dragImageStart.value.height
    let newX = dragImageStart.value.x
    let newY = dragImageStart.value.y

    // Berechne neue Größe basierend auf Handle
    switch (resizeHandle.value) {
      case 'se': // bottom-right
        newWidth = Math.max(50, localX * 2)
        newHeight = Math.max(50, localY * 2)
        break
      case 'sw': // bottom-left
        newWidth = Math.max(50, -localX * 2)
        newHeight = Math.max(50, localY * 2)
        break
      case 'ne': // top-right
        newWidth = Math.max(50, localX * 2)
        newHeight = Math.max(50, -localY * 2)
        break
      case 'nw': // top-left
        newWidth = Math.max(50, -localX * 2)
        newHeight = Math.max(50, -localY * 2)
        break
    }

    // Berechne neue Position (Zentrum beibehalten)
    newX = centerX - newWidth / 2
    newY = centerY - newHeight / 2

    collage.updateImage(collage.selectedImageId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    })
  } else if (isDragging.value) {
    // Verschieben
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y

    collage.updateImage(collage.selectedImageId, {
      x: dragImageStart.value.x + dx,
      y: dragImageStart.value.y + dy
    })
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  resizeHandle.value = ''
}

function handleKeyDown(e: KeyboardEvent) {
  if (collage.selectedImageId && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault()
    collage.removeImage(collage.selectedImageId)
  }
}

// Cleanup
watch(() => collage.images, (newImages, oldImages) => {
  oldImages?.forEach(img => {
    if (!newImages.find(ni => ni.id === img.id)) {
      loadedImages.delete(img.id)
    }
  })
})
</script>

<template>
  <div
    ref="container"
    class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
    tabindex="0"
    @keydown="handleKeyDown"
  >
    <canvas
      ref="canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      class="max-w-full max-h-full shadow-lg cursor-move"
      style="image-rendering: high-quality;"
    />
  </div>
</template>
