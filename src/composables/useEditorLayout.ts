import { ref, watch } from 'vue'
import { useCollageStore } from '@/stores/collage'

// ── Neues Layout: Icon-Leiste + kontextbezogenes Werkzeug-Panel (links)
//    und ein auswahlabhängiger Inspektor (rechts). Alle Panels liegen im
//    Fluss (flex) – sie verkleinern die Leinwand, überdecken sie nie.
export type ToolTab = 'upload' | 'layouts' | 'effects' | 'frames' | 'images' | null
export type InspectorTab = 'selection' | 'text' | 'canvas' | 'export'

/** Ab dieser Breite (Tailwind `lg`) starten die Panels ausgeklappt. */
export const DESKTOP_MIN_WIDTH = 1024

/**
 * Zustand der Editor-Oberfläche: aktives Werkzeug (links), Inspektor (rechts)
 * und dessen Reiter. Der Inspektor folgt der Auswahl auf der Leinwand.
 */
export function useEditorLayout() {
  const collage = useCollageStore()

  const activeTool = ref<ToolTab>('upload')
  const inspectorOpen = ref(true)
  const inspectorTab = ref<InspectorTab>('canvas')

  // Icon-Leiste: aktives Werkzeug erneut anklicken klappt das Panel ein
  function selectTool(tool: Exclude<ToolTab, null>) {
    activeTool.value = activeTool.value === tool ? null : tool
  }

  // Inspektor folgt der Auswahl: Bild/Text markiert → Reiter "Auswahl"
  watch(
    () => [collage.selectedImageId, collage.selectedTextId] as const,
    ([imgId, textId]) => {
      if (imgId || textId) {
        // Ist der Nutzer bereits im Text-Reiter und wählt einen Text aus,
        // dort bleiben – die Bearbeitung wird inline unter der Liste angezeigt.
        if (textId && inspectorTab.value === 'text') {
          inspectorOpen.value = true
          return
        }
        inspectorTab.value = 'selection'
        inspectorOpen.value = true
      }
    }
  )

  /**
   * Auf kleinen Bildschirmen: Panels eingeklappt starten, damit die
   * Leinwand oben sofort sichtbar ist (Panels schieben Inhalt nur nach unten).
   */
  function collapseOnSmallScreens(viewportWidth: number) {
    if (viewportWidth < DESKTOP_MIN_WIDTH) {
      activeTool.value = null
      inspectorOpen.value = false
    }
  }

  return { activeTool, inspectorOpen, inspectorTab, selectTool, collapseOnSmallScreens }
}
