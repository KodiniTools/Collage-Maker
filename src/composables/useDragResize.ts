import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { GuideLine } from './useAlignmentGuides'
import { computeLocalCorners, hasDistortion } from '@/lib/warpImage'
import type { CornerOffsets } from '@/types'

type Corner = 'nw' | 'ne' | 'se' | 'sw'

// Emitter for double-tap events (used by CollageCanvas to show preview)
type DoubleTapHandler = (clientX: number, clientY: number) => void

export function useDragResize(
  canvas: Ref<HTMLCanvasElement | null>,
  autoFitScale: ComputedRef<number>,
  panOffset: Ref<{ x: number; y: number }>,
  spacePressed: Ref<boolean>,
  guides: {
    activeGuides: Ref<GuideLine[]>
    detectAlignments: (
      imgX: number,
      imgY: number,
      imgWidth: number,
      imgHeight: number,
      excludeId: string
    ) => { snapX: number | null; snapY: number | null; guides: GuideLine[] }
    detectResizeAlignments: (
      imgX: number,
      imgY: number,
      imgWidth: number,
      imgHeight: number,
      excludeId: string,
      handle: string
    ) => {
      snapLeft: number | null
      snapRight: number | null
      snapTop: number | null
      snapBottom: number | null
      guides: GuideLine[]
    }
  },
  getCtx: () => CanvasRenderingContext2D | null,
  onDoubleTap?: DoubleTapHandler
) {
  const collage = useCollageStore()

  // Cursor map for resize handles
  const HANDLE_CURSORS: Record<string, string> = {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize',
  }

  // All the drag/resize/pan state:
  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeHandle = ref<string | null>(null)
  const cursorStyle = ref<string>('move')
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragImageStart = ref({ x: 0, y: 0 })
  // Startpositionen aller ausgewählten Bilder für Mehfach-Drag
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
  const shiftPressed = ref(false)
  const initialAspectRatio = ref(1)
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const panStartOffset = ref({ x: 0, y: 0 })

  // Touch / pinch state
  const isPinching = ref(false)
  const pinchStartDistance = ref(0)
  const pinchStartWidth = ref(0)
  const pinchStartHeight = ref(0)
  const pinchStartImgX = ref(0)
  const pinchStartImgY = ref(0)
  const pinchInitialZoom = ref(1)
  const pinchCenterStart = ref({ x: 0, y: 0 })
  const pinchPanStartOffset = ref({ x: 0, y: 0 })
  const lastTapTime = ref(0)

  // Text-Skalierung (Resize über Eck-Handles)
  const isTextResizing = ref(false)
  const textResizeStartFont = ref(0)
  const textResizeStartDist = ref(0)

  // Freies Verzerren (Distort): einzelne Ecke ziehen
  const isDistorting = ref(false)
  const distortCorner = ref<Corner | null>(null)

  // Wandelt einen Klickpunkt (Canvas-Koordinaten) in das lokale, um die Bildmitte
  // zentrierte Koordinatensystem des Bildes um – inkl. Rotation, Spiegelung und
  // Neigung/Scherung. Muss zur Zeichenreihenfolge im Renderer passen:
  // translate → rotate → scale(flip) → skew.
  function toLocalImagePoint(x: number, y: number, img: any): { localX: number; localY: number } {
    const centerX = img.x + img.width / 2
    const centerY = img.y + img.height / 2

    // 1) Rotation invertieren
    const angle = (img.rotation * Math.PI) / 180
    const dx = x - centerX
    const dy = y - centerY
    let localX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
    let localY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

    // 2) Spiegelung invertieren (Faktor ±1, selbst-invers)
    localX *= img.flipHorizontal ? -1 : 1
    localY *= img.flipVertical ? -1 : 1

    // 3) Neigung/Scherung invertieren: Matrix [[1, tanX], [tanY, 1]] umkehren
    const tanX = Math.tan(((img.skewX ?? 0) * Math.PI) / 180)
    const tanY = Math.tan(((img.skewY ?? 0) * Math.PI) / 180)
    if (tanX !== 0 || tanY !== 0) {
      let det = 1 - tanX * tanY
      if (Math.abs(det) < 1e-6) det = det < 0 ? -1e-6 : 1e-6
      const sx = localX
      const sy = localY
      localX = (sx - tanX * sy) / det
      localY = (sy - tanY * sx) / det
    }

    return { localX, localY }
  }

  function getResizeHandle(x: number, y: number, img: any, touchMode = false): string | null {
    // Trefferradius an den Anzeige-Zoom koppeln (konstante Bildschirmgröße),
    // damit Handles auf großen Leinwänden nicht winzig zu treffen sind.
    const fit = autoFitScale.value || 1
    const hitRadius = (touchMode ? 40 : 13) / fit

    // Klickpunkt ins lokale Bildkoordinatensystem transformieren
    // (Rotation + Spiegelung + Neigung)
    const { localX: rotatedX, localY: rotatedY } = toLocalImagePoint(x, y, img)

    const handles = [
      { x: -img.width / 2, y: -img.height / 2, name: 'nw' },
      { x: 0, y: -img.height / 2, name: 'n' },
      { x: img.width / 2, y: -img.height / 2, name: 'ne' },
      { x: img.width / 2, y: 0, name: 'e' },
      { x: img.width / 2, y: img.height / 2, name: 'se' },
      { x: 0, y: img.height / 2, name: 's' },
      { x: -img.width / 2, y: img.height / 2, name: 'sw' },
      { x: -img.width / 2, y: 0, name: 'w' },
    ]

    // Prüfe jedes Handle
    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(rotatedX - handle.x, 2) + Math.pow(rotatedY - handle.y, 2)
      )
      if (distance <= hitRadius) {
        return handle.name
      }
    }

    return null
  }

  // ─── Freies Verzerren (Distort) ────────────────────────────────────────────

  // Basis-Eckposition (unverzerrt) im lokalen Bildsystem.
  function baseCorner(img: any, corner: Corner): { x: number; y: number } {
    const hw = img.width / 2
    const hh = img.height / 2
    switch (corner) {
      case 'nw':
        return { x: -hw, y: -hh }
      case 'ne':
        return { x: hw, y: -hh }
      case 'se':
        return { x: hw, y: hh }
      case 'sw':
        return { x: -hw, y: hh }
    }
  }

  // Vollständiges Offsets-Objekt aus dem aktuellen Bild (fehlende Ecken = 0).
  function currentOffsets(img: any): CornerOffsets {
    const o = img.cornerOffsets
    return {
      nw: { x: o?.nw.x ?? 0, y: o?.nw.y ?? 0 },
      ne: { x: o?.ne.x ?? 0, y: o?.ne.y ?? 0 },
      se: { x: o?.se.x ?? 0, y: o?.se.y ?? 0 },
      sw: { x: o?.sw.x ?? 0, y: o?.sw.y ?? 0 },
    }
  }

  // Prüft, ob ein Distort-Eckpunkt getroffen wurde (lokale, verzerrte Ecken).
  function getDistortHandle(x: number, y: number, img: any, touchMode = false): Corner | null {
    const { localX, localY } = toLocalImagePoint(x, y, img)
    const c = computeLocalCorners(img.width, img.height, img.cornerOffsets)
    const fit = autoFitScale.value || 1
    const hitRadius = (touchMode ? 40 : 13) / fit
    const entries: [Corner, { x: number; y: number }][] = [
      ['nw', c.nw],
      ['ne', c.ne],
      ['se', c.se],
      ['sw', c.sw],
    ]
    for (const [name, p] of entries) {
      if (Math.hypot(localX - p.x, localY - p.y) <= hitRadius) return name
    }
    return null
  }

  // Punkt-in-Viereck-Test im lokalen System (für Auswahl verzerrter Bilder).
  function isPointInDistortedImage(x: number, y: number, img: any): boolean {
    const { localX, localY } = toLocalImagePoint(x, y, img)
    const c = computeLocalCorners(img.width, img.height, img.cornerOffsets)
    const pts = [c.nw, c.ne, c.se, c.sw]
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x
      const yi = pts[i].y
      const xj = pts[j].x
      const yj = pts[j].y
      const intersect =
        yi > localY !== yj > localY && localX < ((xj - xi) * (localY - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
  }

  // Trefferzone eines Bildes (verzerrt: Viereck, sonst achsenparallele Box).
  function isPointInImage(x: number, y: number, img: any): boolean {
    if (img.distortEnabled && hasDistortion(img.cornerOffsets)) {
      return isPointInDistortedImage(x, y, img)
    }
    return x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height
  }

  function isDeleteButtonClicked(x: number, y: number, img: any, touchMode = false): boolean {
    const fit = autoFitScale.value || 1
    // Muss zur Zeichnung passen: 14 * ui, innen in der oberen rechten Ecke.
    const drawSize = 14 / fit

    // Klickpunkt ins lokale Bildkoordinatensystem transformieren
    // (Rotation + Spiegelung + Neigung) – muss zur Zeichnung im Renderer passen
    const { localX: rotatedX, localY: rotatedY } = toLocalImagePoint(x, y, img)

    // Position des Löschbuttons im Bild-Koordinatensystem (Mittelpunkt)
    const deleteButtonX = img.width / 2 - drawSize / 2 - 2 / fit
    const deleteButtonY = -img.height / 2 + drawSize / 2 + 2 / fit

    // Trefferradius etwas grösser als der sichtbare Radius (7 / fit), für Touch mehr
    const hitRadius = (touchMode ? 22 : 11) / fit

    // Prüfe ob Klick innerhalb des Löschbuttons ist (Kreis)
    const distance = Math.sqrt(
      Math.pow(rotatedX - deleteButtonX, 2) + Math.pow(rotatedY - deleteButtonY, 2)
    )

    return distance <= hitRadius
  }

  // Bounding-Box eines Textes in dessen lokalem (unrotiertem) Koordinatensystem.
  // Muss zur Darstellung im Renderer passen (gleiche Schrift/Metriken).
  function getTextBox(text: any, ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
    ctx.letterSpacing = `${text.letterSpacing}px`
    const lines: string[] = text.text.split('\n')
    const lineHeight = text.fontSize * 1.2
    const boxHeight = lines.length * lineHeight
    const boxWidth = Math.max(0, ...lines.map((line) => ctx.measureText(line).width))
    ctx.restore()

    let offsetX = 0
    if (text.textAlign === 'center') offsetX = -boxWidth / 2
    else if (text.textAlign === 'right') offsetX = -boxWidth

    return {
      left: offsetX - 5,
      right: offsetX + boxWidth + 5,
      top: -boxHeight / 2 - 5,
      bottom: boxHeight / 2 + 5,
    }
  }

  // Prüft, ob ein Eck-Skalierungspunkt des Textes getroffen wurde.
  function getTextResizeHandle(
    x: number,
    y: number,
    text: any,
    ctx: CanvasRenderingContext2D,
    touchMode = false
  ): string | null {
    const box = getTextBox(text, ctx)
    // Trefferradius an den Anzeige-Zoom koppeln (konstante Bildschirmgröße)
    const fit = autoFitScale.value || 1
    const hitRadius = (touchMode ? 40 : 13) / fit

    // Klickpunkt ins lokale (unrotierte) Koordinatensystem des Textes transformieren
    const angle = (text.rotation * Math.PI) / 180
    const dx = x - text.x
    const dy = y - text.y
    const localX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
    const localY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

    const corners = [
      { x: box.left, y: box.top, name: 'nw' },
      { x: box.right, y: box.top, name: 'ne' },
      { x: box.right, y: box.bottom, name: 'se' },
      { x: box.left, y: box.bottom, name: 'sw' },
    ]

    for (const corner of corners) {
      if (Math.hypot(localX - corner.x, localY - corner.y) <= hitRadius) {
        return corner.name
      }
    }
    return null
  }

  function handleMouseDown(e: MouseEvent) {
    if (!canvas.value) return

    // Pan with middle mouse button or Space + left click
    if (e.button === 1 || (e.button === 0 && spacePressed.value)) {
      if (collage.canvasZoom > 1) {
        isPanning.value = true
        panStart.value = { x: e.clientX, y: e.clientY }
        panStartOffset.value = { ...panOffset.value }
        e.preventDefault()
        return
      }
    }

    const rect = canvas.value.getBoundingClientRect()
    // Berücksichtige Auto-Fit-Zoom beim Berechnen der Koordinaten
    const zoom = autoFitScale.value
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Prüfe ob ein Löschbutton angeklickt wurde (NUR Canvas-Instanzen, keine Templates!)
    const clickedDeleteImage = collage.images
      .filter((img) => img.isGalleryTemplate !== true)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => isDeleteButtonClicked(x, y, img))

    if (clickedDeleteImage) {
      // Bild aus Canvas entfernen mit „Rückgängig"-Toast (kein Dialog nötig)
      collage.removeImageWithUndoToast(clickedDeleteImage.id)
      return
    }

    // Distort-Modus: einzelne Ecke ziehen (hat Vorrang, Skalierpunkte sind aus)
    const selectedImg = collage.selectedImage
    if (selectedImg && selectedImg.distortEnabled) {
      const corner = getDistortHandle(x, y, selectedImg)
      if (corner) {
        collage.saveStateForUndo()
        isDistorting.value = true
        distortCorner.value = corner
        return
      }
    } else if (selectedImg) {
      // Prüfe ob ein Resize-Handle des ausgewählten Bildes angeklickt wurde
      const handle = getResizeHandle(x, y, selectedImg)
      if (handle) {
        // Speichere Zustand für Undo VOR dem Resize
        collage.saveStateForUndo()
        isResizing.value = true
        resizeHandle.value = handle
        dragStartPos.value = { x, y }
        resizeStart.value = {
          x: selectedImg.x,
          y: selectedImg.y,
          width: selectedImg.width,
          height: selectedImg.height,
        }
        shiftPressed.value = e.shiftKey
        initialAspectRatio.value = selectedImg.width / selectedImg.height
        return
      }
    }

    // Skalierungspunkt des ausgewählten Textes angeklickt?
    const selectedTextForResize = collage.selectedText
    if (selectedTextForResize) {
      const ctxForText = getCtx()
      const handle = ctxForText
        ? getTextResizeHandle(x, y, selectedTextForResize, ctxForText)
        : null
      if (handle) {
        collage.saveStateForUndo()
        isTextResizing.value = true
        textResizeStartFont.value = selectedTextForResize.fontSize
        textResizeStartDist.value = Math.max(
          1,
          Math.hypot(x - selectedTextForResize.x, y - selectedTextForResize.y)
        )
        return
      }
    }

    // Finde angeklickten Text (von oben nach unten, höchster zIndex zuerst)
    const ctx = getCtx()
    const clickedText = [...collage.texts]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((text) => {
        if (!ctx) return false

        const context = ctx

        context.save()
        context.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
        context.textAlign = text.textAlign

        const lines = text.text.split('\n')
        const lineHeight = text.fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        const maxWidth = Math.max(...lines.map((line) => context.measureText(line).width))

        let offsetX = 0
        if (text.textAlign === 'center') offsetX = -maxWidth / 2
        else if (text.textAlign === 'right') offsetX = -maxWidth

        const boxX = text.x + offsetX - 5
        const boxY = text.y - totalHeight / 2 - 5
        const boxWidth = maxWidth + 10
        const boxHeight = totalHeight + 10

        context.restore()

        return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight
      })

    if (clickedText) {
      // Speichere Zustand für Undo VOR dem Verschieben
      collage.saveStateForUndo()
      collage.selectText(clickedText.id)
      isDragging.value = true
      dragStartPos.value = { x, y }
      dragImageStart.value = { x: clickedText.x, y: clickedText.y }
      return
    }

    // Finde angeklicktes Bild (von oben nach unten, nur Canvas-Instanzen)
    const canvasImages = collage.images.filter((img) => img.isGalleryTemplate !== true)
    const clickedImage = [...canvasImages]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => isPointInImage(x, y, img))

    if (clickedImage) {
      // Speichere Zustand für Undo VOR dem Verschieben
      collage.saveStateForUndo()
      // Ctrl/Cmd+Click für Mehrfachauswahl
      if (e.ctrlKey || e.metaKey) {
        collage.toggleImageSelection(clickedImage.id)
        // Bei Mehrfachauswahl: Dragging nur starten, wenn das Bild ausgewählt ist
        if (collage.isImageSelected(clickedImage.id)) {
          isDragging.value = true
          dragStartPos.value = { x, y }
          dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
          // Startpositionen aller ausgewählten Bilder speichern
          dragStartPositions.value = new Map()
          collage.selectedImages.forEach((img) => {
            dragStartPositions.value.set(img.id, { x: img.x, y: img.y })
          })
        }
      } else if (collage.isImageSelected(clickedImage.id)) {
        // Klick auf ein bereits ausgewähltes Bild: Auswahl beibehalten, Drag starten
        isDragging.value = true
        dragStartPos.value = { x, y }
        dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
        // Startpositionen aller ausgewählten Bilder speichern
        dragStartPositions.value = new Map()
        collage.selectedImages.forEach((img) => {
          dragStartPositions.value.set(img.id, { x: img.x, y: img.y })
        })
      } else {
        // Normaler Klick auf ein nicht-ausgewähltes Bild: Ersetzt die Auswahl
        collage.selectImage(clickedImage.id)
        isDragging.value = true
        dragStartPos.value = { x, y }
        dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
        dragStartPositions.value = new Map()
        dragStartPositions.value.set(clickedImage.id, { x: clickedImage.x, y: clickedImage.y })
      }
      collage.selectText(null) // Text explizit deselektieren beim Bildklick
      collage.selectBackground(false) // Hintergrund deselektieren
    } else {
      // Kein Bild/Text getroffen - prüfe ob Hintergrundbild ausgewählt werden soll
      if (collage.settings.backgroundImage.url) {
        collage.selectBackground(true)
      } else {
        collage.selectBackground(false)
      }
      collage.selectImage(null)
      collage.selectText(null)
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas.value) return

    // Handle panning
    if (isPanning.value) {
      const dx = e.clientX - panStart.value.x
      const dy = e.clientY - panStart.value.y
      panOffset.value = {
        x: panStartOffset.value.x + dx,
        y: panStartOffset.value.y + dy,
      }
      cursorStyle.value = 'grabbing'
      return
    }

    const rect = canvas.value.getBoundingClientRect()
    const zoom = autoFitScale.value
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Cursor-Update when idle (not dragging/resizing/distorting)
    if (!isDragging.value && !isResizing.value && !isTextResizing.value && !isDistorting.value) {
      const selectedImg = collage.selectedImage
      if (selectedImg && selectedImg.distortEnabled) {
        // Distort-Modus: Eckpunkte + Innenfläche
        const corner = getDistortHandle(x, y, selectedImg)
        if (corner) {
          cursorStyle.value = 'crosshair'
        } else if (isPointInImage(x, y, selectedImg)) {
          cursorStyle.value = 'move'
        } else {
          cursorStyle.value = 'default'
        }
      } else if (selectedImg) {
        const handle = getResizeHandle(x, y, selectedImg)
        if (handle) {
          cursorStyle.value = HANDLE_CURSORS[handle] ?? 'move'
        } else if (
          x >= selectedImg.x &&
          x <= selectedImg.x + selectedImg.width &&
          y >= selectedImg.y &&
          y <= selectedImg.y + selectedImg.height
        ) {
          cursorStyle.value = 'move'
        } else {
          cursorStyle.value = 'default'
        }
      } else if (collage.selectedText) {
        const ctxForCursor = getCtx()
        const handle = ctxForCursor
          ? getTextResizeHandle(x, y, collage.selectedText, ctxForCursor)
          : null
        cursorStyle.value = handle
          ? handle === 'nw' || handle === 'se'
            ? 'nwse-resize'
            : 'nesw-resize'
          : 'default'
      } else {
        cursorStyle.value = 'default'
      }
    }

    // Text-Skalierung über Eck-Handles (Schriftgröße proportional zur Distanz)
    if (isTextResizing.value && collage.selectedTextId && collage.selectedText) {
      const dist = Math.hypot(x - collage.selectedText.x, y - collage.selectedText.y)
      const scale = dist / textResizeStartDist.value
      const newFontSize = Math.max(
        12,
        Math.min(2000, Math.round(textResizeStartFont.value * scale))
      )
      collage.updateText(collage.selectedText.id, { fontSize: newFontSize })
      return
    }

    // Freies Verzerren: gezogene Ecke einzeln versetzen (lokales System)
    if (
      isDistorting.value &&
      distortCorner.value &&
      collage.selectedImageId &&
      collage.selectedImage
    ) {
      const img = collage.selectedImage
      const { localX, localY } = toLocalImagePoint(x, y, img)
      const base = baseCorner(img, distortCorner.value)
      const offsets = currentOffsets(img)
      offsets[distortCorner.value] = { x: localX - base.x, y: localY - base.y }
      collage.updateImage(img.id, { cornerOffsets: offsets })
      return
    }

    if (
      (!collage.selectedImageId && !collage.selectedTextId) ||
      (!isDragging.value && !isResizing.value)
    )
      return

    // Text-Drag-Funktionalität
    if (isDragging.value && collage.selectedTextId && collage.selectedText) {
      const dx = x - dragStartPos.value.x
      const dy = y - dragStartPos.value.y
      collage.updateText(collage.selectedText.id, {
        x: dragImageStart.value.x + dx,
        y: dragImageStart.value.y + dy,
      })
      return
    }

    if (isResizing.value && resizeHandle.value && collage.selectedImageId) {
      const dx = x - dragStartPos.value.x
      const dy = y - dragStartPos.value.y
      // Verwende den Lock aus dem Store, aber Shift-Taste kann es temporär überschreiben
      const keepAspectRatio = e.shiftKey ? !collage.lockAspectRatio : collage.lockAspectRatio

      let newWidth = resizeStart.value.width
      let newHeight = resizeStart.value.height
      let newX = resizeStart.value.x
      let newY = resizeStart.value.y

      // Berechne neue Größe basierend auf dem Handle
      switch (resizeHandle.value) {
        case 'nw':
          newWidth = resizeStart.value.width - dx
          newHeight = resizeStart.value.height - dy
          newX = resizeStart.value.x + dx
          newY = resizeStart.value.y + dy
          if (keepAspectRatio) {
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
            newWidth = resizeStart.value.width * avgChange
            newHeight = resizeStart.value.height * avgChange
            newX = resizeStart.value.x + (resizeStart.value.width - newWidth)
            newY = resizeStart.value.y + (resizeStart.value.height - newHeight)
          }
          break
        case 'n':
          newHeight = resizeStart.value.height - dy
          newY = resizeStart.value.y + dy
          if (keepAspectRatio) {
            newWidth = newHeight * initialAspectRatio.value
            newX = resizeStart.value.x - (newWidth - resizeStart.value.width) / 2
          }
          break
        case 'ne':
          newWidth = resizeStart.value.width + dx
          newHeight = resizeStart.value.height - dy
          newY = resizeStart.value.y + dy
          if (keepAspectRatio) {
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
            newWidth = resizeStart.value.width * avgChange
            newHeight = resizeStart.value.height * avgChange
            newY = resizeStart.value.y + (resizeStart.value.height - newHeight)
          }
          break
        case 'e':
          newWidth = resizeStart.value.width + dx
          if (keepAspectRatio) {
            newHeight = newWidth / initialAspectRatio.value
            newY = resizeStart.value.y - (newHeight - resizeStart.value.height) / 2
          }
          break
        case 'se':
          newWidth = resizeStart.value.width + dx
          newHeight = resizeStart.value.height + dy
          if (keepAspectRatio) {
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
            newWidth = resizeStart.value.width * avgChange
            newHeight = resizeStart.value.height * avgChange
          }
          break
        case 's':
          newHeight = resizeStart.value.height + dy
          if (keepAspectRatio) {
            newWidth = newHeight * initialAspectRatio.value
            newX = resizeStart.value.x - (newWidth - resizeStart.value.width) / 2
          }
          break
        case 'sw':
          newWidth = resizeStart.value.width - dx
          newHeight = resizeStart.value.height + dy
          newX = resizeStart.value.x + dx
          if (keepAspectRatio) {
            const avgChange =
              (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
            newWidth = resizeStart.value.width * avgChange
            newHeight = resizeStart.value.height * avgChange
            newX = resizeStart.value.x + (resizeStart.value.width - newWidth)
          }
          break
        case 'w':
          newWidth = resizeStart.value.width - dx
          newX = resizeStart.value.x + dx
          if (keepAspectRatio) {
            newHeight = newWidth / initialAspectRatio.value
            newY = resizeStart.value.y - (newHeight - resizeStart.value.height) / 2
          }
          break
      }

      // Mindestgröße von 20px
      if (newWidth >= 20 && newHeight >= 20) {
        // Smart Guides beim Resize: Erkennung und Snap
        const resizeSnap = guides.detectResizeAlignments(
          newX,
          newY,
          newWidth,
          newHeight,
          collage.selectedImageId,
          resizeHandle.value
        )

        // Wende Snap-Positionen an
        if (resizeSnap.snapLeft !== null) {
          // Linke Kante snappt - Position und Breite anpassen
          const oldRight = newX + newWidth
          newX = resizeSnap.snapLeft
          newWidth = oldRight - newX
        }
        if (resizeSnap.snapRight !== null) {
          // Rechte Kante snappt - nur Breite anpassen
          newWidth = resizeSnap.snapRight - newX
        }
        if (resizeSnap.snapTop !== null) {
          // Obere Kante snappt - Position und Höhe anpassen
          const oldBottom = newY + newHeight
          newY = resizeSnap.snapTop
          newHeight = oldBottom - newY
        }
        if (resizeSnap.snapBottom !== null) {
          // Untere Kante snappt - nur Höhe anpassen
          newHeight = resizeSnap.snapBottom - newY
        }

        // Aktualisiere aktive Guide-Linien für die Anzeige
        guides.activeGuides.value = resizeSnap.guides

        // Nochmal Mindestgröße prüfen nach Snap
        if (newWidth >= 20 && newHeight >= 20) {
          collage.updateImage(collage.selectedImageId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          })
        }
      }
    } else if (isDragging.value && collage.selectedImageId) {
      const dx = x - dragStartPos.value.x
      const dy = y - dragStartPos.value.y

      // Berechne Zielposition für das primäre Bild
      let targetX = dragImageStart.value.x + dx
      let targetY = dragImageStart.value.y + dy

      // Smart Guides für das primäre Bild
      let snapDx = dx
      let snapDy = dy
      const selectedImg = collage.selectedImage
      if (selectedImg) {
        const alignment = guides.detectAlignments(
          targetX,
          targetY,
          selectedImg.width,
          selectedImg.height,
          selectedImg.id
        )

        if (alignment.snapX !== null) {
          targetX = alignment.snapX
          snapDx = targetX - dragImageStart.value.x
        }
        if (alignment.snapY !== null) {
          targetY = alignment.snapY
          snapDy = targetY - dragImageStart.value.y
        }

        guides.activeGuides.value = alignment.guides
      }

      // Alle ausgewählten Bilder gemeinsam verschieben
      if (dragStartPositions.value.size > 1) {
        dragStartPositions.value.forEach((startPos, imgId) => {
          collage.updateImage(imgId, {
            x: startPos.x + snapDx,
            y: startPos.y + snapDy,
          })
        })
      } else {
        collage.updateImage(collage.selectedImageId, {
          x: targetX,
          y: targetY,
        })
      }
    }
  }

  function handleMouseUp() {
    isDragging.value = false
    isResizing.value = false
    isTextResizing.value = false
    isDistorting.value = false
    distortCorner.value = null
    isPanning.value = false
    resizeHandle.value = null
    cursorStyle.value = 'default'
    // Smart Guides ausblenden wenn Drag/Resize beendet
    guides.activeGuides.value = []
  }

  // ─── Touch helpers ───────────────────────────────────────────────────────────

  function getPinchDistance(e: TouchEvent): number {
    const dx = e.touches[1].clientX - e.touches[0].clientX
    const dy = e.touches[1].clientY - e.touches[0].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function getPinchCenter(e: TouchEvent): { x: number; y: number } {
    return {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    }
  }

  /** Synthetic mouse-like object for delegating touch coords to existing handlers */
  function syntheticMouse(
    clientX: number,
    clientY: number,
    extra?: Partial<MouseEvent>
  ): MouseEvent {
    return {
      clientX,
      clientY,
      button: 0,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      ...extra,
    } as unknown as MouseEvent
  }

  // ─── Touch event handlers ────────────────────────────────────────────────────

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (!canvas.value) return

    if (e.touches.length === 2) {
      // Stop any single-touch drag that was in progress
      handleMouseUp()

      const selectedImg = collage.selectedImage
      const distance = getPinchDistance(e)
      const center = getPinchCenter(e)

      if (selectedImg) {
        // Two fingers on a selected image: pinch to resize + pan simultaneously
        collage.saveStateForUndo()
        isPinching.value = true
        pinchStartDistance.value = distance
        pinchStartWidth.value = selectedImg.width
        pinchStartHeight.value = selectedImg.height
        pinchStartImgX.value = selectedImg.x
        pinchStartImgY.value = selectedImg.y
        initialAspectRatio.value = selectedImg.width / selectedImg.height
      } else {
        // Two fingers with no selection: pinch-zoom the canvas
        isPinching.value = true
        pinchStartDistance.value = distance
        pinchInitialZoom.value = collage.canvasZoom
      }

      // Always allow two-finger pan alongside pinch
      isPanning.value = true
      pinchCenterStart.value = center
      pinchPanStartOffset.value = { ...panOffset.value }
      return
    }

    // ── Single touch ──────────────────────────────────────────────────────────
    const touch = e.touches[0]

    // Double-tap detection (300 ms window)
    const now = Date.now()
    if (now - lastTapTime.value < 300) {
      lastTapTime.value = 0
      onDoubleTap?.(touch.clientX, touch.clientY)
      return
    }
    lastTapTime.value = now

    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    const zoom = autoFitScale.value
    const x = (touch.clientX - rect.left) / zoom
    const y = (touch.clientY - rect.top) / zoom

    // Delete button (enlarged for touch)
    const clickedDeleteImage = collage.images
      .filter((img) => img.isGalleryTemplate !== true)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((img) => isDeleteButtonClicked(x, y, img, true))

    if (clickedDeleteImage) {
      collage.removeImageWithUndoToast(clickedDeleteImage.id)
      return
    }

    // Distort-Eckpunkt (vergrößerte Trefferfläche für Touch) – Vorrang im Modus
    const selectedImg = collage.selectedImage
    if (selectedImg && selectedImg.distortEnabled) {
      const corner = getDistortHandle(x, y, selectedImg, true)
      if (corner) {
        collage.saveStateForUndo()
        isDistorting.value = true
        distortCorner.value = corner
        return
      }
    } else if (selectedImg) {
      // Resize handle (enlarged for touch)
      const handle = getResizeHandle(x, y, selectedImg, true)
      if (handle) {
        collage.saveStateForUndo()
        isResizing.value = true
        resizeHandle.value = handle
        dragStartPos.value = { x, y }
        resizeStart.value = {
          x: selectedImg.x,
          y: selectedImg.y,
          width: selectedImg.width,
          height: selectedImg.height,
        }
        shiftPressed.value = false
        initialAspectRatio.value = selectedImg.width / selectedImg.height
        return
      }
    }

    // Text-Skalierungspunkt (vergrösserte Trefferfläche für Touch)
    const selectedTextTouch = collage.selectedText
    if (selectedTextTouch) {
      const ctxTouch = getCtx()
      const handle = ctxTouch ? getTextResizeHandle(x, y, selectedTextTouch, ctxTouch, true) : null
      if (handle) {
        collage.saveStateForUndo()
        isTextResizing.value = true
        textResizeStartFont.value = selectedTextTouch.fontSize
        textResizeStartDist.value = Math.max(
          1,
          Math.hypot(x - selectedTextTouch.x, y - selectedTextTouch.y)
        )
        return
      }
    }

    // Delegate the rest to existing mousedown logic
    handleMouseDown(syntheticMouse(touch.clientX, touch.clientY))
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (!canvas.value) return

    if (e.touches.length === 2 && isPinching.value) {
      const currentDistance = getPinchDistance(e)
      const currentCenter = getPinchCenter(e)
      const scale = currentDistance / pinchStartDistance.value

      // Pan: move with the center of the two fingers
      if (isPanning.value) {
        panOffset.value = {
          x: pinchPanStartOffset.value.x + (currentCenter.x - pinchCenterStart.value.x),
          y: pinchPanStartOffset.value.y + (currentCenter.y - pinchCenterStart.value.y),
        }
      }

      const selectedImg = collage.selectedImage
      if (selectedImg && pinchStartWidth.value > 0) {
        // Pinch to resize selected image
        const newWidth = Math.max(20, pinchStartWidth.value * scale)
        const newHeight = Math.max(20, newWidth / initialAspectRatio.value)
        // Keep the image centered around its original center
        const newX = pinchStartImgX.value + (pinchStartWidth.value - newWidth) / 2
        const newY = pinchStartImgY.value + (pinchStartHeight.value - newHeight) / 2
        collage.updateImage(selectedImg.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        })
      } else {
        // Pinch to zoom canvas (no image selected)
        const newZoom = Math.max(0.25, Math.min(4, pinchInitialZoom.value * scale))
        collage.setCanvasZoom(newZoom)
      }
      return
    }

    if (e.touches.length === 1 && !isPinching.value) {
      const touch = e.touches[0]
      handleMouseMove(syntheticMouse(touch.clientX, touch.clientY))
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      if (isPinching.value) {
        isPinching.value = false
        pinchStartWidth.value = 0 // reset image-pinch flag
      }
      if (e.touches.length === 0) {
        handleMouseUp()
      }
    }
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cursorStyle,
  }
}
