import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollageImage, CollageText, CollageSettings, LayoutType } from '@/types'

export const useCollageStore = defineStore('collage', () => {
  const images = ref<CollageImage[]>([])
  const selectedImageId = ref<string | null>(null)
  const texts = ref<CollageText[]>([])
  const selectedTextId = ref<string | null>(null)
  const lockAspectRatio = ref(true)

  const settings = ref<CollageSettings>({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    layout: 'freestyle',
    gridEnabled: false,
    gridSize: 50
  })

  const selectedImage = computed(() =>
    images.value.find(img => img.id === selectedImageId.value)
  )

  const selectedText = computed(() =>
    texts.value.find(txt => txt.id === selectedTextId.value)
  )

  function addImages(files: File[]) {
    files.forEach(file => {
      const id = crypto.randomUUID()
      const url = URL.createObjectURL(file)

      // Lade das Bild, um die originalen Dimensionen zu erhalten
      const img = new Image()
      img.onload = () => {
        const imageData = images.value.find(i => i.id === id)
        if (imageData) {
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

          imageData.width = width
          imageData.height = height
        }
      }
      img.src = url

      // Füge Bild mit temporären Dimensionen hinzu (werden beim Laden aktualisiert)
      images.value.push({
        id,
        file,
        url,
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        rotation: 0,
        zIndex: images.value.length,
        opacity: 1,
        shadowEnabled: false,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowBlur: 10,
        shadowColor: '#000000'
      })
    })

    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout)
    }
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      URL.revokeObjectURL(images.value[index].url)
      images.value.splice(index, 1)
    }
    if (selectedImageId.value === id) {
      selectedImageId.value = null
    }
  }

  function updateImage(id: string, updates: Partial<CollageImage>) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      Object.assign(image, updates)
    }
  }

  function selectImage(id: string | null) {
    selectedImageId.value = id
  }

  function applyLayout(layout: LayoutType) {
    settings.value.layout = layout

    if (layout === 'freestyle') return

    const w = settings.value.width
    const h = settings.value.height
    const padding = 10

    // Hilfsfunktion zum Einpassen von Bildern mit Seitenverhältnis
    function fitImage(img: any, x: number, y: number, width: number, height: number) {
      const aspectRatio = img.width / img.height
      const availableWidth = width - padding * 2
      const availableHeight = height - padding * 2

      img.x = x + padding
      img.y = y + padding

      if (availableWidth / availableHeight > aspectRatio) {
        img.height = availableHeight
        img.width = availableHeight * aspectRatio
      } else {
        img.width = availableWidth
        img.height = availableWidth / aspectRatio
      }
      img.rotation = 0
    }

    // Grid-basierte Layouts (bestehend)
    if (layout === 'grid-2x2' || layout === 'grid-3x3' || layout === 'grid-2x3') {
      const cols = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 2
      const rows = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 3

      const cellWidth = w / cols
      const cellHeight = h / rows

      images.value.forEach((img, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        fitImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight)
      })
    }
    // Magazin-Layout: Großes Bild links, 2 kleinere rechts gestapelt
    else if (layout === 'magazine') {
      images.value.forEach((img, index) => {
        if (index === 0) {
          // Großes Hauptbild links (2/3 Breite)
          fitImage(img, 0, 0, w * 0.66, h)
        } else if (index === 1) {
          // Oberes kleines Bild rechts
          fitImage(img, w * 0.66, 0, w * 0.34, h * 0.5)
        } else if (index === 2) {
          // Unteres kleines Bild rechts
          fitImage(img, w * 0.66, h * 0.5, w * 0.34, h * 0.5)
        } else {
          // Weitere Bilder übereinander rechts
          const extraY = h * 0.66 + ((index - 3) * (h * 0.17))
          fitImage(img, w * 0.66, extraY, w * 0.34, h * 0.17)
        }
      })
    }
    // Spotlight-Layout: Ein großes Bild oben, 3 kleinere unten
    else if (layout === 'spotlight') {
      images.value.forEach((img, index) => {
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
      images.value.forEach((img, index) => {
        if (index === 0) {
          // Hero-Bild oben (60% Höhe)
          fitImage(img, 0, 0, w, h * 0.6)
        } else {
          // Kleinere Bilder unten nebeneinander
          const cols = Math.max(images.value.length - 1, 1)
          const col = index - 1
          fitImage(img, (w / cols) * col, h * 0.6, w / cols, h * 0.4)
        }
      })
    }
    // Sidebar-Layout: Schmale Sidebar links mit kleinen Bildern, große Bilder rechts
    else if (layout === 'sidebar') {
      const sidebarWidth = w * 0.25
      const mainWidth = w * 0.75

      images.value.forEach((img, index) => {
        if (index <= 2) {
          // Erste 3 Bilder in der Sidebar
          fitImage(img, 0, (h / 3) * index, sidebarWidth, h / 3)
        } else {
          // Weitere Bilder rechts
          const rightIndex = index - 3
          const rows = Math.ceil((images.value.length - 3) / 2)
          const col = rightIndex % 2
          const row = Math.floor(rightIndex / 2)
          fitImage(img, sidebarWidth + (mainWidth / 2) * col, (h / rows) * row, mainWidth / 2, h / rows)
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

      images.value.forEach((img, index) => {
        const pos = positions[index % positions.length]
        fitImage(img, w * pos.x, h * pos.y, w * pos.w, h * pos.h)
      })
    }
    // Diagonal-Layout: Bilder diagonal angeordnet
    else if (layout === 'diagonal') {
      const count = Math.min(images.value.length, 4)
      const imgSize = Math.min(w, h) * 0.4

      images.value.forEach((img, index) => {
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
  }

  function clearCollage() {
    images.value.forEach(img => URL.revokeObjectURL(img.url))
    images.value = []
    texts.value = []
    selectedImageId.value = null
    selectedTextId.value = null
  }

  function updateSettings(updates: Partial<CollageSettings>) {
    Object.assign(settings.value, updates)
  }

  function setLockAspectRatio(value: boolean) {
    lockAspectRatio.value = value
  }

  function duplicateImageToPosition(sourceId: string, x: number, y: number) {
    const sourceImage = images.value.find(img => img.id === sourceId)
    if (!sourceImage) return

    const newId = crypto.randomUUID()
    const maxZ = Math.max(...images.value.map(img => img.zIndex), 0)

    // Erstelle eine Kopie des Bildes an der neuen Position
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
      shadowEnabled: false,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
      shadowBlur: 10,
      shadowColor: '#000000'
    })

    // Selektiere das neue Bild
    selectedImageId.value = newId
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
    selectedImageId.value = null
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
      selectedImageId.value = null
    }
  }

  return {
    images,
    selectedImageId,
    selectedImage,
    texts,
    selectedTextId,
    selectedText,
    settings,
    lockAspectRatio,
    addImages,
    removeImage,
    updateImage,
    selectImage,
    addText,
    removeText,
    updateText,
    selectText,
    applyLayout,
    clearCollage,
    updateSettings,
    setLockAspectRatio,
    duplicateImageToPosition
  }
})
