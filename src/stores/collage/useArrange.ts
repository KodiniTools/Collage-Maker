import type { CollageContext } from './context'
import { maxImageZ } from './context'
import { createImageDefaults } from './defaults'

export type AlignMode = 'left' | 'center-h' | 'right' | 'top' | 'middle-v' | 'bottom'

/** Anordnen: Duplizieren, Ebenen, Ausrichten/Verteilen, Drehen und Verschieben. */
export function useArrange(ctx: CollageContext) {
  const { images, texts, selectedImageIds, selectedTextId, selectedImages, updateImage } = ctx

  function duplicateImageToPosition(sourceId: string, x: number, y: number) {
    ctx.saveStateForUndo()
    const sourceImage = images.value.find((img) => img.id === sourceId)
    if (!sourceImage) return

    const newId = crypto.randomUUID()

    // Erstelle eine Canvas-Instanz (kein Template) an der neuen Position
    images.value.push({
      ...createImageDefaults(),
      id: newId,
      file: sourceImage.file,
      url: sourceImage.url, // Verwende dieselbe URL (keine Duplikation des Blobs nötig)
      x,
      y,
      width: sourceImage.width,
      height: sourceImage.height,
      zIndex: maxImageZ(images.value) + 1,
      // Als Canvas-Instanz markieren (kein Galerie-Template)
      isGalleryTemplate: false,
      // Verknüpfung zum Galerie-Template beibehalten (Instanz oder Template als Quelle)
      sourceId: sourceImage.sourceId ?? sourceImage.id,
    })

    // Selektiere das neue Bild (ersetzt vorherige Auswahl)
    selectedImageIds.value = [newId]
  }

  // Ausgewählte Bilder duplizieren (für Ctrl+D)
  function duplicateSelectedImages() {
    ctx.saveStateForUndo()
    const imagesToDuplicate = [...selectedImages.value]
    const newIds: string[] = []

    imagesToDuplicate.forEach((sourceImage) => {
      const newId = crypto.randomUUID()

      // Erstelle Kopie mit Versatz
      images.value.push({
        ...sourceImage,
        id: newId,
        x: sourceImage.x + 20,
        y: sourceImage.y + 20,
        zIndex: maxImageZ(images.value) + 1,
        isGalleryTemplate: false,
      })

      newIds.push(newId)
    })

    if (newIds.length > 0) {
      selectedImageIds.value = newIds
      ctx.notify('toast.imageDuplicated', { count: newIds.length })
    }
  }

  function bringSelectedToFront() {
    if (selectedImageIds.value.length === 0) return
    ctx.saveStateForUndo()

    const maxZ = maxImageZ(images.value)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: maxZ + 1 + index })
    })
    ctx.notify('toast.broughtToFront')
  }

  function sendSelectedToBack() {
    if (selectedImageIds.value.length === 0) return
    ctx.saveStateForUndo()

    const minZ = Math.min(...images.value.map((img) => img.zIndex), 0)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: minZ - 1 - index })
    })
    ctx.notify('toast.sentToBack')
  }

  // Canvas-Bilder anhand einer sortierten ID-Liste neu stapeln.
  // orderedIds ist von hinten (Index 0 = unterste Ebene) nach vorne sortiert.
  function reorderCanvasImages(orderedIds: string[]) {
    if (orderedIds.length === 0) return
    ctx.saveStateForUndo()
    orderedIds.forEach((id, index) => {
      updateImage(id, { zIndex: index })
    })
  }

  // Ausgewählte Bilder an der gemeinsamen Bounding-Box ausrichten
  function alignSelectedImages(mode: AlignMode) {
    const imgs = selectedImages.value
    if (imgs.length < 2) return
    ctx.saveStateForUndo()

    const minX = Math.min(...imgs.map((i) => i.x))
    const minY = Math.min(...imgs.map((i) => i.y))
    const maxRight = Math.max(...imgs.map((i) => i.x + i.width))
    const maxBottom = Math.max(...imgs.map((i) => i.y + i.height))
    const centerX = (minX + maxRight) / 2
    const centerY = (minY + maxBottom) / 2

    imgs.forEach((img) => {
      switch (mode) {
        case 'left':
          updateImage(img.id, { x: minX })
          break
        case 'center-h':
          updateImage(img.id, { x: centerX - img.width / 2 })
          break
        case 'right':
          updateImage(img.id, { x: maxRight - img.width })
          break
        case 'top':
          updateImage(img.id, { y: minY })
          break
        case 'middle-v':
          updateImage(img.id, { y: centerY - img.height / 2 })
          break
        case 'bottom':
          updateImage(img.id, { y: maxBottom - img.height })
          break
      }
    })
    ctx.notify('toast.aligned')
  }

  // Ausgewählte Bilder gleichmäßig verteilen (gleiche Abstände zwischen den Kanten).
  // Benötigt mindestens 3 Bilder; erstes und letztes bleiben an ihrer Position.
  function distributeSelectedImages(axis: 'horizontal' | 'vertical') {
    const imgs = [...selectedImages.value]
    if (imgs.length < 3) return
    ctx.saveStateForUndo()

    if (axis === 'horizontal') {
      imgs.sort((a, b) => a.x - b.x)
      const minLeft = imgs[0].x
      const maxRight = Math.max(...imgs.map((i) => i.x + i.width))
      const totalWidth = imgs.reduce((sum, i) => sum + i.width, 0)
      const gap = (maxRight - minLeft - totalWidth) / (imgs.length - 1)
      let cursor = minLeft
      imgs.forEach((img) => {
        updateImage(img.id, { x: cursor })
        cursor += img.width + gap
      })
    } else {
      imgs.sort((a, b) => a.y - b.y)
      const minTop = imgs[0].y
      const maxBottom = Math.max(...imgs.map((i) => i.y + i.height))
      const totalHeight = imgs.reduce((sum, i) => sum + i.height, 0)
      const gap = (maxBottom - minTop - totalHeight) / (imgs.length - 1)
      let cursor = minTop
      imgs.forEach((img) => {
        updateImage(img.id, { y: cursor })
        cursor += img.height + gap
      })
    }
    ctx.notify('toast.distributed')
  }

  function rotateSelectedImages(degrees: number) {
    ctx.saveStateForUndo()
    selectedImageIds.value.forEach((id) => {
      const img = images.value.find((i) => i.id === id)
      if (img) {
        updateImage(id, { rotation: (img.rotation + degrees) % 360 })
      }
    })
  }

  function moveSelectedImages(dx: number, dy: number) {
    ctx.saveStateForUndoDebounced()
    selectedImageIds.value.forEach((id) => {
      const img = images.value.find((i) => i.id === id)
      if (img) {
        updateImage(id, { x: img.x + dx, y: img.y + dy })
      }
    })
  }

  function moveSelectedText(dx: number, dy: number) {
    ctx.saveStateForUndoDebounced()
    if (selectedTextId.value) {
      const txt = texts.value.find((t) => t.id === selectedTextId.value)
      if (txt) {
        ctx.updateText(selectedTextId.value, { x: txt.x + dx, y: txt.y + dy })
      }
    }
  }

  return {
    duplicateImageToPosition,
    duplicateSelectedImages,
    bringSelectedToFront,
    sendSelectedToBack,
    reorderCanvasImages,
    alignSelectedImages,
    distributeSelectedImages,
    rotateSelectedImages,
    moveSelectedImages,
    moveSelectedText,
  }
}
