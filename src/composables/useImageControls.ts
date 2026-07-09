import { computed, ref, watch } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage, CropRect } from '@/types'
import { FULL_CROP, clampCrop, hasCrop } from '@/lib/cropImage'

/**
 * Kapselt die gesamte Logik der Bildsteuerung (ImageControls).
 *
 * Wird EINMAL in ImageControls.vue aufgerufen; die zurückgegebenen
 * Werte/Funktionen werden an die Unterkomponenten weitergereicht. Dadurch
 * teilen sich alle Sektionen denselben Zustand (z. B. aspectRatio) und das
 * Verhalten bleibt identisch zur ursprünglichen, monolithischen Komponente.
 */
export function useImageControls() {
  const collage = useCollageStore()

  // Einzelauswahl (Backward-kompatibel)
  const selectedImage = computed(() => collage.selectedImage)
  // Mehrfachauswahl
  const selectedImages = computed(() => collage.selectedImages)
  const selectedCount = computed(() => collage.selectedImageIds.length)
  const isMultiSelection = computed(() => selectedCount.value > 1)

  const aspectRatio = ref(1)

  // Berechne Seitenverhältnis wenn Bild ausgewählt wird
  watch(
    selectedImage,
    (img) => {
      if (img) {
        aspectRatio.value = img.width / img.height
      }
    },
    { immediate: true }
  )

  // Referenzbild für Slider-Werte (erstes ausgewähltes Bild)
  const displayImage = computed(() => selectedImages.value[0] || null)

  // Hilfsfunktion: Updates auf alle ausgewählten Bilder anwenden
  function applyToSelected(updates: Partial<CollageImage>) {
    if (isMultiSelection.value) {
      collage.updateSelectedImages(updates)
    } else if (collage.selectedImageId) {
      collage.updateImage(collage.selectedImageId, updates)
    }
  }

  // Undo-Tracking: Debounced für Slider, direkt für diskrete Aktionen
  function saveUndoDebounced() {
    collage.saveStateForUndoDebounced()
  }

  function saveUndoImmediate() {
    collage.saveStateForUndo()
  }

  function updateWidth(value: number) {
    if (collage.selectedImageId && selectedImage.value) {
      saveUndoDebounced()
      const updates: Partial<CollageImage> = { width: value }
      if (collage.lockAspectRatio) {
        updates.height = value / aspectRatio.value
      }
      collage.updateImage(collage.selectedImageId, updates)
    }
  }

  function updateHeight(value: number) {
    if (collage.selectedImageId && selectedImage.value) {
      saveUndoDebounced()
      const updates: Partial<CollageImage> = { height: value }
      if (collage.lockAspectRatio) {
        updates.width = value * aspectRatio.value
      }
      collage.updateImage(collage.selectedImageId, updates)
    }
  }

  function updatePositionX(value: number) {
    if (collage.selectedImageId) {
      saveUndoDebounced()
      collage.updateImage(collage.selectedImageId, { x: value })
    }
  }

  function updatePositionY(value: number) {
    if (collage.selectedImageId) {
      saveUndoDebounced()
      collage.updateImage(collage.selectedImageId, { y: value })
    }
  }

  function toggleAspectRatio() {
    collage.setLockAspectRatio(!collage.lockAspectRatio)
    if (collage.lockAspectRatio && selectedImage.value) {
      // Aktualisiere Seitenverhältnis beim Aktivieren
      aspectRatio.value = selectedImage.value.width / selectedImage.value.height
    }
  }

  function updateRotation(value: number) {
    saveUndoDebounced()
    applyToSelected({ rotation: value })
  }

  function updateOpacity(value: number) {
    saveUndoDebounced()
    applyToSelected({ opacity: value })
  }

  function updateBorderRadius(value: number) {
    saveUndoDebounced()
    applyToSelected({ borderRadius: value })
  }

  function toggleBorder() {
    saveUndoImmediate()
    // Bei Mehrfachauswahl: Einheitlich aktivieren oder deaktivieren
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.borderEnabled)
      applyToSelected({ borderEnabled: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ borderEnabled: !selectedImage.value.borderEnabled })
    }
  }

  function updateBorderWidth(value: number) {
    saveUndoDebounced()
    applyToSelected({ borderWidth: value })
  }

  function updateBorderColor(value: string) {
    saveUndoDebounced()
    applyToSelected({ borderColor: value })
  }

  function updateBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double') {
    saveUndoImmediate()
    applyToSelected({ borderStyle: value })
  }

  function toggleBorderShadow() {
    saveUndoImmediate()
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.borderShadowEnabled)
      applyToSelected({ borderShadowEnabled: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ borderShadowEnabled: !selectedImage.value.borderShadowEnabled })
    }
  }

  function updateBorderShadowOffsetX(value: number) {
    saveUndoDebounced()
    applyToSelected({ borderShadowOffsetX: value })
  }

  function updateBorderShadowOffsetY(value: number) {
    saveUndoDebounced()
    applyToSelected({ borderShadowOffsetY: value })
  }

  function updateBorderShadowBlur(value: number) {
    saveUndoDebounced()
    applyToSelected({ borderShadowBlur: value })
  }

  function updateBorderShadowColor(value: string) {
    saveUndoDebounced()
    applyToSelected({ borderShadowColor: value })
  }

  function toggleShadow() {
    saveUndoImmediate()
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.shadowEnabled)
      applyToSelected({ shadowEnabled: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ shadowEnabled: !selectedImage.value.shadowEnabled })
    }
  }

  function updateShadowOffsetX(value: number) {
    saveUndoDebounced()
    applyToSelected({ shadowOffsetX: value })
  }

  function updateShadowOffsetY(value: number) {
    saveUndoDebounced()
    applyToSelected({ shadowOffsetY: value })
  }

  function updateShadowBlur(value: number) {
    saveUndoDebounced()
    applyToSelected({ shadowBlur: value })
  }

  function updateShadowColor(value: string) {
    saveUndoDebounced()
    applyToSelected({ shadowColor: value })
  }

  // Transformation: Spiegelung & Neigung
  function toggleFlipHorizontal() {
    saveUndoImmediate()
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.flipHorizontal)
      applyToSelected({ flipHorizontal: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ flipHorizontal: !selectedImage.value.flipHorizontal })
    }
  }

  function toggleFlipVertical() {
    saveUndoImmediate()
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.flipVertical)
      applyToSelected({ flipVertical: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ flipVertical: !selectedImage.value.flipVertical })
    }
  }

  function updateSkewX(value: number) {
    saveUndoDebounced()
    applyToSelected({ skewX: value })
  }

  function updateSkewY(value: number) {
    saveUndoDebounced()
    applyToSelected({ skewY: value })
  }

  // Freies Verzerren (Distort) an-/ausschalten
  function toggleDistort() {
    saveUndoImmediate()
    if (isMultiSelection.value) {
      const anyEnabled = selectedImages.value.some((img) => img.distortEnabled)
      applyToSelected({ distortEnabled: !anyEnabled })
    } else if (selectedImage.value) {
      applyToSelected({ distortEnabled: !selectedImage.value.distortEnabled })
    }
  }

  // Verzerrung zurücksetzen (Ecken auf 0), Modus bleibt aktiv
  function resetDistort() {
    saveUndoImmediate()
    applyToSelected({ cornerOffsets: undefined })
  }

  // ========== Zuschneiden (Crop) ==========

  // Aktuelle Zuschnitt-Ränder (Insets, 0..1) des Referenzbildes für die UI.
  const cropInsets = computed(() => {
    const c = displayImage.value?.crop ?? FULL_CROP
    return {
      left: c.x,
      top: c.y,
      right: 1 - (c.x + c.width),
      bottom: 1 - (c.y + c.height),
    }
  })

  // Ist auf dem Referenzbild aktuell ein Zuschnitt aktiv?
  const isCropped = computed(() => hasCrop(displayImage.value?.crop))

  /**
   * Berechnet die Box-Updates (Position + Größe), damit der neue Zuschnitt
   * verzerrungsfrei angezeigt wird. Das (virtuelle) Vollbild bleibt dabei an
   * derselben Stelle auf der Leinwand verankert – Zuschneiden einer Seite lässt
   * die gegenüberliegende Kante stehen.
   */
  function cropBoxUpdates(img: CollageImage, rawCrop: CropRect): Partial<CollageImage> {
    const oldCrop = img.crop ?? FULL_CROP
    const newCrop = clampCrop(rawCrop)
    const fullW = img.width / oldCrop.width
    const fullH = img.height / oldCrop.height
    const fullX = img.x - oldCrop.x * fullW
    const fullY = img.y - oldCrop.y * fullH
    return {
      crop: hasCrop(newCrop) ? newCrop : undefined,
      width: fullW * newCrop.width,
      height: fullH * newCrop.height,
      x: fullX + newCrop.x * fullW,
      y: fullY + newCrop.y * fullH,
    }
  }

  // Zielbilder für Zuschnitt (Einzel- oder Mehrfachauswahl)
  function cropTargets(): CollageImage[] {
    if (isMultiSelection.value) return selectedImages.value
    return selectedImage.value ? [selectedImage.value] : []
  }

  function applyCropToSelected(cropFor: (img: CollageImage) => CropRect, immediate = true) {
    if (immediate) saveUndoImmediate()
    else saveUndoDebounced()
    cropTargets().forEach((img) => {
      collage.updateImage(img.id, cropBoxUpdates(img, cropFor(img)))
    })
  }

  /**
   * Wendet ein Seitenverhältnis-Preset an: mittig platzierter, größtmöglicher
   * Ausschnitt mit dem Ziel-Seitenverhältnis (relativ zum Original des Bildes).
   */
  function applyCropPreset(aspect: number) {
    applyCropToSelected((img) => {
      const oldCrop = img.crop ?? FULL_CROP
      const fullW = img.width / oldCrop.width
      const fullH = img.height / oldCrop.height
      const sourceAspect = fullW / fullH
      let cw: number
      let ch: number
      if (aspect >= sourceAspect) {
        cw = 1
        ch = sourceAspect / aspect
      } else {
        ch = 1
        cw = aspect / sourceAspect
      }
      return { x: (1 - cw) / 2, y: (1 - ch) / 2, width: cw, height: ch }
    })
  }

  // Freies Zuschneiden über die vier Ränder (Insets). side = welche Kante.
  function updateCropInset(side: 'left' | 'top' | 'right' | 'bottom', value: number) {
    const insets = { ...cropInsets.value, [side]: value }
    const rawCrop: CropRect = {
      x: insets.left,
      y: insets.top,
      width: 1 - insets.left - insets.right,
      height: 1 - insets.top - insets.bottom,
    }
    applyCropToSelected(() => rawCrop, false)
  }

  // Zuschnitt vollständig zurücksetzen (Vollbild wiederherstellen)
  function resetCrop() {
    applyCropToSelected(() => FULL_CROP)
  }

  function deleteImage() {
    // Undo wird in removeSelectedImages/removeImage gespeichert
    if (isMultiSelection.value) {
      collage.removeSelectedImages()
    } else if (collage.selectedImageId) {
      collage.removeImage(collage.selectedImageId)
    }
  }

  function bringToFront() {
    if (selectedImages.value.length > 0) {
      saveUndoImmediate()
      const maxZ = Math.max(...collage.images.map((img) => img.zIndex), 0)
      // Bei Mehrfachauswahl: Alle nach vorne, aber relative Reihenfolge beibehalten
      selectedImages.value
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach((img, index) => {
          collage.updateImage(img.id, { zIndex: maxZ + 1 + index })
        })
    }
  }

  function sendToBack() {
    if (selectedImages.value.length > 0) {
      saveUndoImmediate()
      const minZ = Math.min(...collage.images.map((img) => img.zIndex), 0)
      // Bei Mehrfachauswahl: Alle nach hinten, aber relative Reihenfolge beibehalten
      selectedImages.value
        .sort((a, b) => b.zIndex - a.zIndex)
        .forEach((img, index) => {
          collage.updateImage(img.id, { zIndex: minZ - 1 - index })
        })
    }
  }

  function bringForward() {
    if (selectedImages.value.length > 0) {
      saveUndoImmediate()
      // Sortiere alle Bilder nach zIndex
      const sortedImages = [...collage.images].sort((a, b) => a.zIndex - b.zIndex)

      selectedImages.value.forEach((selectedImg) => {
        const currentIndex = sortedImages.findIndex((img) => img.id === selectedImg.id)
        // Finde das nächste Bild darüber (das nicht ausgewählt ist)
        const nextAbove = sortedImages
          .slice(currentIndex + 1)
          .find((img) => !selectedImages.value.some((sel) => sel.id === img.id))

        if (nextAbove) {
          // Tausche zIndex mit dem nächsten Bild darüber
          const tempZ = selectedImg.zIndex
          collage.updateImage(selectedImg.id, { zIndex: nextAbove.zIndex })
          collage.updateImage(nextAbove.id, { zIndex: tempZ })
        }
      })
    }
  }

  function sendBackward() {
    if (selectedImages.value.length > 0) {
      saveUndoImmediate()
      // Sortiere alle Bilder nach zIndex (umgekehrt für rückwärts)
      const sortedImages = [...collage.images].sort((a, b) => b.zIndex - a.zIndex)

      selectedImages.value.forEach((selectedImg) => {
        const currentIndex = sortedImages.findIndex((img) => img.id === selectedImg.id)
        // Finde das nächste Bild darunter (das nicht ausgewählt ist)
        const nextBelow = sortedImages
          .slice(currentIndex + 1)
          .find((img) => !selectedImages.value.some((sel) => sel.id === img.id))

        if (nextBelow) {
          // Tausche zIndex mit dem nächsten Bild darunter
          const tempZ = selectedImg.zIndex
          collage.updateImage(selectedImg.id, { zIndex: nextBelow.zIndex })
          collage.updateImage(nextBelow.id, { zIndex: tempZ })
        }
      })
    }
  }

  // Bildbearbeitungs-Filter Funktionen
  function updateBrightness(value: number) {
    saveUndoDebounced()
    applyToSelected({ brightness: value })
  }

  function updateContrast(value: number) {
    saveUndoDebounced()
    applyToSelected({ contrast: value })
  }

  function updateHighlights(value: number) {
    saveUndoDebounced()
    applyToSelected({ highlights: value })
  }

  function updateShadows(value: number) {
    saveUndoDebounced()
    applyToSelected({ shadows: value })
  }

  function updateSaturation(value: number) {
    saveUndoDebounced()
    applyToSelected({ saturation: value })
  }

  function updateWarmth(value: number) {
    saveUndoDebounced()
    applyToSelected({ warmth: value })
  }

  function updateSharpness(value: number) {
    saveUndoDebounced()
    applyToSelected({ sharpness: value })
  }

  function resetImageChanges() {
    saveUndoImmediate()
    // Setze alle Bearbeitungen auf Standardwerte zurück
    // Position und Größe bleiben erhalten (gehören zum Layout)
    const defaultValues = {
      rotation: 0,
      opacity: 1,
      borderRadius: 0,
      borderEnabled: false,
      borderWidth: 4,
      borderColor: '#000000',
      borderStyle: 'solid' as const,
      borderShadowEnabled: false,
      borderShadowOffsetX: 3,
      borderShadowOffsetY: 3,
      borderShadowBlur: 6,
      borderShadowColor: '#000000',
      shadowEnabled: false,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
      shadowBlur: 10,
      shadowColor: '#000000',
      brightness: 100,
      contrast: 100,
      highlights: 0,
      shadows: 0,
      saturation: 100,
      warmth: 0,
      sharpness: 0,
      flipHorizontal: false,
      flipVertical: false,
      skewX: 0,
      skewY: 0,
      distortEnabled: false,
      cornerOffsets: undefined,
    }
    // Zuschnitt pro Bild zurücksetzen (stellt die Vollbild-Box wieder her),
    // danach die übrigen Standardwerte anwenden.
    cropTargets().forEach((img) => {
      collage.updateImage(img.id, { ...defaultValues, ...cropBoxUpdates(img, FULL_CROP) })
    })
  }

  // Alle Canvas-Bilder auswählen
  function selectAllImages() {
    collage.selectAllCanvasImages()
  }

  // Auswahl aufheben
  function deselectAll() {
    collage.deselectAllImages()
  }

  return {
    collage,
    selectedImage,
    selectedImages,
    selectedCount,
    isMultiSelection,
    displayImage,
    applyToSelected,
    updateWidth,
    updateHeight,
    updatePositionX,
    updatePositionY,
    toggleAspectRatio,
    updateRotation,
    updateOpacity,
    updateBorderRadius,
    toggleBorder,
    updateBorderWidth,
    updateBorderColor,
    updateBorderStyle,
    toggleBorderShadow,
    updateBorderShadowOffsetX,
    updateBorderShadowOffsetY,
    updateBorderShadowBlur,
    updateBorderShadowColor,
    toggleShadow,
    updateShadowOffsetX,
    updateShadowOffsetY,
    updateShadowBlur,
    updateShadowColor,
    toggleFlipHorizontal,
    toggleFlipVertical,
    updateSkewX,
    updateSkewY,
    toggleDistort,
    resetDistort,
    cropInsets,
    isCropped,
    applyCropPreset,
    updateCropInset,
    resetCrop,
    deleteImage,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    alignImages: collage.alignSelectedImages,
    distributeImages: collage.distributeSelectedImages,
    updateBrightness,
    updateContrast,
    updateHighlights,
    updateShadows,
    updateSaturation,
    updateWarmth,
    updateSharpness,
    resetImageChanges,
    selectAllImages,
    deselectAll,
  }
}

export type ImageControlsApi = ReturnType<typeof useImageControls>
