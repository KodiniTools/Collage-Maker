import { watch, ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage, CollageText, CollageSettings } from '@/types'

const STORAGE_KEY = 'collage-maker-autosave'
const SAVE_DELAY = 2000 // 2 Sekunden Verzögerung für Debounce

interface SavedState {
  version: number
  timestamp: number
  images: SavedImage[]
  texts: CollageText[]
  settings: CollageSettings
}

interface SavedImage extends Omit<CollageImage, 'file' | 'url'> {
  dataUrl: string // Base64-kodiertes Bild
}

export function useAutoSave() {
  const collage = useCollageStore()
  const isRestoring = ref(false)
  const lastSaveTime = ref<number | null>(null)
  const saveTimeout = ref<number | null>(null)

  // Konvertiert eine Blob-URL zu Base64
  async function blobUrlToBase64(blobUrl: string): Promise<string> {
    try {
      const response = await fetch(blobUrl)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn('Could not convert blob URL to base64:', error)
      return ''
    }
  }

  // Speichert den aktuellen Zustand in LocalStorage
  async function saveState() {
    if (isRestoring.value) return

    try {
      // Konvertiere alle Bild-URLs zu Base64
      const savedImages: SavedImage[] = await Promise.all(
        collage.images.map(async (img) => {
          const dataUrl = await blobUrlToBase64(img.url)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { file, url, ...rest } = img
          return {
            ...rest,
            dataUrl
          }
        })
      )

      // Hintergrundbild auch konvertieren
      let backgroundDataUrl: string | null = null
      if (collage.settings.backgroundImage.url) {
        backgroundDataUrl = await blobUrlToBase64(collage.settings.backgroundImage.url)
      }

      const state: SavedState = {
        version: 1,
        timestamp: Date.now(),
        images: savedImages.filter(img => img.dataUrl), // Nur Bilder mit gültiger URL
        texts: collage.texts,
        settings: {
          ...collage.settings,
          backgroundImage: {
            ...collage.settings.backgroundImage,
            url: backgroundDataUrl
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      lastSaveTime.value = Date.now()
      console.log('Auto-save: Collage gespeichert', new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Auto-save Fehler:', error)
    }
  }

  // Stellt den Zustand aus LocalStorage wieder her
  async function restoreState(): Promise<boolean> {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (!savedData) return false

      const state: SavedState = JSON.parse(savedData)

      // Prüfe Version
      if (state.version !== 1) {
        console.warn('Inkompatible Auto-save Version')
        return false
      }

      // Prüfe ob Daten vorhanden sind
      if (state.images.length === 0 && state.texts.length === 0) {
        return false
      }

      isRestoring.value = true

      // Stelle Settings wieder her
      collage.updateSettings({
        width: state.settings.width,
        height: state.settings.height,
        backgroundColor: state.settings.backgroundColor,
        layout: state.settings.layout,
        gridEnabled: state.settings.gridEnabled,
        gridSize: state.settings.gridSize
      })

      // Hintergrundbild wiederherstellen
      if (state.settings.backgroundImage.url) {
        collage.settings.backgroundImage = {
          ...state.settings.backgroundImage
        }
      }

      // Konvertiere Base64 zurück zu Blob-URLs und stelle Bilder wieder her
      for (const savedImg of state.images) {
        if (!savedImg.dataUrl) continue

        // Erstelle Blob aus Base64
        const response = await fetch(savedImg.dataUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        // Erstelle File-Objekt (für Kompatibilität)
        const file = new File([blob], `restored-${savedImg.id}.png`, { type: blob.type })

        // Füge Bild zum Store hinzu
        const restoredImage: CollageImage = {
          id: savedImg.id,
          file,
          url,
          x: savedImg.x,
          y: savedImg.y,
          width: savedImg.width,
          height: savedImg.height,
          rotation: savedImg.rotation,
          zIndex: savedImg.zIndex,
          opacity: savedImg.opacity,
          borderRadius: savedImg.borderRadius,
          borderEnabled: savedImg.borderEnabled,
          borderWidth: savedImg.borderWidth,
          borderColor: savedImg.borderColor,
          borderStyle: savedImg.borderStyle,
          borderShadowEnabled: savedImg.borderShadowEnabled,
          borderShadowOffsetX: savedImg.borderShadowOffsetX,
          borderShadowOffsetY: savedImg.borderShadowOffsetY,
          borderShadowBlur: savedImg.borderShadowBlur,
          borderShadowColor: savedImg.borderShadowColor,
          shadowEnabled: savedImg.shadowEnabled,
          shadowOffsetX: savedImg.shadowOffsetX,
          shadowOffsetY: savedImg.shadowOffsetY,
          shadowBlur: savedImg.shadowBlur,
          shadowColor: savedImg.shadowColor,
          brightness: savedImg.brightness ?? 100,
          contrast: savedImg.contrast ?? 100,
          highlights: savedImg.highlights ?? 0,
          shadows: savedImg.shadows ?? 0,
          saturation: savedImg.saturation ?? 100,
          warmth: savedImg.warmth ?? 0,
          sharpness: savedImg.sharpness ?? 0,
          isGalleryTemplate: savedImg.isGalleryTemplate
        }

        collage.images.push(restoredImage)
      }

      // Stelle Texte wieder her
      state.texts.forEach(txt => {
        collage.texts.push({ ...txt })
      })

      isRestoring.value = false
      lastSaveTime.value = state.timestamp
      console.log('Auto-save: Collage wiederhergestellt', new Date(state.timestamp).toLocaleTimeString())

      return true
    } catch (error) {
      console.error('Auto-save Wiederherstellungsfehler:', error)
      isRestoring.value = false
      return false
    }
  }

  // Löscht den gespeicherten Zustand
  function clearSavedState() {
    localStorage.removeItem(STORAGE_KEY)
    lastSaveTime.value = null
  }

  // Debounced Save - speichert nach einer Verzögerung
  function scheduleSave() {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value)
    }
    saveTimeout.value = window.setTimeout(() => {
      saveState()
    }, SAVE_DELAY)
  }

  // Watcher für automatisches Speichern
  function setupAutoSave() {
    // Beobachte alle relevanten Änderungen
    watch(
      () => [
        collage.images,
        collage.texts,
        collage.settings
      ],
      () => {
        if (!isRestoring.value) {
          scheduleSave()
        }
      },
      { deep: true }
    )
  }

  // Prüft ob gespeicherte Daten vorhanden sind
  function hasSavedState(): boolean {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) return false

    try {
      const state: SavedState = JSON.parse(savedData)
      return state.images.length > 0 || state.texts.length > 0
    } catch {
      return false
    }
  }

  // Gibt das Speicherdatum zurück
  function getSaveDate(): Date | null {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) return null

    try {
      const state: SavedState = JSON.parse(savedData)
      return new Date(state.timestamp)
    } catch {
      return null
    }
  }

  return {
    saveState,
    restoreState,
    clearSavedState,
    setupAutoSave,
    hasSavedState,
    getSaveDate,
    lastSaveTime,
    isRestoring
  }
}
