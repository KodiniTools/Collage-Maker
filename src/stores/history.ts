import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollageImage, CollageText, CollageSettings } from '@/types'

// Snapshot des Collage-Zustands (ohne File-Objekte, da diese nicht serialisierbar sind)
interface HistorySnapshot {
  images: Omit<CollageImage, 'file'>[]
  texts: CollageText[]
  settings: CollageSettings
  timestamp: number
}

const MAX_HISTORY_SIZE = 50 // Maximale Anzahl von Snapshots

export const useHistoryStore = defineStore('history', () => {
  // History-Stacks
  const undoStack = ref<HistorySnapshot[]>([])
  const redoStack = ref<HistorySnapshot[]>([])

  // Flag um zu verhindern, dass während undo/redo neue Snapshots erstellt werden
  const isRestoring = ref(false)

  // Computed properties
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const undoCount = computed(() => undoStack.value.length)
  const redoCount = computed(() => redoStack.value.length)

  // Erstellt einen Snapshot des aktuellen Zustands
  function createSnapshot(
    images: CollageImage[],
    texts: CollageText[],
    settings: CollageSettings
  ): HistorySnapshot {
    return {
      // Entferne File-Objekte aus dem Snapshot (nicht serialisierbar)
      images: images.map(img => {
        const { file, ...rest } = img
        return rest
      }),
      texts: JSON.parse(JSON.stringify(texts)),
      settings: JSON.parse(JSON.stringify(settings)),
      timestamp: Date.now()
    }
  }

  // Speichert den aktuellen Zustand in der History
  function saveSnapshot(
    images: CollageImage[],
    texts: CollageText[],
    settings: CollageSettings
  ) {
    // Nicht speichern während einer Undo/Redo-Operation
    if (isRestoring.value) return

    const snapshot = createSnapshot(images, texts, settings)

    // Füge zum Undo-Stack hinzu
    undoStack.value.push(snapshot)

    // Begrenze die Stack-Größe
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift()
    }

    // Lösche den Redo-Stack bei neuer Aktion
    redoStack.value = []
  }

  // Undo: Stellt den vorherigen Zustand wieder her
  function undo(
    currentImages: CollageImage[],
    currentTexts: CollageText[],
    currentSettings: CollageSettings
  ): HistorySnapshot | null {
    if (undoStack.value.length === 0) return null

    isRestoring.value = true

    // Speichere aktuellen Zustand in Redo-Stack
    const currentSnapshot = createSnapshot(currentImages, currentTexts, currentSettings)
    redoStack.value.push(currentSnapshot)

    // Hole vorherigen Zustand
    const previousSnapshot = undoStack.value.pop()!

    isRestoring.value = false

    return previousSnapshot
  }

  // Redo: Stellt den nächsten Zustand wieder her
  function redo(
    currentImages: CollageImage[],
    currentTexts: CollageText[],
    currentSettings: CollageSettings
  ): HistorySnapshot | null {
    if (redoStack.value.length === 0) return null

    isRestoring.value = true

    // Speichere aktuellen Zustand in Undo-Stack
    const currentSnapshot = createSnapshot(currentImages, currentTexts, currentSettings)
    undoStack.value.push(currentSnapshot)

    // Hole nächsten Zustand
    const nextSnapshot = redoStack.value.pop()!

    isRestoring.value = false

    return nextSnapshot
  }

  // Löscht die gesamte History
  function clearHistory() {
    undoStack.value = []
    redoStack.value = []
  }

  // Gibt zurück, ob gerade eine Wiederherstellung läuft
  function getIsRestoring() {
    return isRestoring.value
  }

  return {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    saveSnapshot,
    undo,
    redo,
    clearHistory,
    getIsRestoring
  }
})
