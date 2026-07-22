import { computed, ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { BackgroundImageFit } from '@/types'

/**
 * Kapselt die gesamte Logik der Leinwand-Einstellungen (CanvasSettings).
 *
 * Wird EINMAL in CanvasSettings.vue aufgerufen; die zurückgegebenen
 * Werte/Funktionen werden an die Unterkomponenten weitergereicht. Dadurch
 * teilen sich alle Sektionen denselben Zustand (z. B. keepAspect) und das
 * Verhalten bleibt identisch zur ursprünglichen, monolithischen Komponente.
 */
export function useCanvasSettings() {
  const collage = useCollageStore()

  // Standard-Canvasgröße (für die Reset-Buttons)
  const DEFAULT_WIDTH = 700
  const DEFAULT_HEIGHT = 740
  // Grenzen der Größen-Regler / -Eingaben
  const MIN_SIZE = 10
  const MAX_SIZE = 8000
  // Ab dieser Kantenlänge kann der Export auf Mobilgeräten (v.a. iOS Safari,
  // Canvas-Flächenlimit ~16 MP) fehlschlagen → Warnhinweis anzeigen.
  const WARN_SIZE = 4096

  const showLargeSizeWarning = computed(
    () => collage.settings.width > WARN_SIZE || collage.settings.height > WARN_SIZE
  )

  // Seitenverhältnis beibehalten: bei aktivierter Option wird die jeweils
  // andere Dimension proportional mitgeführt.
  const keepAspect = ref(false)
  const aspectRatio = ref(collage.settings.width / collage.settings.height)

  // Inhalte mitskalieren: Aus = Leinwand ändert sich, Bilder/Texte behalten
  // ihre Größe (Teleskop). Ein = Bilder/Texte skalieren proportional mit.
  const scaleContent = ref(false)

  function toggleKeepAspect() {
    keepAspect.value = !keepAspect.value
    if (keepAspect.value) {
      // Aktuelles Verhältnis als Referenz merken
      aspectRatio.value = collage.settings.width / collage.settings.height
    }
  }

  function toggleScaleContent() {
    scaleContent.value = !scaleContent.value
  }

  function clampSize(value: number) {
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))
  }

  // Neue Canvasgröße anwenden – je nach Option mit oder ohne Inhalts-Skalierung
  function commitSize(width: number, height: number) {
    if (scaleContent.value) {
      collage.resizeCanvas(width, height)
    } else {
      // "Inhalte mitskalieren" AUS: Bildgrößen bleiben, aber die Positionen
      // werden proportional mitgeführt, damit beim Verkleinern der Leinwand
      // alle Bilder im Sichtfeld bleiben und die Abstände schrumpfen.
      collage.repositionContent(width, height)
    }
  }

  function applySize(width: number, height: number) {
    collage.saveStateForUndoDebounced()
    commitSize(width, height)
  }

  function updateWidth(value: number) {
    const width = value
    const height = keepAspect.value ? clampSize(width / aspectRatio.value) : collage.settings.height
    applySize(width, height)
  }

  function updateHeight(value: number) {
    const height = value
    const width = keepAspect.value ? clampSize(height * aspectRatio.value) : collage.settings.width
    applySize(width, height)
  }

  function resetWidth() {
    collage.saveStateForUndo()
    const height = keepAspect.value
      ? clampSize(DEFAULT_WIDTH / aspectRatio.value)
      : collage.settings.height
    commitSize(DEFAULT_WIDTH, height)
  }

  function resetHeight() {
    collage.saveStateForUndo()
    const width = keepAspect.value
      ? clampSize(DEFAULT_HEIGHT * aspectRatio.value)
      : collage.settings.width
    commitSize(width, DEFAULT_HEIGHT)
  }

  // ── Abgerundete Ecken ──────────────────────────────────────────────────
  const maxCornerRadius = computed(() =>
    Math.floor(Math.min(collage.settings.width, collage.settings.height) / 2)
  )

  function updateCornerRadius(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateSettings({ cornerRadius: value })
  }

  // ── Canvas-Rahmen ──────────────────────────────────────────────────────
  function toggleCanvasBorder() {
    collage.saveStateForUndo()
    collage.updateCanvasBorder({ enabled: !collage.settings.border.enabled })
  }

  function updateBorderWidth(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateCanvasBorder({ width: value })
  }

  function updateBorderColor(value: string) {
    collage.saveStateForUndoDebounced()
    collage.updateCanvasBorder({ color: value })
  }

  function updateBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double') {
    collage.saveStateForUndo()
    collage.updateCanvasBorder({ style: value })
  }

  // ── Hintergrund ────────────────────────────────────────────────────────
  function updateBackgroundColor(value: string) {
    collage.saveStateForUndoDebounced()
    // Bei Farbauswahl das Hintergrundbild entfernen (skipUndo da oben bereits gespeichert)
    if (collage.settings.backgroundImage.url) {
      collage.removeBackgroundImage(true)
    }
    collage.updateSettings({ backgroundColor: value })
  }

  function updateBackgroundFit(value: BackgroundImageFit) {
    collage.saveStateForUndo()
    collage.setBackgroundImageFit(value)
  }

  function removeBackground() {
    // Undo wird in removeBackgroundImage gespeichert
    collage.removeBackgroundImage()
  }

  function updateBackgroundOpacity(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ opacity: value })
  }

  function updateBackgroundBrightness(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ brightness: value })
  }

  function updateBackgroundContrast(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ contrast: value })
  }

  function updateBackgroundSaturation(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ saturation: value })
  }

  function updateBackgroundBlur(value: number) {
    collage.saveStateForUndoDebounced()
    collage.updateBackgroundImage({ blur: value })
  }

  // ── Zoom & Ansicht ─────────────────────────────────────────────────────
  function updateZoom(value: number) {
    collage.setCanvasZoom(value)
  }

  function resetView() {
    collage.resetCanvasView()
  }

  // ── Hilfsraster ────────────────────────────────────────────────────────
  // Das Raster ist eine reine Orientierungshilfe und wird nicht exportiert,
  // daher wird es nicht in die Undo-Historie aufgenommen (wie der Zoom).
  function toggleGrid() {
    collage.updateSettings({ gridEnabled: !collage.settings.gridEnabled })
  }

  function updateGridSize(value: number) {
    collage.updateSettings({ gridSize: value })
  }

  return {
    collage,
    // Konstanten
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MIN_SIZE,
    MAX_SIZE,
    // Größe
    showLargeSizeWarning,
    keepAspect,
    scaleContent,
    toggleKeepAspect,
    toggleScaleContent,
    updateWidth,
    updateHeight,
    resetWidth,
    resetHeight,
    // Ecken
    maxCornerRadius,
    updateCornerRadius,
    // Rahmen
    toggleCanvasBorder,
    updateBorderWidth,
    updateBorderColor,
    updateBorderStyle,
    // Hintergrund
    updateBackgroundColor,
    updateBackgroundFit,
    removeBackground,
    updateBackgroundOpacity,
    updateBackgroundBrightness,
    updateBackgroundContrast,
    updateBackgroundSaturation,
    updateBackgroundBlur,
    // Zoom
    updateZoom,
    resetView,
    // Raster
    toggleGrid,
    updateGridSize,
  }
}

export type CanvasSettingsApi = ReturnType<typeof useCanvasSettings>
