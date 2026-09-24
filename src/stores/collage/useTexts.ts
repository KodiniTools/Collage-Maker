import type { CollageText } from '@/types'
import type { CollageContext } from './context'

/** Text-Ebenen: Anlegen, Entfernen, Auswählen, Drehen und Stapelreihenfolge. */
export function useTexts(ctx: CollageContext) {
  const { images, texts, settings, selectedTextId, selectedImageIds, updateText } = ctx

  // Höchster/niedrigster zIndex über Bilder UND Texte (mindestens/höchstens 0)
  function maxZ(): number {
    return Math.max(
      ...images.value.map((img) => img.zIndex),
      ...texts.value.map((t) => t.zIndex),
      0
    )
  }
  function minZ(): number {
    return Math.min(
      ...images.value.map((img) => img.zIndex),
      ...texts.value.map((t) => t.zIndex),
      0
    )
  }

  function addText(text: string = 'Neuer Text') {
    ctx.saveStateForUndo()

    const newText: CollageText = {
      id: crypto.randomUUID(),
      text,
      x: settings.value.width / 2 - 100,
      y: settings.value.height / 2,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      rotation: 0,
      zIndex: maxZ() + 1,
      fontWeight: 400,
      fontStyle: 'normal',
      textAlign: 'center',
      shadowEnabled: false,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowBlur: 4,
      shadowColor: '#000000',
      // Textumrandung (Stroke) Defaults
      strokeEnabled: false,
      strokeColor: '#ffffff',
      strokeWidth: 2,
      // Buchstabenabstand Default
      letterSpacing: 0,
    }

    texts.value.push(newText)
    selectedTextId.value = newText.id
    selectedImageIds.value = []
    ctx.notify('toast.textAdded')
  }

  function removeText(id: string) {
    ctx.saveStateForUndo()
    const index = texts.value.findIndex((txt) => txt.id === id)
    if (index !== -1) {
      texts.value.splice(index, 1)
    }
    if (selectedTextId.value === id) {
      selectedTextId.value = null
    }
    ctx.notify('toast.textDeleted')
  }

  function selectText(id: string | null) {
    selectedTextId.value = id
    if (id !== null) {
      selectedImageIds.value = []
    }
  }

  function rotateText(id: string, degrees: number) {
    ctx.saveStateForUndo()
    const txt = texts.value.find((t) => t.id === id)
    if (txt) {
      updateText(id, { rotation: (txt.rotation + degrees) % 360 })
    }
  }

  // Text über alle Bilder und Texte nach vorne bringen
  function bringTextToFront(id: string) {
    ctx.saveStateForUndo()
    updateText(id, { zIndex: maxZ() + 1 })
    ctx.notify('toast.broughtToFront')
  }

  // Text hinter alle Bilder und Texte senden
  function sendTextToBack(id: string) {
    ctx.saveStateForUndo()
    updateText(id, { zIndex: minZ() - 1 })
    ctx.notify('toast.sentToBack')
  }

  return { addText, removeText, selectText, rotateText, bringTextToFront, sendTextToBack }
}
