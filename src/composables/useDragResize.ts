import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { GuideLine } from './useAlignmentGuides'

export function useDragResize(
  canvas: Ref<HTMLCanvasElement | null>,
  autoFitScale: ComputedRef<number>,
  panOffset: Ref<{ x: number; y: number }>,
  spacePressed: Ref<boolean>,
  guides: {
    activeGuides: Ref<GuideLine[]>
    detectAlignments: (
      imgX: number,
      imgY: number,
      imgWidth: number,
      imgHeight: number,
      excludeId: string
    ) => { snapX: number | null; snapY: number | null; guides: GuideLine[] }
    detectResizeAlignments: (
      imgX: number,
      imgY: number,
      imgWidth: number,
      imgHeight: number,
      excludeId: string,
      handle: string
    ) => {
      snapLeft: number | null
      snapRight: number | null
      snapTop: number | null
      snapBottom: number | null
      guides: GuideLine[]
    }
  },
  getCtx: () => CanvasRenderingContext2D | null
) {
  const collage = useCollageStore()

  // All the drag/resize/pan state:
  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeHandle = ref<string | null>(null)
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragImageStart = ref({ x: 0, y: 0 })
  // Startpositionen aller ausgewählten Bilder für Mehfach-Drag
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
  const shiftPressed = ref(false)
  const initialAspectRatio = ref(1)
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const panStartOffset = ref({ x: 0, y: 0 })

  function getResizeHandle(x: number, y: number, img: any): string | null {
    const handleSize = 8
    const hitRadius = handleSize * 1.5 // Größerer Hit-Bereich
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

  function isDeleteButtonClicked(x: number, y: number, img: any): boolean {
    const deleteButtonSize = 14
    const centerX = img.x + img.width / 2
    const centerY = img.y + img.height / 2

    // Transform click point to image coordinate system (considering rotation)
    const angle = (img.rotation * Math.PI) / 180
    const dx = x - centerX
    const dy = y - centerY
    const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
    const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

    // Position des Löschbuttons im Bild-Koordinatensystem
    const deleteButtonX = img.width / 2 - deleteButtonSize / 2
    const deleteButtonY = -img.height / 2 - deleteButtonSize / 2

    // Prüfe ob Klick innerhalb des Löschbuttons ist (Kreis)
    const distance = Math.sqrt(
      Math.pow(rotatedX - deleteButtonX, 2) + Math.pow(rotatedY - deleteButtonY, 2)
    )

    return distance <= deleteButtonSize / 2
  }

  function handleMouseDown(e: MouseEvent) {
    if (!canvas.value) return

    // Pan with middle mouse button or Space + left click
    if (e.button === 1 || (e.button === 0 && spacePressed.value)) {
      if (collage.canvasZoom > 1) {
        isPanning.value = true
        panStart.value = { x: e.clientX, y: e.clientY }
        panStartOffset.value = { ...panOffset.value }
        e.preventDefault()
        return
      }
    }

    const rect = canvas.value.getBoundingClientRect()
    // Berücksichtige Auto-Fit-Zoom beim Berechnen der Koordinaten
    const zoom = autoFitScale.value
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Prüfe ob ein Löschbutton angeklickt wurde (NUR Canvas-Instanzen, keine Templates!)
    const clickedDeleteImage = collage.images
      .filter((img) => img.isGalleryTemplate !== true)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => isDeleteButtonClicked(x, y, img))

    if (clickedDeleteImage) {
      // Bild aus Canvas entfernen (Undo wird in removeImage gespeichert)
      collage.removeImage(clickedDeleteImage.id)
      return
    }

    // Prüfe ob ein Resize-Handle des ausgewählten Bildes angeklickt wurde
    const selectedImg = collage.selectedImage
    if (selectedImg) {
      const handle = getResizeHandle(x, y, selectedImg)
      if (handle) {
        // Speichere Zustand für Undo VOR dem Resize
        collage.saveStateForUndo()
        isResizing.value = true
        resizeHandle.value = handle
        dragStartPos.value = { x, y }
        resizeStart.value = {
          x: selectedImg.x,
          y: selectedImg.y,
          width: selectedImg.width,
          height: selectedImg.height,
        }
        shiftPressed.value = e.shiftKey
        initialAspectRatio.value = selectedImg.width / selectedImg.height
        return
      }
    }

    // Finde angeklickten Text (von oben nach unten, höchster zIndex zuerst)
    const ctx = getCtx()
    const clickedText = [...collage.texts]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((text) => {
        if (!ctx) return false

        const context = ctx

        context.save()
        context.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
        context.textAlign = text.textAlign

        const lines = text.text.split('\n')
        const lineHeight = text.fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        const maxWidth = Math.max(...lines.map((line) => context.measureText(line).width))

        let offsetX = 0
        if (text.textAlign === 'center') offsetX = -maxWidth / 2
        else if (text.textAlign === 'right') offsetX = -maxWidth

        const boxX = text.x + offsetX - 5
        const boxY = text.y - totalHeight / 2 - 5
        const boxWidth = maxWidth + 10
        const boxHeight = totalHeight + 10

        context.restore()

        return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight
      })

    if (clickedText) {
      // Speichere Zustand für Undo VOR dem Verschieben
      collage.saveStateForUndo()
      collage.selectText(clickedText.id)
      isDragging.value = true
      dragStartPos.value = { x, y }
      dragImageStart.value = { x: clickedText.x, y: clickedText.y }
      return
    }

    // Finde angeklicktes Bild (von oben nach unten, nur Canvas-Instanzen)
    const canvasImages = collage.images.filter((img) => img.isGalleryTemplate !== true)
    const clickedImage = [...canvasImages]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height)

    if (clickedImage) {
      // Speichere Zustand für Undo VOR dem Verschieben
      collage.saveStateForUndo()
      // Ctrl/Cmd+Click für Mehrfachauswahl
      if (e.ctrlKey || e.metaKey) {
        collage.toggleImageSelection(clickedImage.id)
        // Bei Mehrfachauswahl: Dragging nur starten, wenn das Bild ausgewählt ist
        if (collage.isImageSelected(clickedImage.id)) {
          isDragging.value = true
          dragStartPos.value = { x, y }
          dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
          // Startpositionen aller ausgewählten Bilder speichern
          dragStartPositions.value = new Map()
          collage.selectedImages.forEach((img) => {
            dragStartPositions.value.set(img.id, { x: img.x, y: img.y })
          })
        }
      } else if (collage.isImageSelected(clickedImage.id)) {
        // Klick auf ein bereits ausgewähltes Bild: Auswahl beibehalten, Drag starten
        isDragging.value = true
        dragStartPos.value = { x, y }
        dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
        // Startpositionen aller ausgewählten Bilder speichern
        dragStartPositions.value = new Map()
        collage.selectedImages.forEach((img) => {
          dragStartPositions.value.set(img.id, { x: img.x, y: img.y })
        })
      } else {
        // Normaler Klick auf ein nicht-ausgewähltes Bild: Ersetzt die Auswahl
        collage.selectImage(clickedImage.id)
        isDragging.value = true
        dragStartPos.value = { x, y }
        dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
        dragStartPositions.value = new Map()
        dragStartPositions.value.set(clickedImage.id, { x: clickedImage.x, y: clickedImage.y })
      }
      collage.selectText(null) // Text explizit deselektieren beim Bildklick
      collage.selectBackground(false) // Hintergrund deselektieren
    } else {
      // Kein Bild/Text getroffen - prüfe ob Hintergrundbild ausgewählt werden soll
      if (collage.settings.backgroundImage.url) {
        collage.selectBackground(true)
      } else {
        collage.selectBackground(false)
      }
      collage.selectImage(null)
      collage.selectText(null)
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas.value) return

    // Handle panning
    if (isPanning.value) {
      const dx = e.clientX - panStart.value.x
      const dy = e.clientY - panStart.value.y
      panOffset.value = {
        x: panStartOffset.value.x + dx,
        y: panStartOffset.value.y + dy,
      }
      return
    }

    if (
      (!collage.selectedImageId && !collage.selectedTextId) ||
      (!isDragging.value && !isResizing.value)
    )
      return

    const rect = canvas.value.getBoundingClientRect()
    // Berücksichtige Auto-Fit-Zoom beim Berechnen der Koordinaten
    const zoom = autoFitScale.value
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Text-Drag-Funktionalität
    if (isDragging.value && collage.selectedTextId && collage.selectedText) {
      const dx = x - dragStartPos.value.x
      const dy = y - dragStartPos.value.y
      collage.updateText(collage.selectedText.id, {
        x: dragImageStart.value.x + dx,
        y: dragImageStart.value.y + dy,
      })
      return
    }

    if (isResizing.value && resizeHandle.value && collage.selectedImageId) {
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
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
        // Smart Guides beim Resize: Erkennung und Snap
        const resizeSnap = guides.detectResizeAlignments(
          newX,
          newY,
          newWidth,
          newHeight,
          collage.selectedImageId,
          resizeHandle.value
        )

        // Wende Snap-Positionen an
        if (resizeSnap.snapLeft !== null) {
          // Linke Kante snappt - Position und Breite anpassen
          const oldRight = newX + newWidth
          newX = resizeSnap.snapLeft
          newWidth = oldRight - newX
        }
        if (resizeSnap.snapRight !== null) {
          // Rechte Kante snappt - nur Breite anpassen
          newWidth = resizeSnap.snapRight - newX
        }
        if (resizeSnap.snapTop !== null) {
          // Obere Kante snappt - Position und Höhe anpassen
          const oldBottom = newY + newHeight
          newY = resizeSnap.snapTop
          newHeight = oldBottom - newY
        }
        if (resizeSnap.snapBottom !== null) {
          // Untere Kante snappt - nur Höhe anpassen
          newHeight = resizeSnap.snapBottom - newY
        }

        // Aktualisiere aktive Guide-Linien für die Anzeige
        guides.activeGuides.value = resizeSnap.guides

        // Nochmal Mindestgröße prüfen nach Snap
        if (newWidth >= 20 && newHeight >= 20) {
          collage.updateImage(collage.selectedImageId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          })
        }
      }
    } else if (isDragging.value && collage.selectedImageId) {
      const dx = x - dragStartPos.value.x
      const dy = y - dragStartPos.value.y

      // Berechne Zielposition für das primäre Bild
      let targetX = dragImageStart.value.x + dx
      let targetY = dragImageStart.value.y + dy

      // Smart Guides für das primäre Bild
      let snapDx = dx
      let snapDy = dy
      const selectedImg = collage.selectedImage
      if (selectedImg) {
        const alignment = guides.detectAlignments(
          targetX,
          targetY,
          selectedImg.width,
          selectedImg.height,
          selectedImg.id
        )

        if (alignment.snapX !== null) {
          targetX = alignment.snapX
          snapDx = targetX - dragImageStart.value.x
        }
        if (alignment.snapY !== null) {
          targetY = alignment.snapY
          snapDy = targetY - dragImageStart.value.y
        }

        guides.activeGuides.value = alignment.guides
      }

      // Alle ausgewählten Bilder gemeinsam verschieben
      if (dragStartPositions.value.size > 1) {
        dragStartPositions.value.forEach((startPos, imgId) => {
          collage.updateImage(imgId, {
            x: startPos.x + snapDx,
            y: startPos.y + snapDy,
          })
        })
      } else {
        collage.updateImage(collage.selectedImageId, {
          x: targetX,
          y: targetY,
        })
      }
    }
  }

  function handleMouseUp() {
    isDragging.value = false
    isResizing.value = false
    isPanning.value = false
    resizeHandle.value = null
    // Smart Guides ausblenden wenn Drag/Resize beendet
    guides.activeGuides.value = []
  }

  return { handleMouseDown, handleMouseMove, handleMouseUp }
}
