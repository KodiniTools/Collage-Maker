import { watch, ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { CollageImage, CollageText, CollageSettings } from '@/types'

const STORAGE_KEY = 'collage-maker-autosave'
const SAVE_DELAY = 2000 // 2 Sekunden Verzögerung für Debounce
const MAX_IMAGE_SIZE = 400 // Max Breite/Höhe für Thumbnails
const JPEG_QUALITY = 0.6 // JPEG Qualität (0-1)

interface SavedState {
  version: number
  timestamp: number
  images: SavedImage[]
  texts: CollageText[]
  settings: CollageSettings
}

interface SavedImage extends Omit<CollageImage, 'file' | 'url'> {
  dataUrl: string // Base64-kodiertes Bild (komprimiert)
}

export function useAutoSave() {
  const collage = useCollageStore()
  const isRestoring = ref(false)
  const lastSaveTime = ref<number | null>(null)
  const saveTimeout = ref<number | null>(null)
  const saveError = ref<string | null>(null)

  // Komprimiert und konvertiert ein Bild zu Base64
  async function compressAndConvert(blobUrl: string, maxSize: number = MAX_IMAGE_SIZE): Promise<string> {
    // Wenn es bereits eine Data-URL ist
    if (blobUrl.startsWith('data:')) {
      // Trotzdem komprimieren
      return await compressDataUrl(blobUrl, maxSize)
    }

    return new Promise((resolve, reject) => {
      const img = new Image()

      // WICHTIG: crossOrigin NICHT bei blob: URLs setzen!
      // blob: URLs sind lokal und brauchen kein CORS
      if (!blobUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous'
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')

          // Berechne neue Dimensionen unter Beibehaltung des Seitenverhältnisses
          let width = img.naturalWidth
          let height = img.naturalHeight

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height / width) * maxSize)
              width = maxSize
            } else {
              width = Math.round((width / height) * maxSize)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Als JPEG mit reduzierter Qualität speichern
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
          resolve(dataUrl)
        } catch (e) {
          reject(e)
        }
      }

      img.onerror = (e) => {
        console.error('Image load error for URL:', blobUrl.substring(0, 50), e)
        reject(new Error('Image load failed'))
      }
      img.src = blobUrl
    })
  }

  // Komprimiert eine bereits existierende Data-URL
  async function compressDataUrl(dataUrl: string, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')

          let width = img.naturalWidth
          let height = img.naturalHeight

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height / width) * maxSize)
              width = maxSize
            } else {
              width = Math.round((width / height) * maxSize)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
          resolve(compressedDataUrl)
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = dataUrl
    })
  }

  // Speichert den aktuellen Zustand in LocalStorage
  async function saveState() {
    if (isRestoring.value) return

    try {
      // Nur speichern wenn es etwas zu speichern gibt
      const hasContent = collage.images.length > 0 || collage.texts.length > 0

      if (!hasContent) {
        // Lösche alte Daten wenn nichts mehr vorhanden
        localStorage.removeItem(STORAGE_KEY)
        saveError.value = null
        return
      }

      // Konvertiere und komprimiere alle Bild-URLs
      const savedImages: SavedImage[] = []

      for (const img of collage.images) {
        try {
          // Skip images with missing or revoked URLs
          if (!img.url) continue

          const dataUrl = await compressAndConvert(img.url)
          if (dataUrl) {
            const { file, url, ...rest } = img
            savedImages.push({
              ...rest,
              dataUrl
            })
          }
        } catch (e) {
          console.warn(`Failed to convert image ${img.id}:`, e)
        }
      }

      // Hintergrundbild auch komprimieren (kleineres Thumbnail)
      let backgroundDataUrl: string | null = null
      if (collage.settings.backgroundImage.url) {
        try {
          backgroundDataUrl = await compressAndConvert(
            collage.settings.backgroundImage.url,
            300 // Kleineres Thumbnail für Hintergrund
          )
        } catch (e) {
          console.warn('Failed to convert background image:', e)
        }
      }

      const state: SavedState = {
        version: 1,
        timestamp: Date.now(),
        images: savedImages,
        texts: JSON.parse(JSON.stringify(collage.texts)),
        settings: {
          ...JSON.parse(JSON.stringify(collage.settings)),
          backgroundImage: {
            ...collage.settings.backgroundImage,
            url: backgroundDataUrl
          }
        }
      }

      // Speichern nur wenn Bilder oder Texte vorhanden
      if (state.images.length > 0 || state.texts.length > 0) {
        const jsonString = JSON.stringify(state)

        // Prüfe Größe vor dem Speichern
        const sizeInMB = (jsonString.length * 2) / (1024 * 1024)

        if (sizeInMB > 4.5) {
          // Zu groß - versuche mit noch kleineren Bildern
          console.warn(`Auto-save: Daten zu groß (${sizeInMB.toFixed(2)}MB), versuche kleinere Thumbnails...`)
          await saveStateWithSmallerImages(200)
          return
        }

        try {
          localStorage.setItem(STORAGE_KEY, jsonString)
          lastSaveTime.value = Date.now()
          saveError.value = null
          console.log(`Auto-save: ${state.images.length} Bilder, ${state.texts.length} Texte gespeichert (${sizeInMB.toFixed(2)}MB)`)
        } catch (storageError) {
          if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
            console.warn('Auto-save: Speicherplatz überschritten, versuche kleinere Thumbnails...')
            await saveStateWithSmallerImages(200)
          } else {
            throw storageError
          }
        }
      }
    } catch (error) {
      console.error('Auto-save Fehler:', error)
      saveError.value = 'Speicherfehler'
    }
  }

  // Speichert mit noch kleineren Bildern wenn Quota überschritten
  async function saveStateWithSmallerImages(maxSize: number) {
    try {
      const savedImages: SavedImage[] = []

      for (const img of collage.images) {
        try {
          const dataUrl = await compressAndConvert(img.url, maxSize)
          if (dataUrl) {
            const { file, url, ...rest } = img
            savedImages.push({
              ...rest,
              dataUrl
            })
          }
        } catch (e) {
          console.warn(`Failed to convert image ${img.id}:`, e)
        }
      }

      let backgroundDataUrl: string | null = null
      if (collage.settings.backgroundImage.url) {
        try {
          backgroundDataUrl = await compressAndConvert(
            collage.settings.backgroundImage.url,
            150
          )
        } catch (e) {
          console.warn('Failed to convert background image:', e)
        }
      }

      const state: SavedState = {
        version: 1,
        timestamp: Date.now(),
        images: savedImages,
        texts: JSON.parse(JSON.stringify(collage.texts)),
        settings: {
          ...JSON.parse(JSON.stringify(collage.settings)),
          backgroundImage: {
            ...collage.settings.backgroundImage,
            url: backgroundDataUrl
          }
        }
      }

      if (state.images.length > 0 || state.texts.length > 0) {
        const jsonString = JSON.stringify(state)
        const sizeInMB = (jsonString.length * 2) / (1024 * 1024)

        try {
          localStorage.setItem(STORAGE_KEY, jsonString)
          lastSaveTime.value = Date.now()
          saveError.value = null
          console.log(`Auto-save: ${state.images.length} Bilder mit kleineren Thumbnails gespeichert (${sizeInMB.toFixed(2)}MB)`)
        } catch (storageError) {
          if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
            // Letzter Versuch: nur Metadaten ohne Bilder speichern
            console.warn('Auto-save: Immer noch zu groß, speichere nur Metadaten...')
            saveError.value = 'Zu viele/große Bilder für Auto-Save'

            // Speichere wenigstens die Positionen und Einstellungen
            const metaState: SavedState = {
              version: 1,
              timestamp: Date.now(),
              images: savedImages.map(img => ({ ...img, dataUrl: '' })),
              texts: state.texts,
              settings: {
                ...state.settings,
                backgroundImage: { ...state.settings.backgroundImage, url: null }
              }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(metaState))
          } else {
            throw storageError
          }
        }
      }
    } catch (error) {
      console.error('Auto-save mit kleineren Bildern fehlgeschlagen:', error)
      saveError.value = 'Speicherfehler'
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

        try {
          // Erstelle Blob aus Base64
          const response = await fetch(savedImg.dataUrl)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)

          // Erstelle File-Objekt (für Kompatibilität)
          const file = new File([blob], `restored-${savedImg.id}.jpg`, { type: 'image/jpeg' })

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
        } catch (imgError) {
          console.warn(`Failed to restore image ${savedImg.id}:`, imgError)
        }
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
    saveError.value = null
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
        collage.images.length,
        collage.texts.length,
        JSON.stringify(collage.settings)
      ],
      () => {
        if (!isRestoring.value) {
          scheduleSave()
        }
      }
    )

    // Zusätzlicher Watcher für tiefe Änderungen an einzelnen Bildern/Texten
    watch(
      () => collage.images.map(img => `${img.id}-${img.x}-${img.y}-${img.width}-${img.height}-${img.rotation}`).join(','),
      () => {
        if (!isRestoring.value) {
          scheduleSave()
        }
      }
    )

    // Speichern vor dem Schließen des Fensters
    window.addEventListener('beforeunload', () => {
      if (collage.images.length > 0 || collage.texts.length > 0) {
        try {
          const savedData = localStorage.getItem(STORAGE_KEY)
          if (savedData) {
            const state = JSON.parse(savedData)
            state.timestamp = Date.now()
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
          }
        } catch (e) {
          console.warn('beforeunload save failed:', e)
        }
      }
    })
  }

  // Prüft ob gespeicherte Daten vorhanden sind
  function hasSavedState(): boolean {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (!savedData) {
        console.log('Auto-save: Keine gespeicherten Daten gefunden')
        return false
      }

      const state: SavedState = JSON.parse(savedData)
      // Prüfe ob es Bilder MIT dataUrl gibt oder Texte
      const hasImages = state.images.some(img => img.dataUrl && img.dataUrl.length > 0)
      const hasTexts = state.texts.length > 0
      const hasContent = hasImages || hasTexts

      if (hasContent) {
        console.log(`Auto-save: Gespeicherte Daten gefunden - ${state.images.filter(i => i.dataUrl).length} Bilder, ${state.texts.length} Texte`)
      }

      return hasContent
    } catch (error) {
      console.error('Auto-save: Fehler beim Prüfen der gespeicherten Daten:', error)
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
    isRestoring,
    saveError
  }
}
