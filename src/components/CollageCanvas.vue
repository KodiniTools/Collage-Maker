<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useCollageStore } from '@/stores/collage'

const collage = useCollageStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragImageStart = ref({ x: 0, y: 0 })

let ctx: CanvasRenderingContext2D | null = null
const loadedImages = new Map<string, HTMLImageElement>()

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
    }
    
    ctx.restore()
  }
}

function handleMouseDown(e: MouseEvent) {
  if (!canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

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
  if (!isDragging.value || !collage.selectedImageId || !canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const dx = x - dragStartPos.value.x
  const dy = y - dragStartPos.value.y

  collage.updateImage(collage.selectedImageId, {
    x: dragImageStart.value.x + dx,
    y: dragImageStart.value.y + dy
  })
}

function handleMouseUp() {
  isDragging.value = false
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
