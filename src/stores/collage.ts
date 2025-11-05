import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollageImage, CollageText, CollageSettings, LayoutType } from '@/types'

export const useCollageStore = defineStore('collage', () => {
  const images = ref<CollageImage[]>([])
  const texts = ref<CollageText[]>([])
  const selectedImageId = ref<string | null>(null)
  const selectedTextId = ref<string | null>(null)
  const lockAspectRatio = ref(true)

  const settings = ref<CollageSettings>({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    layout: 'freestyle'
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
    if (id !== null) {
      selectedTextId.value = null // Deselect text when selecting image
    }
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
      
      img.x = col * cellWidth + padding
      img.y = row * cellHeight + padding
      img.width = cellWidth - padding * 2
      img.height = cellHeight - padding * 2
      img.rotation = 0
    })
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

  // Text-Funktionen
  function addText() {
    const id = crypto.randomUUID()

    texts.value.push({
      id,
      text: 'Text hinzufügen',
      x: 100,
      y: 100,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      rotation: 0,
      zIndex: Math.max(
        ...images.value.map(img => img.zIndex),
        ...texts.value.map(txt => txt.zIndex),
        0
      ) + 1
    })

    selectText(id)
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
      selectedImageId.value = null // Deselect image when selecting text
    }
  }

  return {
    images,
    texts,
    selectedImageId,
    selectedTextId,
    selectedImage,
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
    setLockAspectRatio
  }
})
