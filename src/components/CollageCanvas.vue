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
const shiftPressed = ref(false)
const initialAspectRatio = ref(1)

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

watch(() => [collage.images, collage.texts, collage.settings, collage.selectedImageId, collage.selectedTextId], () => {
  nextTick(() => renderCanvas())
}, { deep: true })

function getContrastColor(hexColor: string): string {
  // Konvertiere Hex zu RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Berechne Helligkeit (Luminanz)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Rückgabe einer kontrastierenden Farbe (dunkel für helle Hintergründe, hell für dunkle)
  return luminance > 0.5 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
}

function drawGrid() {
  if (!canvas.value || !ctx || !collage.settings.gridEnabled) return

  const gridSize = collage.settings.gridSize
  const width = canvas.value.width
  const height = canvas.value.height

  // Bestimme die Grid-Farbe basierend auf dem Hintergrund
  const gridColor = getContrastColor(collage.settings.backgroundColor)

  ctx.save()
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])

  // Vertikale Linien
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Horizontale Linien
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.restore()
}

async function renderCanvas() {
  if (!canvas.value || !ctx) return

  canvas.value.width = collage.settings.width
  canvas.value.height = collage.settings.height

  // Background
  ctx.fillStyle = collage.settings.backgroundColor
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // Grid zeichnen (nach Hintergrund, vor Bildern)
  drawGrid()

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

    // Schatten anwenden, wenn aktiviert
    if (img.shadowEnabled) {
      ctx.shadowOffsetX = img.shadowOffsetX
      ctx.shadowOffsetY = img.shadowOffsetY
      ctx.shadowBlur = img.shadowBlur
      ctx.shadowColor = img.shadowColor
    }

    ctx.drawImage(htmlImg, -img.width / 2, -img.height / 2, img.width, img.height)

    // Schatten zurücksetzen für weitere Zeichnungen
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'

    // Highlight für selektiertes Bild
    if (collage.selectedImageId === img.id) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.strokeRect(-img.width / 2, -img.height / 2, img.width, img.height)

      // Resize-Handles zeichnen (größer und besser sichtbar)
      const handleSize = 16
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

      // Zeichne Handles mit weißem Rand für bessere Sichtbarkeit
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      handles.forEach(handle => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        )
        ctx.strokeRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        )
      })
    }

    ctx.restore()
  }

  // Texte zeichnen (nach Bildern, sortiert nach zIndex)
  for (const text of [...collage.texts].sort((a, b) => a.zIndex - b.zIndex)) {
    ctx.save()
    ctx.translate(text.x, text.y)
    ctx.rotate((text.rotation * Math.PI) / 180)

    // Schatten anwenden, wenn aktiviert
    if (text.shadowEnabled) {
      ctx.shadowOffsetX = text.shadowOffsetX
      ctx.shadowOffsetY = text.shadowOffsetY
      ctx.shadowBlur = text.shadowBlur
      ctx.shadowColor = text.shadowColor
    }

    // Text-Styling
    ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
    ctx.fillStyle = text.color
    ctx.textAlign = text.textAlign
    ctx.textBaseline = 'middle'

    // Multi-line Text-Rendering
    const lines = text.text.split('\n')
    const lineHeight = text.fontSize * 1.2
    const totalHeight = lines.length * lineHeight

    lines.forEach((line, index) => {
      const y = (index - (lines.length - 1) / 2) * lineHeight
      ctx.fillText(line, 0, y)
    })

    // Schatten zurücksetzen
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'

    // Highlight für selektierten Text
    if (collage.selectedTextId === text.id) {
      // Berechne Text-Bounding-Box
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width))
      const boxWidth = maxWidth
      const boxHeight = totalHeight

      let offsetX = 0
      if (text.textAlign === 'center') offsetX = -boxWidth / 2
      else if (text.textAlign === 'right') offsetX = -boxWidth

      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(offsetX - 5, -boxHeight / 2 - 5, boxWidth + 10, boxHeight + 10)
    }

    ctx.restore()
  }
}

function getResizeHandle(x: number, y: number, img: any): string | null {
  const handleSize = 16
  const hitRadius = handleSize // Größerer Hit-Bereich
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

  // Prüfe jedes Handle
  for (const handle of handles) {
    const distance = Math.sqrt(
      Math.pow(rotatedX - handle.x, 2) + Math.pow(rotatedY - handle.y, 2)
    )
    if (distance <= hitRadius) {
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
      shiftPressed.value = e.shiftKey
      initialAspectRatio.value = selectedImg.width / selectedImg.height
      return
    }
  }

  // Finde angeklickten Text (von oben nach unten, höchster zIndex zuerst)
  const clickedText = [...collage.texts]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(text => {
      if (!ctx) return false

      ctx.save()
      ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
      ctx.textAlign = text.textAlign

      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2
      const totalHeight = lines.length * lineHeight
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width))

      let offsetX = 0
      if (text.textAlign === 'center') offsetX = -maxWidth / 2
      else if (text.textAlign === 'right') offsetX = -maxWidth

      const boxX = text.x + offsetX - 5
      const boxY = text.y - totalHeight / 2 - 5
      const boxWidth = maxWidth + 10
      const boxHeight = totalHeight + 10

      ctx.restore()

      return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight
    })

  if (clickedText) {
    collage.selectText(clickedText.id)
    isDragging.value = true
    dragStartPos.value = { x, y }
    dragImageStart.value = { x: clickedText.x, y: clickedText.y }
    return
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
    collage.selectText(null)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  if ((!collage.selectedImageId && !collage.selectedTextId) || (!isDragging.value && !isResizing.value)) return

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  // Text-Drag-Funktionalität
  if (isDragging.value && collage.selectedTextId && collage.selectedText) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y
    collage.updateText(collage.selectedText.id, {
      x: dragImageStart.value.x + dx,
      y: dragImageStart.value.y + dy
    })
    return
  }

  if (isResizing.value && resizeHandle.value) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y
    // Verwende den Lock aus dem Store, aber Shift-Taste kann es temporär überschreiben
    const keepAspectRatio = e.shiftKey ? !collage.lockAspectRatio : collage.lockAspectRatio

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
        if (keepAspectRatio) {
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
          newWidth = resizeStart.value.width * avgChange
          newHeight = resizeStart.value.height * avgChange
          newX = resizeStart.value.x + (resizeStart.value.width - newWidth)
          newY = resizeStart.value.y + (resizeStart.value.height - newHeight)
        }
        break
      case 'n':
        newHeight = resizeStart.value.height - dy
        newY = resizeStart.value.y + dy
        if (keepAspectRatio) {
          newWidth = newHeight * initialAspectRatio.value
          newX = resizeStart.value.x - (newWidth - resizeStart.value.width) / 2
        }
        break
      case 'ne':
        newWidth = resizeStart.value.width + dx
        newHeight = resizeStart.value.height - dy
        newY = resizeStart.value.y + dy
        if (keepAspectRatio) {
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
          newWidth = resizeStart.value.width * avgChange
          newHeight = resizeStart.value.height * avgChange
          newY = resizeStart.value.y + (resizeStart.value.height - newHeight)
        }
        break
      case 'e':
        newWidth = resizeStart.value.width + dx
        if (keepAspectRatio) {
          newHeight = newWidth / initialAspectRatio.value
          newY = resizeStart.value.y - (newHeight - resizeStart.value.height) / 2
        }
        break
      case 'se':
        newWidth = resizeStart.value.width + dx
        newHeight = resizeStart.value.height + dy
        if (keepAspectRatio) {
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
          newWidth = resizeStart.value.width * avgChange
          newHeight = resizeStart.value.height * avgChange
        }
        break
      case 's':
        newHeight = resizeStart.value.height + dy
        if (keepAspectRatio) {
          newWidth = newHeight * initialAspectRatio.value
          newX = resizeStart.value.x - (newWidth - resizeStart.value.width) / 2
        }
        break
      case 'sw':
        newWidth = resizeStart.value.width - dx
        newHeight = resizeStart.value.height + dy
        newX = resizeStart.value.x + dx
        if (keepAspectRatio) {
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
          newWidth = resizeStart.value.width * avgChange
          newHeight = resizeStart.value.height * avgChange
          newX = resizeStart.value.x + (resizeStart.value.width - newWidth)
        }
        break
      case 'w':
        newWidth = resizeStart.value.width - dx
        newX = resizeStart.value.x + dx
        if (keepAspectRatio) {
          newHeight = newWidth / initialAspectRatio.value
          newY = resizeStart.value.y - (newHeight - resizeStart.value.height) / 2
        }
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

  // Berechne die Drop-Position relativ zum Canvas
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = collage.settings.width / rect.width
  const scaleY = collage.settings.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  // Dupliziere das Bild an der Drop-Position
  collage.duplicateImageToPosition(imageId, x, y)
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
      @dragover="handleDragOver"
      @drop="handleDrop"
      class="max-w-full max-h-full shadow-lg cursor-move"
      style="image-rendering: high-quality;"
    />
  </div>
</template>
