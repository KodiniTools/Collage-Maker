import type { CollageImage } from '@/types'
import type { CollageContext } from './context'
import { maxImageZ } from './context'
import { createImageDefaults } from './defaults'

// Gehört ein Bild zu einem Galerie-Template? Verknüpfung primär über die
// stabile sourceId (übersteht Speichern/Wiederherstellen), mit Fallback auf
// die geteilte URL (gleiche Sitzung, alte Speicherstände ohne sourceId).
function isRelatedToGalleryImage(img: CollageImage, galleryImage: CollageImage): boolean {
  return (
    img.id === galleryImage.id ||
    img.sourceId === galleryImage.id ||
    (!!img.url && img.url === galleryImage.url)
  )
}

/** Galerie: Auswahl, Übernahme auf die Leinwand und Entfernen von Galerie-Bildern. */
export function useGallery(ctx: CollageContext) {
  const { images, selectedGalleryIds, selectedImageIds } = ctx

  // Galerie-Bild zur Auswahl hinzufügen/entfernen
  function toggleGallerySelection(id: string) {
    const index = selectedGalleryIds.value.indexOf(id)
    if (index !== -1) {
      selectedGalleryIds.value.splice(index, 1)
    } else {
      selectedGalleryIds.value.push(id)
    }
  }

  function selectAllGalleryImages() {
    const galleryImages = images.value.filter((img) => img.isGalleryTemplate === true)
    selectedGalleryIds.value = galleryImages.map((img) => img.id)
  }

  function deselectAllGalleryImages() {
    selectedGalleryIds.value = []
  }

  function isGalleryImageSelected(id: string): boolean {
    return selectedGalleryIds.value.includes(id)
  }

  // Ausgewählte Galerie-Bilder zum Canvas hinzufügen
  function addSelectedGalleryToCanvas() {
    ctx.saveStateForUndo()
    const selectedGalleryImages = images.value.filter(
      (img) => img.isGalleryTemplate === true && selectedGalleryIds.value.includes(img.id)
    )

    if (selectedGalleryImages.length === 0) return

    const newIds: string[] = []

    selectedGalleryImages.forEach((sourceImage, index) => {
      const newId = crypto.randomUUID()
      const maxZ = maxImageZ(images.value)

      // Erstelle Canvas-Instanz mit Versatz für jedes Bild
      images.value.push({
        ...createImageDefaults(),
        id: newId,
        file: sourceImage.file,
        url: sourceImage.url,
        x: 50 + index * 20,
        y: 50 + index * 20,
        width: sourceImage.width,
        height: sourceImage.height,
        zIndex: maxZ + 1 + index,
        isGalleryTemplate: false,
        sourceId: sourceImage.id,
      })

      newIds.push(newId)
    })

    selectedGalleryIds.value = []
    selectedImageIds.value = newIds
    ctx.reapplyLayout()

    if (newIds.length > 0) ctx.notify('toast.galleryAddedToCanvas', { count: newIds.length })
  }

  // Anzahl der Canvas-Instanzen eines Galerie-Bildes (keine Templates)
  function countGalleryImageInstances(galleryId: string): number {
    const galleryImage = images.value.find((img) => img.id === galleryId)
    if (!galleryImage) return 0
    return images.value.filter(
      (img) => img.isGalleryTemplate !== true && isRelatedToGalleryImage(img, galleryImage)
    ).length
  }

  // Template und alle zugehörigen Canvas-Instanzen entfernen (ohne Undo)
  function removeWithInstances(galleryImage: CollageImage) {
    const relatedIds = images.value
      .filter((img) => isRelatedToGalleryImage(img, galleryImage))
      .map((img) => img.id)
    relatedIds.forEach((id) => ctx.removeImage(id, true))
  }

  // Einzelnes Galerie-Bild entfernen (Template + alle Canvas-Instanzen)
  function removeGalleryImage(galleryId: string) {
    ctx.saveStateForUndo()
    const galleryImage = images.value.find((img) => img.id === galleryId)
    if (!galleryImage) return

    removeWithInstances(galleryImage)

    const selIndex = selectedGalleryIds.value.indexOf(galleryId)
    if (selIndex !== -1) {
      selectedGalleryIds.value.splice(selIndex, 1)
    }

    // Layout neu anwenden, damit verbleibende Bilder nachrücken
    ctx.reapplyLayout()
  }

  // Ausgewählte Galerie-Bilder entfernen (Template + alle Canvas-Instanzen)
  function removeSelectedGalleryImages() {
    ctx.saveStateForUndo()
    const idsToRemove = [...selectedGalleryIds.value]

    idsToRemove.forEach((galleryId) => {
      const galleryImage = images.value.find((img) => img.id === galleryId)
      if (galleryImage) removeWithInstances(galleryImage)
    })

    selectedGalleryIds.value = []

    // Layout neu anwenden, damit verbleibende Bilder nachrücken
    ctx.reapplyLayout()
  }

  return {
    toggleGallerySelection,
    selectAllGalleryImages,
    deselectAllGalleryImages,
    isGalleryImageSelected,
    addSelectedGalleryToCanvas,
    countGalleryImageInstances,
    removeGalleryImage,
    removeSelectedGalleryImages,
  }
}
