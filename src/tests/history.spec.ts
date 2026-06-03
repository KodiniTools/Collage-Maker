import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '@/stores/history'
import type { CollageImage, CollageText, CollageSettings } from '@/types'

function makeSettings(overrides: Partial<CollageSettings> = {}): CollageSettings {
  return {
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
    layout: 'freestyle',
    gridEnabled: false,
    gridSize: 50,
    ...overrides,
  }
}

function makeImage(id: string): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 0,
    opacity: 1,
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    borderShadowEnabled: false,
    borderShadowOffsetX: 0,
    borderShadowOffsetY: 0,
    borderShadowBlur: 0,
    borderShadowColor: '#000',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000',
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0,
  }
}

const NO_TEXTS: CollageText[] = []

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with empty stacks', () => {
      const store = useHistoryStore()
      expect(store.canUndo).toBe(false)
      expect(store.canRedo).toBe(false)
      expect(store.undoCount).toBe(0)
      expect(store.redoCount).toBe(0)
    })
  })

  describe('saveSnapshot', () => {
    it('increments undoCount after saving', () => {
      const store = useHistoryStore()
      store.saveSnapshot([], NO_TEXTS, makeSettings())
      expect(store.undoCount).toBe(1)
      expect(store.canUndo).toBe(true)
    })

    it('strips File objects from images', () => {
      const store = useHistoryStore()
      const img = makeImage('img-1')
      store.saveSnapshot([img], NO_TEXTS, makeSettings())
      const snapshot = store.undoStack[0]
      expect('file' in snapshot.images[0]).toBe(false)
    })

    it('clears redo stack on new action', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      store.undo([], NO_TEXTS, settings)
      expect(store.redoCount).toBe(1)
      store.saveSnapshot([], NO_TEXTS, settings)
      expect(store.redoCount).toBe(0)
    })

    it('caps stack at MAX_HISTORY_SIZE (50)', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      for (let i = 0; i < 55; i++) {
        store.saveSnapshot([], NO_TEXTS, settings)
      }
      expect(store.undoCount).toBe(50)
    })

    it('does not save while isRestoring is true', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      store.undo([], NO_TEXTS, settings) // sets and unsets isRestoring internally
      // Count after undo: undo-stack should have 1 (current state pushed to undo during redo path)
      // What matters: no snapshot was double-saved during the undo call
      expect(store.undoCount).toBe(0)
    })
  })

  describe('undo', () => {
    it('returns null when stack is empty', () => {
      const store = useHistoryStore()
      const result = store.undo([], NO_TEXTS, makeSettings())
      expect(result).toBeNull()
    })

    it('returns the previous snapshot', () => {
      const store = useHistoryStore()
      const settings = makeSettings({ backgroundColor: '#ff0000' })
      store.saveSnapshot([], NO_TEXTS, settings)
      const snapshot = store.undo([], NO_TEXTS, makeSettings())
      expect(snapshot).not.toBeNull()
      expect(snapshot!.settings.backgroundColor).toBe('#ff0000')
    })

    it('moves current state to redo stack', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      expect(store.redoCount).toBe(0)
      store.undo([], NO_TEXTS, settings)
      expect(store.redoCount).toBe(1)
    })

    it('decrements undoCount', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      store.saveSnapshot([], NO_TEXTS, settings)
      store.undo([], NO_TEXTS, settings)
      expect(store.undoCount).toBe(1)
    })
  })

  describe('redo', () => {
    it('returns null when redo stack is empty', () => {
      const store = useHistoryStore()
      const result = store.redo([], NO_TEXTS, makeSettings())
      expect(result).toBeNull()
    })

    it('restores state after undo', () => {
      const store = useHistoryStore()
      const settingsA = makeSettings({ backgroundColor: '#aaaaaa' })
      const settingsB = makeSettings({ backgroundColor: '#bbbbbb' })
      store.saveSnapshot([], NO_TEXTS, settingsA)
      store.undo([], NO_TEXTS, settingsB)
      const redoneSnapshot = store.redo([], NO_TEXTS, settingsA)
      expect(redoneSnapshot).not.toBeNull()
      expect(redoneSnapshot!.settings.backgroundColor).toBe('#bbbbbb')
    })

    it('moves current state back to undo stack', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      store.undo([], NO_TEXTS, settings)
      store.redo([], NO_TEXTS, settings)
      expect(store.undoCount).toBe(1)
      expect(store.redoCount).toBe(0)
    })
  })

  describe('clearHistory', () => {
    it('empties both stacks', () => {
      const store = useHistoryStore()
      const settings = makeSettings()
      store.saveSnapshot([], NO_TEXTS, settings)
      store.saveSnapshot([], NO_TEXTS, settings)
      store.clearHistory()
      expect(store.undoCount).toBe(0)
      expect(store.redoCount).toBe(0)
      expect(store.canUndo).toBe(false)
      expect(store.canRedo).toBe(false)
    })
  })
})
