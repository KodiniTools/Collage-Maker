<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCollageStore } from '@/stores/collage'

const collage = useCollageStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const dragImageStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

let ctx: CanvasRenderingContext2D | null = null
const loadedImages = new Map<string, HTMLImageElement>()

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    renderCanvas()
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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

      // Resize-Handles zeichnen
      const handleSize = 10
      const handles = [
        { x: -img.width / 2, y: -img.height / 2, cursor: 'nw' }, // top-left
        { x: 0, y: -img.height / 2, cursor: 'n' }, // top-center
        { x: img.width / 2, y: -img.height / 2, cursor: 'ne' }, // top-right
        { x: img.width / 2, y: 0, cursor: 'e' }, // middle-right
        { x: img.width / 2, y: img.height / 2, cursor: 'se' }, // bottom-right
        { x: 0, y: img.height / 2, cursor: 's' }, // bottom-center
        { x: -img.width / 2, y: img.height / 2, cursor: 'sw' }, // bottom-left
        { x: -img.width / 2, y: 0, cursor: 'w' }, // middle-left
      ]

      ctx.fillStyle = '#3b82f6'
      handles.forEach(handle => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        )
      })
    }

    ctx.restore()
  }
}

function getResizeHandle(x: number, y: number, img: any): string | null {
  const handleSize = 10
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2

  // Transform click point to image coordinate system (considering rotation)
  const angle = (img.rotation * Math.PI) / 180
  const dx = x - centerX
  const dy = y - centerY
  const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
  const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

  const handles = [
    { x: -img.width / 2, y: -img.height / 2, name: 'nw' },
    { x: 0, y: -img.height / 2, name: 'n' },
    { x: img.width / 2, y: -img.height / 2, name: 'ne' },
    { x: img.width / 2, y: 0, name: 'e' },
    { x: img.width / 2, y: img.height / 2, name: 'se' },
    { x: 0, y: img.height / 2, name: 's' },
    { x: -img.width / 2, y: img.height / 2, name: 'sw' },
    { x: -img.width / 2, y: 0, name: 'w' },
  ]

  for (const handle of handles) {
    const distance = Math.sqrt(
      Math.pow(rotatedX - handle.x, 2) + Math.pow(rotatedY - handle.y, 2)
    )
    if (distance <= handleSize) {
      return handle.name
    }
  }

  return null
}

function handleMouseDown(e: MouseEvent) {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  // Prüfe ob ein Resize-Handle des ausgewählten Bildes angeklickt wurde
  const selectedImg = collage.selectedImage
  if (selectedImg) {
    const handle = getResizeHandle(x, y, selectedImg)
    if (handle) {
      isResizing.value = true
      resizeHandle.value = handle
      dragStartPos.value = { x, y }
      resizeStart.value = {
        x: selectedImg.x,
        y: selectedImg.y,
        width: selectedImg.width,
        height: selectedImg.height
      }
      return
    }
  }

  // Finde angeklicktes Bild (von oben nach unten)
  const clickedImage = [...collage.images]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(img =>
      x >= img.x && x <= img.x + img.width &&
      y >= img.y && y <= img.y + img.height
    )

  if (clickedImage) {
    collage.selectImage(clickedImage.id)
    isDragging.value = true
    dragStartPos.value = { x, y }
    dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
  } else {
    collage.selectImage(null)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!canvas.value || !collage.selectedImageId) return
  if (!isDragging.value && !isResizing.value) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  if (isResizing.value && resizeHandle.value) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y

    let newWidth = resizeStart.value.width
    let newHeight = resizeStart.value.height
    let newX = resizeStart.value.x
    let newY = resizeStart.value.y

    // Berechne neue Größe basierend auf dem Handle
    switch (resizeHandle.value) {
      case 'nw':
        newWidth = resizeStart.value.width - dx
        newHeight = resizeStart.value.height - dy
        newX = resizeStart.value.x + dx
        newY = resizeStart.value.y + dy
        break
      case 'n':
        newHeight = resizeStart.value.height - dy
        newY = resizeStart.value.y + dy
        break
      case 'ne':
        newWidth = resizeStart.value.width + dx
        newHeight = resizeStart.value.height - dy
        newY = resizeStart.value.y + dy
        break
      case 'e':
        newWidth = resizeStart.value.width + dx
        break
      case 'se':
        newWidth = resizeStart.value.width + dx
        newHeight = resizeStart.value.height + dy
        break
      case 's':
        newHeight = resizeStart.value.height + dy
        break
      case 'sw':
        newWidth = resizeStart.value.width - dx
        newHeight = resizeStart.value.height + dy
        newX = resizeStart.value.x + dx
        break
      case 'w':
        newWidth = resizeStart.value.width - dx
        newX = resizeStart.value.x + dx
        break
    }

    // Mindestgröße von 20px
    if (newWidth >= 20 && newHeight >= 20) {
      collage.updateImage(collage.selectedImageId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
    }
  } else if (isDragging.value) {
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
  resizeHandle.value = null
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && collage.selectedImageId) {
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
  <div ref="container" class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
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
