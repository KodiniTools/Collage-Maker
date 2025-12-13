import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollageImage, CollageText, CollageSettings, LayoutType, BackgroundImageFit } from '@/types'

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

  const settings = ref<CollageSettings>({
    width: 700,
    height: 740,
    backgroundColor: '#ffffff',
    backgroundImage: null,
    backgroundImageFit: 'cover',
    layout: 'freestyle',
    gridEnabled: false,
    gridSize: 50
  })

  // Backward compatibility: Einzelauswahl (erstes ausgewähltes Bild)
  const selectedImageId = computed(() =>
    selectedImageIds.value.length > 0 ? selectedImageIds.value[0] : null
  )

  const selectedImage = computed(() =>
    images.value.find(img => img.id === selectedImageId.value)
  )

  // Alle ausgewählten Bilder (für Batch-Bearbeitung)
  const selectedImages = computed(() =>
    images.value.filter(img => selectedImageIds.value.includes(img.id))
  )

  const selectedText = computed(() =>
    texts.value.find(txt => txt.id === selectedTextId.value)
  )

  function addImages(files: File[]) {
    files.forEach(file => {
      const templateId = crypto.randomUUID()
      const instanceId = crypto.randomUUID()
      const url = URL.createObjectURL(file)

      // Lade das Bild, um die originalen Dimensionen zu erhalten
      const img = new Image()
      img.onload = () => {
        // Aktualisiere beide: Template UND Instanz
        const templateData = images.value.find(i => i.id === templateId)
        const instanceData = images.value.find(i => i.id === instanceId)

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
        sharpness: 0
      }

      // Füge Galerie-Template hinzu (für wiederholte Verwendung)
      images.value.push({
        ...baseImageData,
        id: templateId,
        zIndex: images.value.length,
        isGalleryTemplate: true
      })

      // Füge Canvas-Instanz hinzu (für direktes Layout)
      images.value.push({
        ...baseImageData,
        id: instanceId,
        zIndex: images.value.length,
        isGalleryTemplate: false
      })
    })

    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout)
    }
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const imageToRemove = images.value[index]

      // Prüfe ob andere Bilder diese URL noch verwenden (Template + Instanzen teilen URLs)
      const otherImagesWithSameUrl = images.value.filter(
        img => img.id !== id && img.url === imageToRemove.url
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
    const idsToRemove = [...selectedImageIds.value]
    idsToRemove.forEach(id => removeImage(id))
  }

  function updateImage(id: string, updates: Partial<CollageImage>) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      Object.assign(image, updates)
    }
  }

  // Einfache Auswahl (ersetzt die komplette Auswahl)
  function selectImage(id: string | null) {
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
    const canvasImages = images.value.filter(img => img.isGalleryTemplate !== true)
    selectedImageIds.value = canvasImages.map(img => img.id)
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
    selectedImageIds.value.forEach(id => {
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
    const galleryImages = images.value.filter(img => img.isGalleryTemplate === true)
    selectedGalleryIds.value = galleryImages.map(img => img.id)
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
    const selectedGalleryImages = images.value.filter(
      img => img.isGalleryTemplate === true && selectedGalleryIds.value.includes(img.id)
    )

    if (selectedGalleryImages.length === 0) return

    const newIds: string[] = []

    selectedGalleryImages.forEach((sourceImage, index) => {
      const newId = crypto.randomUUID()
      const maxZ = Math.max(...images.value.map(img => img.zIndex), 0)

      // Erstelle Canvas-Instanz mit Versatz für jedes Bild
      images.value.push({
        id: newId,
        file: sourceImage.file,
        url: sourceImage.url,
        x: 50 + (index * 20),
        y: 50 + (index * 20),
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
        isGalleryTemplate: false
      })

      newIds.push(newId)
    })

    // Galerie-Auswahl zurücksetzen
    selectedGalleryIds.value = []

    // Neue Canvas-Bilder auswählen
    selectedImageIds.value = newIds

    // Layout anwenden wenn nicht Freestyle
    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout)
    }
  }

  // Ausgewählte Galerie-Bilder entfernen (Template + alle Canvas-Instanzen)
  function removeSelectedGalleryImages() {
    const idsToRemove = [...selectedGalleryIds.value]

    idsToRemove.forEach(galleryId => {
      const galleryImage = images.value.find(img => img.id === galleryId)
      if (galleryImage) {
        // Finde alle Canvas-Instanzen mit der gleichen URL
        const relatedImages = images.value.filter(img => img.url === galleryImage.url)
        relatedImages.forEach(img => removeImage(img.id))
      }
    })

    selectedGalleryIds.value = []
  }

  // ========== Layout Funktionen ==========

  function applyLayout(layout: LayoutType) {
    settings.value.layout = layout

    if (layout === 'freestyle') return

    const w = settings.value.width
    const h = settings.value.height
    const padding = 5

    // NUR Canvas-Instanzen layouten (keine Gallery-Templates)
    const canvasImages = images.value.filter(img => img.isGalleryTemplate !== true)

    // Hilfsfunktion zum Einpassen von Bildern mit Seitenverhältnis (zentriert in Zelle)
    function fitImage(img: any, cellX: number, cellY: number, cellWidth: number, cellHeight: number) {
      const aspectRatio = img.width / img.height
      const availableWidth = cellWidth - padding * 2
      const availableHeight = cellHeight - padding * 2

      let newWidth: number
      let newHeight: number

      if (availableWidth / availableHeight > aspectRatio) {
        // Zelle ist breiter als Bild - Höhe bestimmt
        newHeight = availableHeight
        newWidth = availableHeight * aspectRatio
      } else {
        // Zelle ist höher als Bild - Breite bestimmt
        newWidth = availableWidth
        newHeight = availableWidth / aspectRatio
      }

      // Bild in der Zelle zentrieren
      const offsetX = (cellWidth - newWidth) / 2
      const offsetY = (cellHeight - newHeight) / 2

      img.x = cellX + offsetX
      img.y = cellY + offsetY
      img.width = newWidth
      img.height = newHeight
      img.rotation = 0
    }

    // Grid-basierte Layouts (bestehend)
    if (layout === 'grid-2x2' || layout === 'grid-3x3' || layout === 'grid-2x3') {
      const cols = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 2
      const rows = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 3

      const cellWidth = w / cols
      const cellHeight = h / rows

      canvasImages.forEach((img, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        fitImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight)
      })
    }
    // Magazin-Layout: Großes Bild links, kleinere rechts gestapelt
    else if (layout === 'magazine') {
      const rightImages = canvasImages.length - 1
      const rightRows = Math.max(rightImages, 1)

      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Großes Hauptbild links (2/3 Breite, volle Höhe)
          fitImage(img, 0, 0, w * 0.65, h)
        } else {
          // Bilder rechts gleichmäßig vertikal verteilen
          const rightIndex = index - 1
          const rowHeight = h / rightRows
          fitImage(img, w * 0.65, rightIndex * rowHeight, w * 0.35, rowHeight)
        }
      })
    }
    // Spotlight-Layout: Ein großes Bild oben, 3 kleinere unten
    else if (layout === 'spotlight') {
      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Großes Spotlight-Bild oben (70% Höhe)
          fitImage(img, 0, 0, w, h * 0.7)
        } else if (index >= 1 && index <= 3) {
          // 3 kleinere Bilder unten nebeneinander
          const col = index - 1
          fitImage(img, (w / 3) * col, h * 0.7, w / 3, h * 0.3)
        } else {
          // Weitere Bilder in zweiter Reihe unten
          const col = (index - 4) % 3
          fitImage(img, (w / 3) * col, h * 0.85, w / 3, h * 0.15)
        }
      })
    }
    // Hero-Layout: Großes Bild oben, kleinere unten in einer Reihe
    else if (layout === 'hero') {
      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Hero-Bild oben (60% Höhe)
          fitImage(img, 0, 0, w, h * 0.6)
        } else {
          // Kleinere Bilder unten nebeneinander
          const cols = Math.max(canvasImages.length - 1, 1)
          const col = index - 1
          fitImage(img, (w / cols) * col, h * 0.6, w / cols, h * 0.4)
        }
      })
    }
    // Sidebar-Layout: Schmale Sidebar links, großer Bereich rechts
    else if (layout === 'sidebar') {
      const sidebarWidth = w * 0.25
      const mainWidth = w * 0.75
      const sidebarCount = Math.min(canvasImages.length, 3)
      const mainCount = Math.max(canvasImages.length - 3, 0)

      canvasImages.forEach((img, index) => {
        if (index < sidebarCount) {
          // Sidebar-Bilder links (gleichmäßig verteilt)
          const sidebarRows = sidebarCount
          fitImage(img, 0, (h / sidebarRows) * index, sidebarWidth, h / sidebarRows)
        } else if (mainCount === 1) {
          // Ein großes Bild rechts
          fitImage(img, sidebarWidth, 0, mainWidth, h)
        } else {
          // Mehrere Bilder rechts in einem Grid
          const rightIndex = index - sidebarCount
          const cols = mainCount <= 2 ? 1 : 2
          const rows = Math.ceil(mainCount / cols)
          const col = rightIndex % cols
          const row = Math.floor(rightIndex / cols)
          fitImage(img, sidebarWidth + (mainWidth / cols) * col, (h / rows) * row, mainWidth / cols, h / rows)
        }
      })
    }
    // Mosaic-Layout: Verschiedene Größen in Mosaic-Anordnung
    else if (layout === 'mosaic') {
      const positions = [
        { x: 0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.25, h: 0.33 },
        { x: 0.75, y: 0, w: 0.25, h: 0.33 },
        { x: 0.5, y: 0.33, w: 0.5, h: 0.34 },
        { x: 0, y: 0.5, w: 0.33, h: 0.5 },
        { x: 0.33, y: 0.5, w: 0.34, h: 0.5 },
        { x: 0.67, y: 0.67, w: 0.33, h: 0.33 }
      ]

      canvasImages.forEach((img, index) => {
        const pos = positions[index % positions.length]
        fitImage(img, w * pos.x, h * pos.y, w * pos.w, h * pos.h)
      })
    }
    // Diagonal-Layout: Bilder diagonal angeordnet
    else if (layout === 'diagonal') {
      const imgSize = Math.min(w, h) * 0.4

      canvasImages.forEach((img, index) => {
        if (index < 4) {
          const offsetX = (w - imgSize) * (index / 3)
          const offsetY = (h - imgSize) * (index / 3)
          fitImage(img, offsetX, offsetY, imgSize, imgSize)
        } else {
          // Weitere Bilder in Ecken
          const corner = (index - 4) % 4
          const x = corner % 2 === 0 ? 0 : w - imgSize / 2
          const y = corner < 2 ? 0 : h - imgSize / 2
          fitImage(img, x, y, imgSize / 2, imgSize / 2)
        }
      })
    }
    // Panorama-Layout: Breites Bild oben, kleinere Bilder darunter in einer Reihe
    else if (layout === 'panorama') {
      const topHeight = h * 0.55
      const bottomHeight = h * 0.45
      const bottomCount = Math.max(canvasImages.length - 1, 1)

      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Großes Panoramabild oben
          fitImage(img, 0, 0, w, topHeight)
        } else {
          // Bilder unten in einer Reihe
          const col = index - 1
          const colWidth = w / bottomCount
          fitImage(img, colWidth * col, topHeight, colWidth, bottomHeight)
        }
      })
    }
    // Focus-Layout: Großes zentrales Bild, kleinere drumherum
    else if (layout === 'focus') {
      const centerSize = Math.min(w, h) * 0.55
      const centerX = (w - centerSize) / 2
      const centerY = (h - centerSize) / 2
      const cornerSize = Math.min(w, h) * 0.25

      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Großes zentriertes Hauptbild
          fitImage(img, centerX, centerY, centerSize, centerSize)
        } else {
          // Kleinere Bilder in den Ecken und an den Seiten
          const positions = [
            { x: 0, y: 0 }, // Oben links
            { x: w - cornerSize, y: 0 }, // Oben rechts
            { x: 0, y: h - cornerSize }, // Unten links
            { x: w - cornerSize, y: h - cornerSize }, // Unten rechts
            { x: (w - cornerSize) / 2, y: 0 }, // Oben mitte
            { x: (w - cornerSize) / 2, y: h - cornerSize }, // Unten mitte
            { x: 0, y: (h - cornerSize) / 2 }, // Links mitte
            { x: w - cornerSize, y: (h - cornerSize) / 2 } // Rechts mitte
          ]
          const pos = positions[(index - 1) % positions.length]
          fitImage(img, pos.x, pos.y, cornerSize, cornerSize)
        }
      })
    }
    // Triptych-Layout: Drei Spalten, mittlere ist größer
    else if (layout === 'triptych') {
      const sideWidth = w * 0.25
      const centerWidth = w * 0.5

      canvasImages.forEach((img, index) => {
        if (index === 0) {
          // Großes mittleres Bild
          fitImage(img, sideWidth, 0, centerWidth, h)
        } else if (index === 1) {
          // Linkes Bild
          fitImage(img, 0, 0, sideWidth, h)
        } else if (index === 2) {
          // Rechtes Bild
          fitImage(img, sideWidth + centerWidth, 0, sideWidth, h)
        } else {
          // Weitere Bilder: verteile auf linke und rechte Spalte
          const sideIndex = index - 3
          const isLeft = sideIndex % 2 === 0
          const rowIndex = Math.floor(sideIndex / 2)
          const rowsPerSide = Math.ceil((canvasImages.length - 3) / 2)
          const rowHeight = h / Math.max(rowsPerSide, 1)

          if (isLeft) {
            fitImage(img, 0, rowHeight * rowIndex, sideWidth, rowHeight)
          } else {
            fitImage(img, sideWidth + centerWidth, rowHeight * rowIndex, sideWidth, rowHeight)
          }
        }
      })
    }
    // Masonry-Layout: Pinterest-ähnlich mit variablen Höhen
    else if (layout === 'masonry') {
      const cols = 3
      const colWidth = w / cols
      const colHeights = [0, 0, 0] // Track der Höhe jeder Spalte

      // Vordefinierte Höhenvariationen für visuelles Interesse
      const heightVariations = [0.35, 0.45, 0.4, 0.5, 0.35, 0.45, 0.4, 0.3, 0.45]

      canvasImages.forEach((img, index) => {
        // Finde die kürzeste Spalte
        const minHeight = Math.min(...colHeights)
        const col = colHeights.indexOf(minHeight)

        // Berechne die Höhe für dieses Bild
        const cellHeight = h * heightVariations[index % heightVariations.length]

        fitImage(img, col * colWidth, colHeights[col], colWidth, cellHeight)

        // Update Spalten-Höhe
        colHeights[col] += cellHeight
      })
    }
  }

  function clearCollage() {
    // Sammle nur unique URLs (Templates und Instanzen teilen URLs)
    const uniqueUrls = new Set(images.value.map(img => img.url))
    uniqueUrls.forEach(url => URL.revokeObjectURL(url))

    images.value = []
    texts.value = []
    selectedImageIds.value = []
    selectedTextId.value = null
    // Hintergrundbild auch zurücksetzen
    settings.value.backgroundImage = null
  }

  function updateSettings(updates: Partial<CollageSettings>) {
    Object.assign(settings.value, updates)
  }

  // Hintergrundbild setzen (von einem Galerie-Bild)
  function setBackgroundImage(imageUrl: string) {
    settings.value.backgroundImage = imageUrl
  }

  // Hintergrundbild entfernen
  function removeBackgroundImage() {
    settings.value.backgroundImage = null
  }

  // Hintergrundbild-Anpassungsmodus ändern
  function setBackgroundImageFit(fit: BackgroundImageFit) {
    settings.value.backgroundImageFit = fit
  }

  function setLockAspectRatio(value: boolean) {
    lockAspectRatio.value = value
  }

  function setCanvasZoom(value: number) {
    // Begrenzen zwischen 25% und 200%
    canvasZoom.value = Math.max(0.25, Math.min(2, value))
  }

  function resetCanvasView() {
    canvasZoom.value = 1
  }

  function duplicateImageToPosition(sourceId: string, x: number, y: number) {
    const sourceImage = images.value.find(img => img.id === sourceId)
    if (!sourceImage) return

    const newId = crypto.randomUUID()
    const maxZ = Math.max(...images.value.map(img => img.zIndex), 0)

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
      isGalleryTemplate: false
    })

    // Selektiere das neue Bild (ersetzt vorherige Auswahl)
    selectedImageIds.value = [newId]
  }

  // Ausgewählte Bilder duplizieren (für Ctrl+D)
  function duplicateSelectedImages() {
    const imagesToDuplicate = [...selectedImages.value]
    const newIds: string[] = []

    imagesToDuplicate.forEach(sourceImage => {
      const newId = crypto.randomUUID()
      const maxZ = Math.max(...images.value.map(img => img.zIndex), 0)

      // Erstelle Kopie mit Versatz
      images.value.push({
        ...sourceImage,
        id: newId,
        x: sourceImage.x + 20,
        y: sourceImage.y + 20,
        zIndex: maxZ + 1,
        isGalleryTemplate: false
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

    const maxZ = Math.max(...images.value.map(img => img.zIndex), 0)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: maxZ + 1 + index })
    })
  }

  // Ausgewählte Bilder nach hinten senden
  function sendSelectedToBack() {
    if (selectedImageIds.value.length === 0) return

    const minZ = Math.min(...images.value.map(img => img.zIndex), 0)
    selectedImageIds.value.forEach((id, index) => {
      updateImage(id, { zIndex: minZ - 1 - index })
    })
  }

  // Ausgewählte Bilder um Grad drehen
  function rotateSelectedImages(degrees: number) {
    selectedImageIds.value.forEach(id => {
      const img = images.value.find(i => i.id === id)
      if (img) {
        updateImage(id, { rotation: (img.rotation + degrees) % 360 })
      }
    })
  }

  // Ausgewählte Bilder verschieben
  function moveSelectedImages(dx: number, dy: number) {
    selectedImageIds.value.forEach(id => {
      const img = images.value.find(i => i.id === id)
      if (img) {
        updateImage(id, { x: img.x + dx, y: img.y + dy })
      }
    })
  }

  // Ausgewählten Text verschieben
  function moveSelectedText(dx: number, dy: number) {
    if (selectedTextId.value) {
      const txt = texts.value.find(t => t.id === selectedTextId.value)
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
    const maxZ = Math.max(
      ...images.value.map(img => img.zIndex),
      ...texts.value.map(txt => txt.zIndex),
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
      shadowColor: '#000000'
    }

    texts.value.push(newText)
    selectedTextId.value = newText.id
    selectedImageIds.value = []
  }

  function removeText(id: string) {
    const index = texts.value.findIndex(txt => txt.id === id)
    if (index !== -1) {
      texts.value.splice(index, 1)
    }
    if (selectedTextId.value === id) {
      selectedTextId.value = null
    }
  }

  function updateText(id: string, updates: Partial<CollageText>) {
    const text = texts.value.find(txt => txt.id === id)
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
        images: images.value.map(img => ({ ...img })),
        texts: texts.value.map(txt => ({ ...txt }))
      }
    }
  }

  function loadFromTemplate(template: any) {
    // Lösche alle aktuellen Daten
    images.value = []
    texts.value = []
    selectedImageIds.value = []
    selectedTextId.value = null

    // Lade Template-Daten
    if (template.collageState) {
      settings.value = { ...template.collageState.settings }
      // Bilder und Texte nicht laden (nur Settings), da Bild-URLs nicht mehr gültig sind
      // Benutzer muss neue Bilder hochladen
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
    setBackgroundImage,
    removeBackgroundImage,
    setBackgroundImageFit,
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
    loadFromTemplate
  }
})
