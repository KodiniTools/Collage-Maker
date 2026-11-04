import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage } from '@/types'
import { useGalleryTouchDrag } from '@/composables/useGalleryTouchDrag'

/** localStorage-Schlüssel der „Nicht mehr fragen"-Einstellung beim Löschen. */
export const SKIP_DELETE_CONFIRM_KEY = 'collage-skip-gallery-delete-confirm'

/**
 * Kapselt die gesamte Logik der Bilderliste (ImageList): Auswahl, Drag & Drop,
 * Vorschau, Löschen mit Bestätigung und Pixelmaße.
 *
 * Wird EINMAL in ImageList.vue aufgerufen; die zurückgegebenen Werte/Funktionen
 * werden an die Unterkomponenten unter `components/image-list/` weitergereicht.
 */
export function useImageList() {
  const collage = useCollageStore()
  const { selectedGalleryIds, images } = storeToRefs(collage)

  // Touch-Drag vom Galerie-Eintrag auf das Canvas (Ersatz für HTML5-DnD auf Mobil)
  const { onItemTouchStart, onItemTouchMove, onItemTouchEnd } = useGalleryTouchDrag()

  // Nur Galerie-Templates anzeigen (keine Canvas-Instanzen)
  const galleryImages = computed(() => images.value.filter((img) => img.isGalleryTemplate === true))

  // Anzahl ausgewählter Galerie-Bilder
  const selectedCount = computed(() => selectedGalleryIds.value.length)

  // Sind alle Bilder ausgewählt?
  const allSelected = computed(
    () =>
      galleryImages.value.length > 0 &&
      galleryImages.value.every((img) => collage.isGalleryImageSelected(img.id))
  )

  // ── Löschen mit Bestätigung ────────────────────────────────────────────────
  // 'single' = einzelnes Bild, 'selected' = Mehrfachauswahl
  const showDeleteConfirm = ref(false)
  const deleteMode = ref<'single' | 'selected'>('single')
  const imageToDelete = ref<CollageImage | null>(null)

  // „Nicht mehr fragen"-Einstellung (persistiert in localStorage)
  const skipDeleteConfirm = ref(localStorage.getItem(SKIP_DELETE_CONFIRM_KEY) === 'true')
  const dontAskAgain = ref(false)

  // Anzahl der betroffenen Canvas-Instanzen (für den Hinweis im Dialog)
  const deleteInstanceCount = computed(() => {
    if (deleteMode.value === 'single') {
      return imageToDelete.value ? collage.countGalleryImageInstances(imageToDelete.value.id) : 0
    }
    return selectedGalleryIds.value.reduce(
      (sum, id) => sum + collage.countGalleryImageInstances(id),
      0
    )
  })

  // Stammt das Hintergrundbild der Leinwand aus den zu löschenden Bildern?
  const deleteAffectsBackground = computed(() => {
    if (deleteMode.value === 'single') {
      return imageToDelete.value ? collage.isGalleryImageBackground(imageToDelete.value.id) : false
    }
    return selectedGalleryIds.value.some((id) => collage.isGalleryImageBackground(id))
  })

  // Führt die eigentliche Löschung aus und zeigt einen „Rückgängig"-Toast.
  function performDelete(mode: 'single' | 'selected', image: CollageImage | null) {
    if (mode === 'single') {
      if (!image) return
      collage.removeGalleryImage(image.id)
      collage.showUndoToast('toast.imageDeleted')
    } else {
      const count = selectedCount.value
      collage.removeSelectedGalleryImages()
      collage.showUndoToast('toast.imagesDeleted', { count })
    }
  }

  function requestDelete(image: CollageImage) {
    if (skipDeleteConfirm.value) {
      performDelete('single', image)
      return
    }
    deleteMode.value = 'single'
    imageToDelete.value = image
    showDeleteConfirm.value = true
  }

  function requestDeleteSelected() {
    if (selectedCount.value === 0) return
    if (skipDeleteConfirm.value) {
      performDelete('selected', null)
      return
    }
    deleteMode.value = 'selected'
    imageToDelete.value = null
    showDeleteConfirm.value = true
  }

  function cancelDelete() {
    showDeleteConfirm.value = false
    imageToDelete.value = null
    dontAskAgain.value = false
  }

  function confirmDelete() {
    // „Nicht mehr fragen" persistieren, falls angehakt
    if (dontAskAgain.value) {
      skipDeleteConfirm.value = true
      localStorage.setItem(SKIP_DELETE_CONFIRM_KEY, 'true')
    }
    performDelete(deleteMode.value, imageToDelete.value)
    cancelDelete()
  }

  // ── Auswahl & Drag ─────────────────────────────────────────────────────────
  function handleDragStart(event: DragEvent, imageId: string) {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('imageId', imageId)
    }
  }

  function handleImageClick(imageId: string, event: MouseEvent | KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Mehrfachauswahl mit Ctrl/Cmd-Klick
      collage.toggleGallerySelection(imageId)
    } else {
      // Einzelauswahl - toggle
      if (collage.isGalleryImageSelected(imageId) && selectedCount.value === 1) {
        collage.deselectAllGalleryImages()
      } else {
        collage.deselectAllGalleryImages()
        collage.toggleGallerySelection(imageId)
      }
    }
  }

  function toggleSelectAll() {
    if (allSelected.value) {
      collage.deselectAllGalleryImages()
    } else {
      collage.selectAllGalleryImages()
    }
  }

  function setSelectedAsBackground() {
    const selectedImage = images.value.find(
      (img) => img.isGalleryTemplate === true && selectedGalleryIds.value.includes(img.id)
    )
    if (selectedImage) {
      collage.setBackgroundImage(selectedImage.url)
      collage.deselectAllGalleryImages()
      collage.selectBackground(true) // Hintergrundbild nach dem Setzen auswählen
    }
  }

  // ── Vorschau ───────────────────────────────────────────────────────────────
  const showPreview = ref(false)
  const previewImage = ref<CollageImage | null>(null)

  function handleDoubleClick(image: CollageImage) {
    previewImage.value = image
    showPreview.value = true
  }

  function closePreview() {
    showPreview.value = false
    previewImage.value = null
  }

  function toggleSelectionAndClose() {
    if (previewImage.value) collage.toggleGallerySelection(previewImage.value.id)
    closePreview()
  }

  function addToCanvasAndClose() {
    if (!previewImage.value) return
    collage.deselectAllGalleryImages()
    collage.toggleGallerySelection(previewImage.value.id)
    collage.addSelectedGalleryToCanvas()
    closePreview()
  }

  function setAsBackgroundAndClose() {
    if (!previewImage.value) return
    collage.setBackgroundImage(previewImage.value.url)
    collage.selectBackground(true)
    closePreview()
  }

  // ── Pixelmaße ──────────────────────────────────────────────────────────────
  // Echte Pixelmaße direkt aus dem geladenen Bild lesen (nicht die
  // Canvas-Platzhaltergröße), damit die Originalauflösung angezeigt wird.
  const naturalDims = ref<Record<string, { w: number; h: number }>>({})

  function onImageLoad(id: string, event: Event) {
    const el = event.target as HTMLImageElement
    if (el.naturalWidth > 0) {
      naturalDims.value[id] = { w: el.naturalWidth, h: el.naturalHeight }
    }
  }

  function dimensionsText(id: string): string {
    const d = naturalDims.value[id]
    return d ? `${d.w} × ${d.h} px` : ''
  }

  return {
    collage,
    galleryImages,
    selectedCount,
    allSelected,
    // Auswahl & Drag
    handleDragStart,
    handleImageClick,
    toggleSelectAll,
    setSelectedAsBackground,
    onItemTouchStart,
    onItemTouchMove,
    onItemTouchEnd,
    // Löschen
    showDeleteConfirm,
    deleteMode,
    imageToDelete,
    dontAskAgain,
    deleteInstanceCount,
    deleteAffectsBackground,
    requestDelete,
    requestDeleteSelected,
    cancelDelete,
    confirmDelete,
    // Vorschau
    showPreview,
    previewImage,
    handleDoubleClick,
    closePreview,
    toggleSelectionAndClose,
    addToCanvasAndClose,
    setAsBackgroundAndClose,
    // Pixelmaße
    onImageLoad,
    dimensionsText,
  }
}

export type ImageListApi = ReturnType<typeof useImageList>
