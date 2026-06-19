import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'

export interface KeyboardShortcut {
  key: string | string[]
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  descriptionKey: string
  category: 'selection' | 'editing' | 'navigation' | 'canvas' | 'general'
  displayOnly?: boolean
  action: () => void
}

export function useKeyboardShortcuts() {
  const collage = useCollageStore()

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
      action: () => collage.selectAllCanvasImages(),
    },
    {
      key: 'Escape',
      description: 'Deselect all',
      descriptionKey: 'shortcuts.deselectAll',
      category: 'selection',
      action: () => {
        collage.deselectAllImages()
        collage.selectText(null)
      },
    },
    {
      key: ['Delete', 'Backspace'],
      description: 'Delete selected',
      descriptionKey: 'shortcuts.delete',
      category: 'selection',
      action: () => {
        if (collage.selectedImageIds.length > 0) {
          collage.removeSelectedImages()
        } else if (collage.selectedTextId) {
          collage.removeText(collage.selectedTextId)
        }
      },
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
      },
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
      },
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
      },
    },
    {
      key: ']',
      description: 'Bring to front',
      descriptionKey: 'shortcuts.bringToFront',
      category: 'editing',
      action: () => collage.bringSelectedToFront(),
    },
    {
      key: '[',
      description: 'Send to back',
      descriptionKey: 'shortcuts.sendToBack',
      category: 'editing',
      action: () => collage.sendSelectedToBack(),
    },
    {
      key: 't',
      ctrl: true,
      description: 'Add new text',
      descriptionKey: 'shortcuts.addText',
      category: 'editing',
      action: () => collage.addText(),
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    },

    // === CANVAS ===
    {
      key: 'g',
      ctrl: true,
      description: 'Toggle grid',
      descriptionKey: 'shortcuts.toggleGrid',
      category: 'canvas',
      action: () => collage.toggleGrid(),
    },
    {
      key: ['+', '='],
      ctrl: true,
      description: 'Zoom in',
      descriptionKey: 'shortcuts.zoomIn',
      category: 'canvas',
      action: () => collage.setCanvasZoom(collage.canvasZoom + 0.1),
    },
    {
      key: '-',
      ctrl: true,
      description: 'Zoom out',
      descriptionKey: 'shortcuts.zoomOut',
      category: 'canvas',
      action: () => collage.setCanvasZoom(collage.canvasZoom - 0.1),
    },
    {
      key: '0',
      ctrl: true,
      description: 'Reset zoom',
      descriptionKey: 'shortcuts.resetZoom',
      category: 'canvas',
      action: () => collage.resetCanvasView(),
    },

    // === GENERAL ===
    {
      key: 'v',
      ctrl: true,
      description: 'Paste image from clipboard',
      descriptionKey: 'shortcuts.pasteFromClipboard',
      category: 'general',
      displayOnly: true,
      action: () => {},
    },
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      descriptionKey: 'shortcuts.undo',
      category: 'general',
      action: () => collage.undo(),
    },
    {
      key: 'y',
      ctrl: true,
      description: 'Redo',
      descriptionKey: 'shortcuts.redo',
      category: 'general',
      action: () => collage.redo(),
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo',
      descriptionKey: 'shortcuts.redo',
      category: 'general',
      action: () => collage.redo(),
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      descriptionKey: 'shortcuts.showHelp',
      category: 'general',
      action: () => {
        showShortcutsModal.value = true
      },
    },
  ]

  function handleKeyDown(e: KeyboardEvent) {
    // Ignoriere Eingaben in Textfeldern
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Finde passendes Shortcut
    const matchingShortcut = shortcuts.find((shortcut) => {
      if (shortcut.displayOnly) return false
      const keys = Array.isArray(shortcut.key) ? shortcut.key : [shortcut.key]
      const keyMatch = keys.some((k) => e.key.toLowerCase() === k.toLowerCase() || e.key === k)
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
      general: [] as KeyboardShortcut[],
    }

    // Filtere Shortcuts mit gleicher descriptionKey (z.B. Redo: Ctrl+Y / Ctrl+Shift+Z)
    const seen = new Set<string>()
    shortcuts.forEach((shortcut) => {
      const key = shortcut.descriptionKey
      if (!seen.has(key)) {
        seen.add(key)
        categories[shortcut.category].push(shortcut)
      }
    })

    return categories
  }

  function formatKey(key: string): string {
    switch (key) {
      case 'ArrowUp': return '↑'
      case 'ArrowDown': return '↓'
      case 'ArrowLeft': return '←'
      case 'ArrowRight': return '→'
      case 'Delete': return 'Del'
      case 'Backspace': return '⌫'
      case 'Escape': return 'Esc'
      case ' ': return 'Space'
      default: return key.toUpperCase()
    }
  }

  function formatShortcut(shortcut: KeyboardShortcut): string {
    const modifiers: string[] = []
    if (shortcut.ctrl) modifiers.push('Ctrl')
    if (shortcut.shift) modifiers.push('Shift')
    if (shortcut.alt) modifiers.push('Alt')

    const keys = Array.isArray(shortcut.key) ? shortcut.key : [shortcut.key]
    const keyLabel = keys.map(formatKey).join(' / ')

    return [...modifiers, keyLabel].join(' + ')
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
    cleanupKeyboardListeners,
  }
}
