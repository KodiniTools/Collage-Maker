import { onMounted, onUnmounted, ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { useI18n } from 'vue-i18n'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  descriptionKey: string
  category: 'selection' | 'editing' | 'navigation' | 'canvas' | 'general'
  action: () => void
}

export function useKeyboardShortcuts() {
  const collage = useCollageStore()
  const toast = useToastStore()
  const { t } = useI18n()

  const showShortcutsModal = ref(false)

  // Definiere alle Tastaturkürzel
  const shortcuts: KeyboardShortcut[] = [
    // === SELECTION ===
    {
      key: 'a',
      ctrl: true,
      description: 'Select all images',
      descriptionKey: 'shortcuts.selectAll',
      category: 'selection',
      action: () => collage.selectAllCanvasImages()
    },
    {
      key: 'Escape',
      description: 'Deselect all',
      descriptionKey: 'shortcuts.deselectAll',
      category: 'selection',
      action: () => {
        collage.deselectAllImages()
        collage.selectText(null)
      }
    },
    {
      key: 'Delete',
      description: 'Delete selected',
      descriptionKey: 'shortcuts.delete',
      category: 'selection',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.removeSelectedImages()
        } else if (collage.selectedTextId) {
          collage.removeText(collage.selectedTextId)
        }
      }
    },
    {
      key: 'Backspace',
      description: 'Delete selected',
      descriptionKey: 'shortcuts.delete',
      category: 'selection',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.removeSelectedImages()
        } else if (collage.selectedTextId) {
          collage.removeText(collage.selectedTextId)
        }
      }
    },

    // === EDITING ===
    {
      key: 'd',
      ctrl: true,
      description: 'Duplicate selected',
      descriptionKey: 'shortcuts.duplicate',
      category: 'editing',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.duplicateSelectedImages()
        }
      }
    },
    {
      key: 'r',
      description: 'Rotate 90° clockwise',
      descriptionKey: 'shortcuts.rotateRight',
      category: 'editing',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.rotateSelectedImages(90)
        }
      }
    },
    {
      key: 'r',
      shift: true,
      description: 'Rotate 90° counter-clockwise',
      descriptionKey: 'shortcuts.rotateLeft',
      category: 'editing',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.rotateSelectedImages(-90)
        }
      }
    },
    {
      key: ']',
      description: 'Bring to front',
      descriptionKey: 'shortcuts.bringToFront',
      category: 'editing',
      action: () => collage.bringSelectedToFront()
    },
    {
      key: '[',
      description: 'Send to back',
      descriptionKey: 'shortcuts.sendToBack',
      category: 'editing',
      action: () => collage.sendSelectedToBack()
    },
    {
      key: 't',
      ctrl: true,
      description: 'Add new text',
      descriptionKey: 'shortcuts.addText',
      category: 'editing',
      action: () => collage.addText()
    },

    // === NAVIGATION (Arrow Keys) ===
    {
      key: 'ArrowUp',
      description: 'Move up 1px',
      descriptionKey: 'shortcuts.moveUp',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(0, -1)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(0, -1)
        }
      }
    },
    {
      key: 'ArrowDown',
      description: 'Move down 1px',
      descriptionKey: 'shortcuts.moveDown',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(0, 1)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(0, 1)
        }
      }
    },
    {
      key: 'ArrowLeft',
      description: 'Move left 1px',
      descriptionKey: 'shortcuts.moveLeft',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(-1, 0)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(-1, 0)
        }
      }
    },
    {
      key: 'ArrowRight',
      description: 'Move right 1px',
      descriptionKey: 'shortcuts.moveRight',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(1, 0)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(1, 0)
        }
      }
    },
    {
      key: 'ArrowUp',
      shift: true,
      description: 'Move up 10px',
      descriptionKey: 'shortcuts.moveUp10',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(0, -10)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(0, -10)
        }
      }
    },
    {
      key: 'ArrowDown',
      shift: true,
      description: 'Move down 10px',
      descriptionKey: 'shortcuts.moveDown10',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(0, 10)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(0, 10)
        }
      }
    },
    {
      key: 'ArrowLeft',
      shift: true,
      description: 'Move left 10px',
      descriptionKey: 'shortcuts.moveLeft10',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(-10, 0)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(-10, 0)
        }
      }
    },
    {
      key: 'ArrowRight',
      shift: true,
      description: 'Move right 10px',
      descriptionKey: 'shortcuts.moveRight10',
      category: 'navigation',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.moveSelectedImages(10, 0)
        } else if (collage.selectedTextId) {
          collage.moveSelectedText(10, 0)
        }
      }
    },

    // === CANVAS ===
    {
      key: 'g',
      ctrl: true,
      description: 'Toggle grid',
      descriptionKey: 'shortcuts.toggleGrid',
      category: 'canvas',
      action: () => collage.toggleGrid()
    },
    {
      key: '+',
      ctrl: true,
      description: 'Zoom in',
      descriptionKey: 'shortcuts.zoomIn',
      category: 'canvas',
      action: () => collage.setCanvasZoom(collage.canvasZoom + 0.1)
    },
    {
      key: '=',
      ctrl: true,
      description: 'Zoom in',
      descriptionKey: 'shortcuts.zoomIn',
      category: 'canvas',
      action: () => collage.setCanvasZoom(collage.canvasZoom + 0.1)
    },
    {
      key: '-',
      ctrl: true,
      description: 'Zoom out',
      descriptionKey: 'shortcuts.zoomOut',
      category: 'canvas',
      action: () => collage.setCanvasZoom(collage.canvasZoom - 0.1)
    },
    {
      key: '0',
      ctrl: true,
      description: 'Reset zoom',
      descriptionKey: 'shortcuts.resetZoom',
      category: 'canvas',
      action: () => collage.resetCanvasView()
    },

    // === GENERAL ===
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      descriptionKey: 'shortcuts.showHelp',
      category: 'general',
      action: () => {
        showShortcutsModal.value = true
      }
    }
  ]

  function handleKeyDown(e: KeyboardEvent) {
    // Ignoriere Eingaben in Textfeldern
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Finde passendes Shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       e.key === shortcut.key
      const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey)
      const shiftMatch = !!shortcut.shift === e.shiftKey
      const altMatch = !!shortcut.alt === e.altKey

      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })

    if (matchingShortcut) {
      e.preventDefault()
      matchingShortcut.action()
    }
  }

  function openShortcutsModal() {
    showShortcutsModal.value = true
  }

  function closeShortcutsModal() {
    showShortcutsModal.value = false
  }

  // Gruppiere Shortcuts nach Kategorie für die Anzeige
  function getShortcutsByCategory() {
    const categories = {
      selection: [] as KeyboardShortcut[],
      editing: [] as KeyboardShortcut[],
      navigation: [] as KeyboardShortcut[],
      canvas: [] as KeyboardShortcut[],
      general: [] as KeyboardShortcut[]
    }

    // Filtere Duplikate (z.B. Delete und Backspace)
    const seen = new Set<string>()
    shortcuts.forEach(shortcut => {
      const key = shortcut.descriptionKey
      if (!seen.has(key)) {
        seen.add(key)
        categories[shortcut.category].push(shortcut)
      }
    })

    return categories
  }

  function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.shift) parts.push('Shift')
    if (shortcut.alt) parts.push('Alt')

    // Formatiere Tastennamen
    let keyName = shortcut.key
    switch (shortcut.key) {
      case 'ArrowUp': keyName = '↑'; break
      case 'ArrowDown': keyName = '↓'; break
      case 'ArrowLeft': keyName = '←'; break
      case 'ArrowRight': keyName = '→'; break
      case 'Delete': keyName = 'Del'; break
      case 'Backspace': keyName = '⌫'; break
      case 'Escape': keyName = 'Esc'; break
      case ' ': keyName = 'Space'; break
      default: keyName = shortcut.key.toUpperCase()
    }

    parts.push(keyName)
    return parts.join(' + ')
  }

  function setupKeyboardListeners() {
    window.addEventListener('keydown', handleKeyDown)
  }

  function cleanupKeyboardListeners() {
    window.removeEventListener('keydown', handleKeyDown)
  }

  return {
    shortcuts,
    showShortcutsModal,
    handleKeyDown,
    openShortcutsModal,
    closeShortcutsModal,
    getShortcutsByCategory,
    formatShortcut,
    setupKeyboardListeners,
    cleanupKeyboardListeners
  }
}
