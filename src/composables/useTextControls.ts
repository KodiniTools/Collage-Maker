import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCollageStore } from '@/stores/collage'
import { availableFonts } from '@/assets/fonts/fontList'

export type TextAlign = 'left' | 'center' | 'right'

/**
 * Kapselt die gesamte Logik der Textbearbeitung (TextControls).
 *
 * Wird EINMAL in TextControls.vue aufgerufen; die zurückgegebenen Werte/Funktionen
 * werden an die Unterkomponenten unter `components/text-controls/` weitergereicht.
 * Alle Änderungen wirken auf die aktuell gewählte Textebene und speichern Undo
 * (Regler/Farben entprellt, Schalter sofort).
 */
export function useTextControls() {
  const collage = useCollageStore()
  const { t } = useI18n()

  // System fonts
  const systemFonts = [
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
  ]

  // Benutzerdefinierte Schriften: flache Liste aus src/assets/fonts.
  // Jede woff2-Datei ist ein eigener Schrift-Name (z. B. "ClashDisplay Bold").
  // fonts.css (in main.ts importiert) liefert die @font-face-Regeln; die
  // woff2-Dateien werden von Vite gebündelt. Kein Server-Ordner/Fetch nötig.
  const selectedFontFamily = ref<string>('Arial')

  // Auswahl mit der aktuell gewählten Textebene synchronisieren.
  function syncFontSelection() {
    if (!collage.selectedText) return
    selectedFontFamily.value = collage.selectedText.fontFamily || 'Arial'
  }

  // Schriftart anwenden. Custom-Fonts werden vor dem Setzen geladen, damit sie
  // sofort korrekt gerendert werden (Live-Canvas & Export).
  async function updateFontFamily(family: string) {
    if (!collage.selectedText) return
    selectedFontFamily.value = family
    collage.saveStateForUndo()

    if (availableFonts.includes(family)) {
      try {
        await document.fonts.load(`48px "${family}"`)
      } catch {
        /* Font-Preload fehlgeschlagen – ignorieren, font-display: swap greift */
      }
    }

    collage.updateText(collage.selectedText.id, { fontFamily: family })
  }

  function updateTextContent(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { text: value })
  }

  function updateFontSize(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { fontSize: value })
  }

  function updateLetterSpacing(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { letterSpacing: value })
  }

  function updateColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { color: value })
  }

  const isBold = computed(() => {
    const weight = collage.selectedText?.fontWeight
    return typeof weight === 'number' ? weight >= 700 : weight === 'bold'
  })

  function toggleFontWeight() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, { fontWeight: isBold.value ? 400 : 700 })
  }

  function updateTextAlign(value: TextAlign) {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, { textAlign: value })
  }

  // UiSegmentedControl arbeitet mit string; der Proxy schreibt direkt in den Store.
  const alignOptions = computed(() => [
    { value: 'left', label: t('text.alignLeft') },
    { value: 'center', label: t('text.alignCenter') },
    { value: 'right', label: t('text.alignRight') },
  ])
  const alignModel = computed({
    get: () => (collage.selectedText?.textAlign ?? 'center') as string,
    set: (value) => updateTextAlign(value as TextAlign),
  })

  function toggleShadow() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, {
      shadowEnabled: !collage.selectedText.shadowEnabled,
    })
  }

  function updateShadowOffsetX(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowOffsetX: value })
  }

  function updateShadowOffsetY(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowOffsetY: value })
  }

  function updateShadowBlur(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowBlur: value })
  }

  function updateShadowColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowColor: value })
  }

  // Stroke (Textumrandung) Funktionen
  function toggleStroke() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, {
      strokeEnabled: !collage.selectedText.strokeEnabled,
    })
  }

  function updateStrokeColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { strokeColor: value })
  }

  function updateStrokeWidth(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { strokeWidth: value })
  }

  function deleteText() {
    if (!collage.selectedText) return
    // Undo wird in removeText gespeichert
    collage.removeText(collage.selectedText.id)
  }

  // Sync font selection when text is selected
  if (collage.selectedText) {
    syncFontSelection()
  }

  return {
    collage,
    systemFonts,
    availableFonts,
    selectedFontFamily,
    updateFontFamily,
    updateTextContent,
    updateFontSize,
    updateLetterSpacing,
    updateColor,
    isBold,
    toggleFontWeight,
    alignOptions,
    alignModel,
    toggleShadow,
    updateShadowOffsetX,
    updateShadowOffsetY,
    updateShadowBlur,
    updateShadowColor,
    toggleStroke,
    updateStrokeColor,
    updateStrokeWidth,
    deleteText,
  }
}

export type TextControlsApi = ReturnType<typeof useTextControls>
