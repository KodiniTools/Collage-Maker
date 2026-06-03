import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CollageImage,
  CollageText,
  CollageSettings,
  LayoutType,
  BackgroundImageFit,
  BackgroundImageSettings,
} from '@/types'
import { computeLayout } from '@/lib/layouts'
import { useHistoryStore } from '@/stores/history'
import { UNDO_DEBOUNCE_MS } from '@/config/constants'

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

  const settings = ref<CollageSettings>({
    width: 700,
    height: 740,
    backgroundColor: '#ffffff',
    backgroundImage: {
      url: null,
      fit: 'cover',
      opacity: 1,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    },
    layout: 'grid-3x3',
    gridEnabled: false,
    gridSize: 50,
  })

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
        // Bildbearbeitungs-Filter (Standard = keine Anpassung)
        brightness: 100,
        contrast: 100,
        highlights: 0,
        shadows: 0,
        saturation: 100,
        warmth: 0,
        sharpness: 0,
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
      })
    })

    // Layout sofort anwenden (mit Standard-Dimensionen, wird nach img.onload nochmal korrigiert)
    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout, true)
    }
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

  // ========== Galerie-Auswahl Funktionen ==========

  // Galerie-Bild zur Auswahl hinzufügen/entfernen
  function toggleGallerySelection(id: string) {
    const index = selectedGalleryIds.value.indexOf(id)
    if (index !== -1) {
      selectedGalleryIds.value.splice(index, 1)
    } else {
      selectedGalleryIds.value.push(id)
    }
  }

  // Alle Galerie-Bilder auswählen
  function selectAllGalleryImages() {
    const galleryImages = images.value.filter((img) => img.isGalleryTemplate === true)
    selectedGalleryIds.value = galleryImages.map((img) => img.id)
  }

  // Alle Galerie-Bilder abwählen
  function deselectAllGalleryImages() {
    selectedGalleryIds.value = []
  }

  // Prüfen, ob ein Galerie-Bild ausgewählt ist
  function isGalleryImageSelected(id: string): boolean {
    return selectedGalleryIds.value.includes(id)
  }

  // Ausgewählte Galerie-Bilder zum Canvas hinzufügen
  function addSelectedGalleryToCanvas() {
    saveStateForUndo()
    const selectedGalleryImages = images.value.filter(
      (img) => img.isGalleryTemplate === true && selectedGalleryIds.value.includes(img.id)
    )

    if (selectedGalleryImages.length === 0) return

    const newIds: string[] = []

    selectedGalleryImages.forEach((sourceImage, index) => {
      const newId = crypto.randomUUID()
      const maxZ = Math.max(...images.value.map((img) => img.zIndex), 0)

      // Erstelle Canvas-Instanz mit Versatz für jedes Bild
      images.value.push({
        id: newId,
        file: sourceImage.file,
        url: sourceImage.url,
        x: 50 + index * 20,
        y: 50 + index * 20,
        width: sourceImage.width,
        height: sourceImage.height,
        rotation: 0,
        zIndex: maxZ + 1 + index,
        opacity: 1,
        borderRadius: 0,
        borderEnabled: false,
        borderWidth: 4,
        borderColor: '#000000',
        borderStyle: 'solid',
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
        isGalleryTemplate: false,
      })

      newIds.push(newId)
    })

    // Galerie-Auswahl zurücksetzen
    selectedGalleryIds.value = []

    // Neue Canvas-Bilder auswählen
    selectedImageIds.value = newIds

    // Layout anwenden wenn nicht Freestyle
    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout, true)
    }
  }

  // Ausgewählte Galerie-Bilder entfernen (Template + alle Canvas-Instanzen)
  function removeSelectedGalleryImages() {
    saveStateForUndo()
    const idsToRemove = [...selectedGalleryIds.value]

    idsToRemove.forEach((galleryId) => {
      const galleryImage = images.value.find((img) => img.id === galleryId)
      if (galleryImage) {
        // Finde alle Canvas-Instanzen mit der gleichen URL
        const relatedImages = images.value.filter((img) => img.url === galleryImage.url)
        relatedImages.forEach((img) => removeImage(img.id, true))
      }
    })

    selectedGalleryIds.value = []
  }

  // ========== Layout Funktionen ==========

  function applyLayout(layout: LayoutType, skipUndo = false) {
    if (!skipUndo) saveStateForUndo()
    settings.value.layout = layout
    if (layout === 'freestyle') return
    const canvasImages = images.value.filter((img) => img.isGalleryTemplate !== true)
    computeLayout(layout, canvasImages, settings.value.width, settings.value.height)
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
    settings.value.backgroundImage = {
      url: null,
      fit: 'cover',
      opacity: 1,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    }
  }

  function updateSettings(updates: Partial<CollageSettings>) {
    Object.assign(settings.value, updates)
  }

  // Hintergrundbild setzen (von einem Galerie-Bild)
  function setBackgroundImage(imageUrl: string) {
    saveStateForUndo()
    settings.value.backgroundImage = {
      url: imageUrl,
      fit: settings.value.backgroundImage.fit,
      opacity: 1,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    }
  }

  // Hintergrundbild entfernen
  function removeBackgroundImage(skipUndo = false) {
    if (!skipUndo) saveStateForUndo()
    settings.value.backgroundImage.url = null
    isBackgroundSelected.value = false
  }

  // Hintergrundbild-Anpassungsmodus ändern
  function setBackgroundImageFit(fit: BackgroundImageFit) {
    settings.value.backgroundImage.fit = fit
  }

  // Hintergrundbild-Einstellungen aktualisieren
  function updateBackgroundImage(updates: Partial<BackgroundImageSettings>) {
    Object.assign(settings.value.backgroundImage, updates)
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

  function duplicateImageToPosition(sourceId: string, x: number, y: number) {
    saveStateForUndo()
    const sourceImage = images.value.find((img) => img.id === sourceId)
    if (!sourceImage) return

    const newId = crypto.randomUUID()
    const maxZ = Math.max(...images.value.map((img) => img.zIndex), 0)

    // Erstelle eine Canvas-Instanz (kein Template) an der neuen Position
    images.value.push({
      id: newId,
      file: sourceImage.file,
      url: sourceImage.url, // Verwende dieselbe URL (keine Duplikation des Blobs nötig)
      x: x,
      y: y,
      width: sourceImage.width,
      height: sourceImage.height,
      rotation: 0,
      zIndex: maxZ + 1,
      opacity: 1,
      borderRadius: 0,
      borderEnabled: false,
      borderWidth: 4,
      borderColor: '#000000',
      borderStyle: 'solid',
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
      // Bildbearbeitungs-Filter (Standard = keine Anpassung)
      brightness: 100,
      contrast: 100,
      highlights: 0,
      shadows: 0,
      saturation: 100,
      warmth: 0,
      sharpness: 0,
      // Als Canvas-Instanz markieren (kein Galerie-Template)
      isGalleryTemplate: false,
    })

    // Selektiere das neue Bild (ersetzt vorherige Auswahl)
    selectedImageIds.value = [newId]
  }

  // Ausgewählte Bilder duplizieren (für Ctrl+D)
  function duplicateSelectedImages() {
    saveStateForUndo()
    const imagesToDuplicate = [...selectedImages.value]
    const newIds: string[] = []

    imagesToDuplicate.forEach((sourceImage) => {
      const newId = crypto.randomUUID()
      const maxZ = Math.max(...images.value.map((img) => img.zIndex), 0)

      // Erstelle Kopie mit Versatz
      images.value.push({
        ...sourceImage,
        id: newId,
        x: sourceImage.x + 20,
        y: sourceImage.y + 20,
        zIndex: maxZ + 1,
        isGalleryTemplate: false,
      })

      newIds.push(newId)
    })

    // Neue Bilder auswählen
    if (newIds.length > 0) {
      selectedImageIds.value = newIds
    }
  }

  // Ausgewählte Bilder nach vorne bringen
  function bringSelectedToFront() {
    if (selectedImageIds.value.length === 0) return
    saveStateForUndo()

    const maxZ = Math.max(...images.value.map((img) => img.zIndex), 0)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: maxZ + 1 + index })
    })
  }

  // Ausgewählte Bilder nach hinten senden
  function sendSelectedToBack() {
    if (selectedImageIds.value.length === 0) return
    saveStateForUndo()

    const minZ = Math.min(...images.value.map((img) => img.zIndex), 0)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: minZ - 1 - index })
    })
  }

  // Ausgewählte Bilder um Grad drehen
  function rotateSelectedImages(degrees: number) {
    saveStateForUndo()
    selectedImageIds.value.forEach((id) => {
      const img = images.value.find((i) => i.id === id)
      if (img) {
        updateImage(id, { rotation: (img.rotation + degrees) % 360 })
      }
    })
  }

  // Ausgewählte Bilder verschieben
  function moveSelectedImages(dx: number, dy: number) {
    saveStateForUndoDebounced()
    selectedImageIds.value.forEach((id) => {
      const img = images.value.find((i) => i.id === id)
      if (img) {
        updateImage(id, { x: img.x + dx, y: img.y + dy })
      }
    })
  }

  // Ausgewählten Text verschieben
  function moveSelectedText(dx: number, dy: number) {
    saveStateForUndoDebounced()
    if (selectedTextId.value) {
      const txt = texts.value.find((t) => t.id === selectedTextId.value)
      if (txt) {
        updateText(selectedTextId.value, { x: txt.x + dx, y: txt.y + dy })
      }
    }
  }

  // Grid umschalten
  function toggleGrid() {
    settings.value.gridEnabled = !settings.value.gridEnabled
  }

  // Text-Funktionen
  function addText(text: string = 'Neuer Text') {
    saveStateForUndo()
    const maxZ = Math.max(
      ...images.value.map((img) => img.zIndex),
      ...texts.value.map((txt) => txt.zIndex),
      0
    )

    const newText: CollageText = {
      id: crypto.randomUUID(),
      text,
      x: settings.value.width / 2 - 100,
      y: settings.value.height / 2,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      rotation: 0,
      zIndex: maxZ + 1,
      fontWeight: 400,
      fontStyle: 'normal',
      textAlign: 'center',
      shadowEnabled: false,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowBlur: 4,
      shadowColor: '#000000',
      // Textumrandung (Stroke) Defaults
      strokeEnabled: false,
      strokeColor: '#ffffff',
      strokeWidth: 2,
      // Buchstabenabstand Default
      letterSpacing: 0,
    }

    texts.value.push(newText)
    selectedTextId.value = newText.id
    selectedImageIds.value = []
  }

  function removeText(id: string) {
    saveStateForUndo()
    const index = texts.value.findIndex((txt) => txt.id === id)
    if (index !== -1) {
      texts.value.splice(index, 1)
    }
    if (selectedTextId.value === id) {
      selectedTextId.value = null
    }
  }

  function updateText(id: string, updates: Partial<CollageText>) {
    const text = texts.value.find((txt) => txt.id === id)
    if (text) {
      Object.assign(text, updates)
    }
  }

  function selectText(id: string | null) {
    selectedTextId.value = id
    if (id !== null) {
      selectedImageIds.value = []
    }
  }

  // Template-Methoden (NEU für Vorlagenbibliothek)
  async function saveAsTemplate(name: string, description: string) {
    // Screenshot des aktuellen Canvas erstellen (als Thumbnail)
    const canvas = document.querySelector('canvas')
    let thumbnail = ''
    if (canvas) {
      try {
        thumbnail = canvas.toDataURL('image/jpeg', 0.3)
      } catch (error) {
        console.warn('Could not create thumbnail:', error)
      }
    }

    return {
      id: `template-user-${Date.now()}`,
      name,
      description,
      thumbnail,
      category: 'user' as const,
      createdAt: Date.now(),
      collageState: {
        settings: { ...settings.value },
        layout: settings.value.layout,
        images: images.value.map((img) => ({ ...img })),
        texts: texts.value.map((txt) => ({ ...txt })),
      },
    }
  }

  function loadFromTemplate(template: any) {
    // Lösche alle aktuellen Daten
    images.value = []
    texts.value = []
    selectedImageIds.value = []
    selectedTextId.value = null

    // Lade Template-Daten
    if (template.collageState && template.collageState.settings) {
      const ts = template.collageState.settings

      // Aktualisiere Settings einzeln, um Reaktivität zu erhalten
      settings.value.width = ts.width ?? 700
      settings.value.height = ts.height ?? 740
      settings.value.backgroundColor = ts.backgroundColor ?? '#ffffff'
      settings.value.layout = ts.layout ?? 'freestyle'
      settings.value.gridEnabled = ts.gridEnabled ?? false
      settings.value.gridSize = ts.gridSize ?? 50

      // BackgroundImage mit Defaults
      if (ts.backgroundImage) {
        settings.value.backgroundImage.url = ts.backgroundImage.url ?? null
        settings.value.backgroundImage.fit = ts.backgroundImage.fit ?? 'cover'
        settings.value.backgroundImage.opacity = ts.backgroundImage.opacity ?? 1
        settings.value.backgroundImage.brightness = ts.backgroundImage.brightness ?? 100
        settings.value.backgroundImage.contrast = ts.backgroundImage.contrast ?? 100
        settings.value.backgroundImage.saturation = ts.backgroundImage.saturation ?? 100
        settings.value.backgroundImage.blur = ts.backgroundImage.blur ?? 0
      } else {
        // Reset backgroundImage zu Defaults
        settings.value.backgroundImage.url = null
        settings.value.backgroundImage.fit = 'cover'
        settings.value.backgroundImage.opacity = 1
        settings.value.backgroundImage.brightness = 100
        settings.value.backgroundImage.contrast = 100
        settings.value.backgroundImage.saturation = 100
        settings.value.backgroundImage.blur = 0
      }
    }
  }

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
    removeSelectedImages,
    updateImage,
    updateSelectedImages,
    selectImage,
    toggleImageSelection,
    selectAllCanvasImages,
    deselectAllImages,
    isImageSelected,
    // Galerie-Auswahl
    selectedGalleryIds,
    toggleGallerySelection,
    selectAllGalleryImages,
    deselectAllGalleryImages,
    isGalleryImageSelected,
    addSelectedGalleryToCanvas,
    removeSelectedGalleryImages,
    // Text-Funktionen
    addText,
    removeText,
    updateText,
    selectText,
    // Layout & Einstellungen
    applyLayout,
    clearCollage,
    updateSettings,
    // Hintergrundbild
    isBackgroundSelected,
    setBackgroundImage,
    removeBackgroundImage,
    setBackgroundImageFit,
    updateBackgroundImage,
    selectBackground,
    setLockAspectRatio,
    setCanvasZoom,
    resetCanvasView,
    duplicateImageToPosition,
    duplicateSelectedImages,
    bringSelectedToFront,
    sendSelectedToBack,
    rotateSelectedImages,
    moveSelectedImages,
    moveSelectedText,
    toggleGrid,
    saveAsTemplate,
    loadFromTemplate,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    saveStateForUndo,
    saveStateForUndoDebounced,
  }
})
