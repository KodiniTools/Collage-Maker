import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CollageImage,
  CollageText,
  CollageSettings,
  LayoutType,
  BackgroundImageFit,
  BackgroundImageSettings,
  CanvasBorderSettings,
} from '@/types'
import { computeLayout } from '@/lib/layouts'
import { useHistoryStore } from '@/stores/history'
import { useToastStore } from '@/stores/toast'
import { UNDO_DEBOUNCE_MS } from '@/config/constants'
import { i18n } from '@/i18n'
import type { CollageContext } from './collage/context'
import {
  createDefaultBackgroundImage,
  createDefaultSettings,
  createImageDefaults,
} from './collage/defaults'
import { useGallery } from './collage/useGallery'
import { useArrange } from './collage/useArrange'
import { useTexts } from './collage/useTexts'
import { useCanvasResize } from './collage/useCanvasResize'
import { useTemplateIO } from './collage/useTemplateIO'

export const useCollageStore = defineStore('collage', () => {
  const images = ref<CollageImage[]>([])
  // Mehrfachauswahl: Array von ausgewählten Bild-IDs (Canvas)
  const selectedImageIds = ref<string[]>([])
  // Mehrfachauswahl: Array von ausgewählten Galerie-Bild-IDs
  const selectedGalleryIds = ref<string[]>([])
  const texts = ref<CollageText[]>([])
  const selectedTextId = ref<string | null>(null)
  const lockAspectRatio = ref(true)
  const canvasZoom = ref(1) // Zoom-Level für Canvas-Anzeige (1 = 100%)
  const isBackgroundSelected = ref(false) // Ist das Hintergrundbild ausgewählt?

  const settings = ref<CollageSettings>(createDefaultSettings())

  // History Store für Undo/Redo
  const historyStore = useHistoryStore()

  // Speichert den aktuellen Zustand für Undo
  function saveStateForUndo() {
    historyStore.saveSnapshot(images.value, texts.value, settings.value)
  }

  // Debounced-Version: Speichert nur einmal pro Interaktionsphase (z.B. Slider-Drag).
  // Verhindert, dass bei kontinuierlichen Änderungen (Slider) für jeden
  // Zwischenwert ein Snapshot erstellt wird.
  let lastDebouncedSaveTime = 0
  function saveStateForUndoDebounced() {
    const now = Date.now()
    if (now - lastDebouncedSaveTime > UNDO_DEBOUNCE_MS) {
      saveStateForUndo()
      lastDebouncedSaveTime = now
    }
  }

  // Undo-Funktion
  function undo() {
    const snapshot = historyStore.undo(images.value, texts.value, settings.value)
    if (snapshot) {
      restoreFromSnapshot(snapshot)
    }
  }

  // Redo-Funktion
  function redo() {
    const snapshot = historyStore.redo(images.value, texts.value, settings.value)
    if (snapshot) {
      restoreFromSnapshot(snapshot)
    }
  }

  // Stellt den Zustand aus einem Snapshot wieder her
  function restoreFromSnapshot(snapshot: {
    images: Omit<CollageImage, 'file'>[]
    texts: CollageText[]
    settings: CollageSettings
  }) {
    // Stelle Bilder wieder her (mit File-Referenzen von existierenden Bildern)
    const restoredImages = snapshot.images.map((snapshotImg) => {
      // Finde das ursprüngliche Bild mit dem File-Objekt
      const existingImg = images.value.find((img) => img.url === snapshotImg.url)
      return {
        ...snapshotImg,
        file: existingImg?.file || (null as unknown as File),
      } as CollageImage
    })

    images.value = restoredImages
    texts.value = [...snapshot.texts]

    // Stelle Settings wieder her (deep copy)
    settings.value = JSON.parse(JSON.stringify(snapshot.settings))

    // Deselektiere alles nach Undo/Redo
    selectedImageIds.value = []
    selectedTextId.value = null
    isBackgroundSelected.value = false
  }

  // Computed: Kann Undo/Redo ausgeführt werden?
  const canUndo = computed(() => historyStore.canUndo)
  const canRedo = computed(() => historyStore.canRedo)

  // Backward compatibility: Einzelauswahl (erstes ausgewähltes Bild)
  const selectedImageId = computed(() =>
    selectedImageIds.value.length > 0 ? selectedImageIds.value[0] : null
  )

  const selectedImage = computed(() => images.value.find((img) => img.id === selectedImageId.value))

  // Alle ausgewählten Bilder (für Batch-Bearbeitung)
  const selectedImages = computed(() =>
    images.value.filter((img) => selectedImageIds.value.includes(img.id))
  )

  const selectedText = computed(() => texts.value.find((txt) => txt.id === selectedTextId.value))

  function addImages(files: File[]) {
    saveStateForUndo()
    let loadedCount = 0
    const totalFiles = files.length

    files.forEach((file) => {
      const templateId = crypto.randomUUID()
      const instanceId = crypto.randomUUID()
      const url = URL.createObjectURL(file)

      // Lade das Bild, um die originalen Dimensionen zu erhalten
      const img = new Image()
      img.onload = () => {
        // Aktualisiere beide: Template UND Instanz
        const templateData = images.value.find((i) => i.id === templateId)
        const instanceData = images.value.find((i) => i.id === instanceId)

        if (templateData || instanceData) {
          // Berechne Dimensionen unter Beibehaltung des Seitenverhältnisses
          const maxSize = 300 // Maximale Breite oder Höhe
          const aspectRatio = img.width / img.height

          let width = maxSize
          let height = maxSize

          if (aspectRatio > 1) {
            // Breiteres Bild (Querformat)
            width = maxSize
            height = maxSize / aspectRatio
          } else {
            // Höheres Bild (Hochformat) oder quadratisch
            height = maxSize
            width = maxSize * aspectRatio
          }

          if (templateData) {
            templateData.width = width
            templateData.height = height
          }
          if (instanceData) {
            instanceData.width = width
            instanceData.height = height
          }
        }

        // Layout nach dem Laden aller Bilder erneut anwenden (korrekte Seitenverhältnisse)
        loadedCount++
        if (loadedCount === totalFiles && settings.value.layout !== 'freestyle') {
          applyLayout(settings.value.layout, true)
        }
      }
      img.src = url

      const baseImageData = {
        file,
        url,
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        ...createImageDefaults(),
      }

      // Füge Galerie-Template hinzu (für wiederholte Verwendung)
      images.value.push({
        ...baseImageData,
        id: templateId,
        zIndex: images.value.length,
        isGalleryTemplate: true,
      })

      // Füge Canvas-Instanz hinzu (für direktes Layout)
      images.value.push({
        ...baseImageData,
        id: instanceId,
        zIndex: images.value.length,
        isGalleryTemplate: false,
        sourceId: templateId,
      })
    })

    // Layout sofort anwenden (mit Standard-Dimensionen, wird nach img.onload nochmal korrigiert)
    reapplyLayout()
  }

  function removeImage(id: string, skipUndo = false) {
    if (!skipUndo) saveStateForUndo()
    const index = images.value.findIndex((img) => img.id === id)
    if (index !== -1) {
      const imageToRemove = images.value[index]

      // Prüfe ob andere Bilder diese URL noch verwenden (Template + Instanzen teilen URLs)
      const otherImagesWithSameUrl = images.value.filter(
        (img) => img.id !== id && img.url === imageToRemove.url
      )

      // Nur URL revoken, wenn KEIN anderes Bild diese URL mehr verwendet
      if (otherImagesWithSameUrl.length === 0) {
        URL.revokeObjectURL(imageToRemove.url)
      }

      images.value.splice(index, 1)
    }
    // Entferne ID aus der Mehrfachauswahl
    const selectionIndex = selectedImageIds.value.indexOf(id)
    if (selectionIndex !== -1) {
      selectedImageIds.value.splice(selectionIndex, 1)
    }
  }

  // Zeigt einen Toast mit „Rückgängig"-Aktion nach einer Löschung.
  // Die Löschfunktionen sichern zuvor den Zustand via saveStateForUndo,
  // daher stellt undo() das/die gelöschte(n) Bild(er) wieder her.
  function showUndoToast(messageKey = 'toast.imageDeleted', params?: Record<string, unknown>) {
    const toast = useToastStore()
    toast.showToast(i18n.global.t(messageKey, params ?? {}), 'info', 6000, {
      label: i18n.global.t('toast.undo'),
      handler: () => undo(),
    })
  }

  // Subtile, abschaltbare Benachrichtigung für erfolgreiche Aktionen. Der
  // i18n-Schlüssel dient zugleich als stabiler "Nicht mehr anzeigen"-Schlüssel.
  function notify(messageKey: string, params?: Record<string, unknown>) {
    useToastStore().notify(messageKey, i18n.global.t(messageKey, params ?? {}))
  }

  // Einzelnes Bild löschen und einen „Rückgängig"-Toast anzeigen.
  // Für sofortige Löschungen (rotes ✕ auf Canvas und in der Vorschauleiste),
  // damit kein Bestätigungsdialog nötig ist, das Löschen aber sicher bleibt.
  function removeImageWithUndoToast(id: string) {
    removeImage(id)
    showUndoToast()
  }

  // Alle ausgewählten Bilder entfernen
  function removeSelectedImages() {
    saveStateForUndo()
    const idsToRemove = [...selectedImageIds.value]
    idsToRemove.forEach((id) => removeImage(id, true))
  }

  function updateImage(id: string, updates: Partial<CollageImage>) {
    const image = images.value.find((img) => img.id === id)
    if (image) {
      Object.assign(image, updates)
    }
  }

  // Einfache Auswahl (ersetzt die komplette Auswahl)
  function selectImage(id: string | null) {
    // Nur Hintergrundbild-Auswahl aufheben, wenn ein Bild ausgewählt wird (nicht bei null)
    if (id !== null) {
      isBackgroundSelected.value = false
    }
    if (id === null) {
      selectedImageIds.value = []
    } else {
      selectedImageIds.value = [id]
    }
  }

  // Mehrfachauswahl: Bild zur Auswahl hinzufügen/entfernen (für Ctrl+Click)
  function toggleImageSelection(id: string) {
    const index = selectedImageIds.value.indexOf(id)
    if (index !== -1) {
      // Bild ist bereits ausgewählt - entfernen
      selectedImageIds.value.splice(index, 1)
    } else {
      // Bild zur Auswahl hinzufügen
      selectedImageIds.value.push(id)
    }
  }

  // Alle Canvas-Bilder auswählen
  function selectAllCanvasImages() {
    const canvasImages = images.value.filter((img) => img.isGalleryTemplate !== true)
    selectedImageIds.value = canvasImages.map((img) => img.id)
  }

  // Alle Bilder abwählen
  function deselectAllImages() {
    selectedImageIds.value = []
  }

  // Prüfen, ob ein Bild ausgewählt ist
  function isImageSelected(id: string): boolean {
    return selectedImageIds.value.includes(id)
  }

  // Updates auf alle ausgewählten Bilder anwenden (für Batch-Bearbeitung)
  function updateSelectedImages(updates: Partial<CollageImage>) {
    selectedImageIds.value.forEach((id) => {
      updateImage(id, updates)
    })
  }

  // ========== Stil-Presets ==========

  // Wendet ein vorgefertigtes Effekt-Preset (abgerundete Ecken, Rahmen,
  // Schatten) mit einem Klick auf mehrere Bilder an.
  //
  // Zielauswahl: Sind Canvas-Bilder markiert, werden NUR diese geändert –
  // sonst alle Bilder auf der Leinwand. Galerie-Templates bleiben unberührt.
  //
  // Jedes Preset liefert den KOMPLETTEN Satz an Effekt-Feldern, damit der
  // Wechsel zwischen Presets deterministisch ist: Ein neues Preset entfernt
  // zuverlässig die Effekte des vorherigen (z. B. Polaroid → Abgerundet
  // blendet den weißen Rahmen wieder aus). Die eigentliche Bildbearbeitung
  // (Filter, Position, Rotation) bleibt unangetastet.
  function effectTargets(): CollageImage[] {
    return selectedImageIds.value.length > 0
      ? images.value.filter((img) => selectedImageIds.value.includes(img.id))
      : images.value.filter((img) => img.isGalleryTemplate !== true)
  }

  function applyStylePreset(effects: Partial<CollageImage>) {
    saveStateForUndo()
    const targets = effectTargets()
    targets.forEach((img) => Object.assign(img, effects))
    if (targets.length > 0) notify('toast.presetApplied')
  }

  // Rahmen-Vorlage anwenden: setzt NUR die Rahmen-Felder (Border + Rahmen-
  // schatten + Eckenradius) der Zielbilder und lässt Bildschatten/Filter
  // unangetastet (Object.assign merged). Wirkungsbereich: ausgewählte
  // Canvas-Bilder, sonst alle. Zeigt einen Toast mit „Rückgängig".
  function applyFrameTemplate(effects: Partial<CollageImage>) {
    const targets = effectTargets()
    if (targets.length === 0) return
    saveStateForUndo()
    targets.forEach((img) => Object.assign(img, effects))
    showUndoToast('toast.frameApplied')
  }

  // ========== Layout Funktionen ==========

  function applyLayout(layout: LayoutType, skipUndo = false) {
    if (!skipUndo) saveStateForUndo()
    settings.value.layout = layout
    if (layout !== 'freestyle') {
      const canvasImages = images.value.filter((img) => img.isGalleryTemplate !== true)
      computeLayout(layout, canvasImages, settings.value.width, settings.value.height)
    }
    // Nur bei nutzerausgelöster Layout-Wahl benachrichtigen (nicht bei internen
    // Neuberechnungen mit skipUndo).
    if (!skipUndo) notify('toast.layoutApplied')
  }

  function clearCollage() {
    saveStateForUndo()
    // Sammle nur unique URLs (Templates und Instanzen teilen URLs)
    const uniqueUrls = new Set(images.value.map((img) => img.url))
    uniqueUrls.forEach((url) => URL.revokeObjectURL(url))

    images.value = []
    texts.value = []
    selectedImageIds.value = []
    selectedTextId.value = null
    isBackgroundSelected.value = false
    // Hintergrundbild auch zurücksetzen
    settings.value.backgroundImage = createDefaultBackgroundImage()
    notify('toast.collageCleared')
  }

  function updateSettings(updates: Partial<CollageSettings>) {
    Object.assign(settings.value, updates)
  }

  // Hintergrundbild setzen (von einem Galerie-Bild)
  function setBackgroundImage(imageUrl: string) {
    saveStateForUndo()
    settings.value.backgroundImage = {
      ...createDefaultBackgroundImage(),
      url: imageUrl,
      fit: settings.value.backgroundImage.fit,
    }
    notify('toast.backgroundSet')
  }

  // Hintergrundbild entfernen
  function removeBackgroundImage(skipUndo = false) {
    if (!skipUndo) saveStateForUndo()
    settings.value.backgroundImage.url = null
    isBackgroundSelected.value = false
    if (!skipUndo) notify('toast.backgroundRemoved')
  }

  // Hintergrundbild-Anpassungsmodus ändern
  function setBackgroundImageFit(fit: BackgroundImageFit) {
    settings.value.backgroundImage.fit = fit
  }

  // Hintergrundbild-Einstellungen aktualisieren
  function updateBackgroundImage(updates: Partial<BackgroundImageSettings>) {
    Object.assign(settings.value.backgroundImage, updates)
  }

  // Canvas-Rahmen-Einstellungen aktualisieren
  function updateCanvasBorder(updates: Partial<CanvasBorderSettings>) {
    Object.assign(settings.value.border, updates)
  }

  // Hintergrundbild auswählen/abwählen
  function selectBackground(selected: boolean) {
    isBackgroundSelected.value = selected
    if (selected) {
      // Andere Auswahlen aufheben
      selectedImageIds.value = []
      selectedTextId.value = null
    }
  }

  function setLockAspectRatio(value: boolean) {
    lockAspectRatio.value = value
  }

  function setCanvasZoom(value: number) {
    // Begrenzen zwischen 25% und 400%
    canvasZoom.value = Math.max(0.25, Math.min(4, value))
  }

  function resetCanvasView() {
    canvasZoom.value = 1
  }

  // Grid umschalten
  function toggleGrid() {
    settings.value.gridEnabled = !settings.value.gridEnabled
  }

  function updateText(id: string, updates: Partial<CollageText>) {
    const text = texts.value.find((txt) => txt.id === id)
    if (text) {
      Object.assign(text, updates)
    }
  }

  function reapplyLayout() {
    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout, true)
    }
  }

  // ========== Teilbereiche ==========

  const ctx: CollageContext = {
    images,
    texts,
    settings,
    selectedImageIds,
    selectedGalleryIds,
    selectedTextId,
    isBackgroundSelected,
    selectedImages,
    saveStateForUndo,
    saveStateForUndoDebounced,
    notify,
    showUndoToast,
    updateImage,
    updateText,
    removeImage,
    applyLayout,
    reapplyLayout,
  }

  const gallery = useGallery(ctx)
  const arrange = useArrange(ctx)
  const textActions = useTexts(ctx)
  const canvasResize = useCanvasResize(ctx)
  const templateIO = useTemplateIO(ctx)

  return {
    images,
    // Mehrfachauswahl
    selectedImageIds,
    selectedImages,
    selectedImageId,
    selectedImage,
    // Text
    texts,
    selectedTextId,
    selectedText,
    // Einstellungen
    settings,
    lockAspectRatio,
    canvasZoom,
    // Bild-Funktionen
    addImages,
    removeImage,
    removeImageWithUndoToast,
    showUndoToast,
    removeSelectedImages,
    updateImage,
    updateSelectedImages,
    applyStylePreset,
    applyFrameTemplate,
    selectImage,
    toggleImageSelection,
    selectAllCanvasImages,
    deselectAllImages,
    isImageSelected,
    // Galerie-Auswahl
    selectedGalleryIds,
    toggleGallerySelection: gallery.toggleGallerySelection,
    selectAllGalleryImages: gallery.selectAllGalleryImages,
    deselectAllGalleryImages: gallery.deselectAllGalleryImages,
    isGalleryImageSelected: gallery.isGalleryImageSelected,
    addSelectedGalleryToCanvas: gallery.addSelectedGalleryToCanvas,
    removeSelectedGalleryImages: gallery.removeSelectedGalleryImages,
    removeGalleryImage: gallery.removeGalleryImage,
    countGalleryImageInstances: gallery.countGalleryImageInstances,
    // Text-Funktionen
    addText: textActions.addText,
    removeText: textActions.removeText,
    updateText,
    selectText: textActions.selectText,
    rotateText: textActions.rotateText,
    bringTextToFront: textActions.bringTextToFront,
    sendTextToBack: textActions.sendTextToBack,
    // Layout & Einstellungen
    applyLayout,
    clearCollage,
    updateSettings,
    resizeCanvas: canvasResize.resizeCanvas,
    repositionContent: canvasResize.repositionContent,
    // Hintergrundbild
    isBackgroundSelected,
    setBackgroundImage,
    removeBackgroundImage,
    setBackgroundImageFit,
    updateBackgroundImage,
    updateCanvasBorder,
    selectBackground,
    setLockAspectRatio,
    setCanvasZoom,
    resetCanvasView,
    duplicateImageToPosition: arrange.duplicateImageToPosition,
    duplicateSelectedImages: arrange.duplicateSelectedImages,
    bringSelectedToFront: arrange.bringSelectedToFront,
    sendSelectedToBack: arrange.sendSelectedToBack,
    reorderCanvasImages: arrange.reorderCanvasImages,
    alignSelectedImages: arrange.alignSelectedImages,
    distributeSelectedImages: arrange.distributeSelectedImages,
    rotateSelectedImages: arrange.rotateSelectedImages,
    moveSelectedImages: arrange.moveSelectedImages,
    moveSelectedText: arrange.moveSelectedText,
    toggleGrid,
    saveAsTemplate: templateIO.saveAsTemplate,
    loadFromTemplate: templateIO.loadFromTemplate,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    saveStateForUndo,
    saveStateForUndoDebounced,
  }
})
