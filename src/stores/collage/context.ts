import type { ComputedRef, Ref } from 'vue'
import type { CollageImage, CollageSettings, CollageText, LayoutType } from '@/types'

/**
 * Gemeinsamer Zustand und Basis-Aktionen des Collage-Stores, die an die
 * Teil-Composables (Galerie, Anordnen, Text, …) übergeben werden.
 */
export interface CollageContext {
  images: Ref<CollageImage[]>
  texts: Ref<CollageText[]>
  settings: Ref<CollageSettings>
  selectedImageIds: Ref<string[]>
  selectedGalleryIds: Ref<string[]>
  selectedTextId: Ref<string | null>
  isBackgroundSelected: Ref<boolean>
  selectedImages: ComputedRef<CollageImage[]>
  saveStateForUndo: () => void
  saveStateForUndoDebounced: () => void
  notify: (messageKey: string, params?: Record<string, unknown>) => void
  showUndoToast: (messageKey?: string, params?: Record<string, unknown>) => void
  updateImage: (id: string, updates: Partial<CollageImage>) => void
  updateText: (id: string, updates: Partial<CollageText>) => void
  removeImage: (id: string, skipUndo?: boolean) => void
  applyLayout: (layout: LayoutType, skipUndo?: boolean) => void
  /** Wendet das aktive Layout erneut an (ohne Undo/Toast), außer bei Freestyle. */
  reapplyLayout: () => void
}

/** Höchster zIndex aller Bilder (mindestens 0). */
export function maxImageZ(images: CollageImage[]): number {
  return Math.max(...images.map((img) => img.zIndex), 0)
}
