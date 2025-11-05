import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollageImage, CollageSettings, LayoutType } from '@/types'

export const useCollageStore = defineStore('collage', () => {
  const images = ref<CollageImage[]>([])
  const selectedImageId = ref<string | null>(null)
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

    const cols = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 2
    const rows = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 3

    const cellWidth = settings.value.width / cols
    const cellHeight = settings.value.height / rows
    const padding = 10

    images.value.forEach((img, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      // Positioniere das Bild in der Zelle
      img.x = col * cellWidth + padding
      img.y = row * cellHeight + padding

      // Berechne das originale Seitenverhältnis
      const aspectRatio = img.width / img.height
      const availableWidth = cellWidth - padding * 2
      const availableHeight = cellHeight - padding * 2

      // Passe die Größe an die Zelle an, aber behalte das Seitenverhältnis bei
      if (availableWidth / availableHeight > aspectRatio) {
        // Zelle ist breiter als das Bild - passe an Höhe an
        img.height = availableHeight
        img.width = availableHeight * aspectRatio
      } else {
        // Zelle ist höher als das Bild - passe an Breite an
        img.width = availableWidth
        img.height = availableWidth / aspectRatio
      }

      img.rotation = 0
    })
  }

  function clearCollage() {
    images.value.forEach(img => URL.revokeObjectURL(img.url))
    images.value = []
    selectedImageId.value = null
  }

  function updateSettings(updates: Partial<CollageSettings>) {
    Object.assign(settings.value, updates)
  }

  function setLockAspectRatio(value: boolean) {
    lockAspectRatio.value = value
  }

  return {
    images,
    selectedImageId,
    selectedImage,
    settings,
    lockAspectRatio,
    addImages,
    removeImage,
    updateImage,
    selectImage,
    applyLayout,
    clearCollage,
    updateSettings,
    setLockAspectRatio
  }
})
