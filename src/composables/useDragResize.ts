import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useCollageStore } from '@/stores/collage'
import type { GuideLine } from './useAlignmentGuides'
import type { CollageImage, CollageText } from '@/types'
import {
  baseCorner,
  currentOffsets,
  getDistortHandle,
  getResizeHandle,
  getTextResizeHandle,
  isDeleteButtonClicked,
  isPointInImage,
  isPointInImageBounds,
  isPointInText,
  toLocalImagePoint,
} from '@/lib/canvasHitTest'
import type { Corner, ResizeHandle } from '@/lib/canvasHitTest'
import { applyResizeSnap, computeResize, meetsMinSize } from '@/lib/resizeGeometry'

// Emitter for double-tap events (used by CollageCanvas to show preview)
type DoubleTapHandler = (clientX: number, clientY: number) => void

// Cursor map for resize handles
const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nw-resize',
  n: 'n-resize',
  ne: 'ne-resize',
  e: 'e-resize',
  se: 'se-resize',
  s: 's-resize',
  sw: 'sw-resize',
  w: 'w-resize',
}

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

  // All the drag/resize/pan state:
  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeHandle = ref<ResizeHandle | null>(null)
  const cursorStyle = ref<string>('move')
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragImageStart = ref({ x: 0, y: 0 })
  // Startpositionen aller ausgewählten Bilder für Mehfach-Drag
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
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

  // ─── Helfer ──────────────────────────────────────────────────────────────────

  // Anzeige-Zoom für Trefferradien (konstante Bildschirmgröße der Griffe)
  function hitFit(): number {
    return autoFitScale.value || 1
  }

  // Client-Koordinaten → Canvas-Koordinaten (berücksichtigt Auto-Fit-Zoom)
  function toCanvasPoint(canvasEl: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvasEl.getBoundingClientRect()
    const zoom = autoFitScale.value
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom }
  }

  // Nur Canvas-Instanzen (keine Galerie-Vorlagen), oberstes Bild zuerst
  function canvasImagesTopFirst(): CollageImage[] {
    return collage.images
      .filter((img) => img.isGalleryTemplate !== true)
      .sort((a, b) => b.zIndex - a.zIndex)
  }

  function textHandleAt(x: number, y: number, text: CollageText, touchMode = false) {
    const ctx = getCtx()
    return ctx ? getTextResizeHandle(x, y, text, ctx, hitFit(), touchMode) : null
  }

  function beginImageDrag(x: number, y: number, img: CollageImage, moving: CollageImage[]) {
    isDragging.value = true
    dragStartPos.value = { x, y }
    dragImageStart.value = { x: img.x, y: img.y }
    dragStartPositions.value = new Map()
    moving.forEach((m) => dragStartPositions.value.set(m.id, { x: m.x, y: m.y }))
  }

  /**
   * Startet eine Griff-Interaktion am Punkt (Löschbutton, Distort-Ecke,
   * Skalier-Griff des Bildes oder des Textes). Gibt true zurück, wenn etwas
   * getroffen wurde. Touch nutzt größere Trefferflächen.
   */
  function tryStartHandleInteraction(x: number, y: number, touchMode: boolean): boolean {
    const fit = hitFit()

    // Löschbutton (NUR Canvas-Instanzen, keine Templates!)
    const clickedDeleteImage = canvasImagesTopFirst().find((img) =>
      isDeleteButtonClicked(x, y, img, fit, touchMode)
    )
    if (clickedDeleteImage) {
      // Bild aus Canvas entfernen mit „Rückgängig"-Toast (kein Dialog nötig)
      collage.removeImageWithUndoToast(clickedDeleteImage.id)
      return true
    }

    // Distort-Modus: einzelne Ecke ziehen (hat Vorrang, Skalierpunkte sind aus)
    const selectedImg = collage.selectedImage
    if (selectedImg && selectedImg.distortEnabled) {
      const corner = getDistortHandle(x, y, selectedImg, fit, touchMode)
      if (corner) {
        collage.saveStateForUndo()
        isDistorting.value = true
        distortCorner.value = corner
        return true
      }
    } else if (selectedImg) {
      const handle = getResizeHandle(x, y, selectedImg, fit, touchMode)
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
        initialAspectRatio.value = selectedImg.width / selectedImg.height
        return true
      }
    }

    // Skalierungspunkt des ausgewählten Textes
    const selectedText = collage.selectedText
    if (selectedText && textHandleAt(x, y, selectedText, touchMode)) {
      collage.saveStateForUndo()
      isTextResizing.value = true
      textResizeStartFont.value = selectedText.fontSize
      textResizeStartDist.value = Math.max(1, Math.hypot(x - selectedText.x, y - selectedText.y))
      return true
    }

    return false
  }

  // ─── Maus ────────────────────────────────────────────────────────────────────

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

    const { x, y } = toCanvasPoint(canvas.value, e.clientX, e.clientY)

    if (tryStartHandleInteraction(x, y, false)) return

    // Finde angeklickten Text (von oben nach unten, höchster zIndex zuerst)
    const ctx = getCtx()
    const clickedText = [...collage.texts]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((text) => (ctx ? isPointInText(x, y, text, ctx) : false))

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
    const clickedImage = canvasImagesTopFirst().find((img) => isPointInImage(x, y, img))

    if (clickedImage) {
      // Speichere Zustand für Undo VOR dem Verschieben
      collage.saveStateForUndo()
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Click für Mehrfachauswahl; Drag nur, wenn das Bild ausgewählt ist
        collage.toggleImageSelection(clickedImage.id)
        if (collage.isImageSelected(clickedImage.id)) {
          beginImageDrag(x, y, clickedImage, collage.selectedImages)
        }
      } else if (collage.isImageSelected(clickedImage.id)) {
        // Klick auf ein bereits ausgewähltes Bild: Auswahl beibehalten, Drag starten
        beginImageDrag(x, y, clickedImage, collage.selectedImages)
      } else {
        // Normaler Klick auf ein nicht-ausgewähltes Bild: Ersetzt die Auswahl
        collage.selectImage(clickedImage.id)
        beginImageDrag(x, y, clickedImage, [clickedImage])
      }
      collage.selectText(null) // Text explizit deselektieren beim Bildklick
      collage.selectBackground(false) // Hintergrund deselektieren
    } else {
      // Kein Bild/Text getroffen - Hintergrundbild auswählen, falls vorhanden
      collage.selectBackground(!!collage.settings.backgroundImage.url)
      collage.selectImage(null)
      collage.selectText(null)
    }
  }

  // Cursor passend zum Element unter dem Mauszeiger (nur im Leerlauf)
  function updateIdleCursor(x: number, y: number) {
    const selectedImg = collage.selectedImage
    if (selectedImg && selectedImg.distortEnabled) {
      // Distort-Modus: Eckpunkte + Innenfläche
      if (getDistortHandle(x, y, selectedImg, hitFit())) {
        cursorStyle.value = 'crosshair'
      } else if (isPointInImage(x, y, selectedImg)) {
        cursorStyle.value = 'move'
      } else {
        cursorStyle.value = 'default'
      }
    } else if (selectedImg) {
      const handle = getResizeHandle(x, y, selectedImg, hitFit())
      if (handle) {
        cursorStyle.value = HANDLE_CURSORS[handle] ?? 'move'
      } else if (isPointInImageBounds(x, y, selectedImg)) {
        cursorStyle.value = 'move'
      } else {
        cursorStyle.value = 'default'
      }
    } else if (collage.selectedText) {
      const handle = textHandleAt(x, y, collage.selectedText)
      cursorStyle.value = handle
        ? handle === 'nw' || handle === 'se'
          ? 'nwse-resize'
          : 'nesw-resize'
        : 'default'
    } else {
      cursorStyle.value = 'default'
    }
  }

  // Schriftgröße proportional zur Distanz vom Textmittelpunkt
  function resizeTextTo(text: CollageText, x: number, y: number) {
    const dist = Math.hypot(x - text.x, y - text.y)
    const scale = dist / textResizeStartDist.value
    const newFontSize = Math.max(12, Math.min(2000, Math.round(textResizeStartFont.value * scale)))
    collage.updateText(text.id, { fontSize: newFontSize })
  }

  // Gezogene Distort-Ecke einzeln versetzen (lokales System)
  function distortTo(img: CollageImage, corner: Corner, x: number, y: number) {
    const { localX, localY } = toLocalImagePoint(x, y, img)
    const base = baseCorner(img, corner)
    const offsets = currentOffsets(img)
    offsets[corner] = { x: localX - base.x, y: localY - base.y }
    collage.updateImage(img.id, { cornerOffsets: offsets })
  }

  function resizeImageTo(
    imageId: string,
    handle: ResizeHandle,
    x: number,
    y: number,
    shift: boolean
  ) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y
    // Verwende den Lock aus dem Store, aber Shift-Taste kann es temporär überschreiben
    const keepAspectRatio = shift ? !collage.lockAspectRatio : collage.lockAspectRatio

    const rect = computeResize(
      handle,
      resizeStart.value,
      dx,
      dy,
      keepAspectRatio,
      initialAspectRatio.value
    )
    if (!meetsMinSize(rect)) return

    // Smart Guides beim Resize: Erkennung und Snap
    const resizeSnap = guides.detectResizeAlignments(
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      imageId,
      handle
    )
    const snapped = applyResizeSnap(rect, resizeSnap)

    // Aktualisiere aktive Guide-Linien für die Anzeige
    guides.activeGuides.value = resizeSnap.guides

    // Nochmal Mindestgröße prüfen nach Snap
    if (meetsMinSize(snapped)) {
      collage.updateImage(imageId, snapped)
    }
  }

  function dragImagesTo(imageId: string, x: number, y: number) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y

    // Zielposition für das primäre Bild
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
        collage.updateImage(imgId, { x: startPos.x + snapDx, y: startPos.y + snapDy })
      })
    } else {
      collage.updateImage(imageId, { x: targetX, y: targetY })
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas.value) return

    if (isPanning.value) {
      panOffset.value = {
        x: panStartOffset.value.x + (e.clientX - panStart.value.x),
        y: panStartOffset.value.y + (e.clientY - panStart.value.y),
      }
      cursorStyle.value = 'grabbing'
      return
    }

    const { x, y } = toCanvasPoint(canvas.value, e.clientX, e.clientY)

    if (!isDragging.value && !isResizing.value && !isTextResizing.value && !isDistorting.value) {
      updateIdleCursor(x, y)
    }

    if (isTextResizing.value && collage.selectedTextId && collage.selectedText) {
      resizeTextTo(collage.selectedText, x, y)
      return
    }

    if (
      isDistorting.value &&
      distortCorner.value &&
      collage.selectedImageId &&
      collage.selectedImage
    ) {
      distortTo(collage.selectedImage, distortCorner.value, x, y)
      return
    }

    if (
      (!collage.selectedImageId && !collage.selectedTextId) ||
      (!isDragging.value && !isResizing.value)
    )
      return

    // Text verschieben
    if (isDragging.value && collage.selectedTextId && collage.selectedText) {
      collage.updateText(collage.selectedText.id, {
        x: dragImageStart.value.x + (x - dragStartPos.value.x),
        y: dragImageStart.value.y + (y - dragStartPos.value.y),
      })
      return
    }

    if (isResizing.value && resizeHandle.value && collage.selectedImageId) {
      resizeImageTo(collage.selectedImageId, resizeHandle.value, x, y, e.shiftKey)
    } else if (isDragging.value && collage.selectedImageId) {
      dragImagesTo(collage.selectedImageId, x, y)
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

  // ─── Touch ───────────────────────────────────────────────────────────────────

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
  function syntheticMouse(clientX: number, clientY: number): MouseEvent {
    return {
      clientX,
      clientY,
      button: 0,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    } as unknown as MouseEvent
  }

  function startPinch(e: TouchEvent) {
    // Stop any single-touch drag that was in progress
    handleMouseUp()

    const selectedImg = collage.selectedImage
    isPinching.value = true
    pinchStartDistance.value = getPinchDistance(e)

    if (selectedImg) {
      // Two fingers on a selected image: pinch to resize + pan simultaneously
      collage.saveStateForUndo()
      pinchStartWidth.value = selectedImg.width
      pinchStartHeight.value = selectedImg.height
      pinchStartImgX.value = selectedImg.x
      pinchStartImgY.value = selectedImg.y
      initialAspectRatio.value = selectedImg.width / selectedImg.height
    } else {
      // Two fingers with no selection: pinch-zoom the canvas
      pinchInitialZoom.value = collage.canvasZoom
    }

    // Always allow two-finger pan alongside pinch
    isPanning.value = true
    pinchCenterStart.value = getPinchCenter(e)
    pinchPanStartOffset.value = { ...panOffset.value }
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (!canvas.value) return

    if (e.touches.length === 2) {
      startPinch(e)
      return
    }

    const touch = e.touches[0]

    // Double-tap detection (300 ms window)
    const now = Date.now()
    if (now - lastTapTime.value < 300) {
      lastTapTime.value = 0
      onDoubleTap?.(touch.clientX, touch.clientY)
      return
    }
    lastTapTime.value = now

    // Griffe mit vergrößerter Trefferfläche für Touch
    const { x, y } = toCanvasPoint(canvas.value, touch.clientX, touch.clientY)
    if (tryStartHandleInteraction(x, y, true)) return

    // Delegate the rest to existing mousedown logic
    handleMouseDown(syntheticMouse(touch.clientX, touch.clientY))
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (!canvas.value) return

    if (e.touches.length === 2 && isPinching.value) {
      const currentCenter = getPinchCenter(e)
      const scale = getPinchDistance(e) / pinchStartDistance.value

      // Pan: move with the center of the two fingers
      if (isPanning.value) {
        panOffset.value = {
          x: pinchPanStartOffset.value.x + (currentCenter.x - pinchCenterStart.value.x),
          y: pinchPanStartOffset.value.y + (currentCenter.y - pinchCenterStart.value.y),
        }
      }

      const selectedImg = collage.selectedImage
      if (selectedImg && pinchStartWidth.value > 0) {
        // Pinch to resize selected image, centered around its original center
        const newWidth = Math.max(20, pinchStartWidth.value * scale)
        const newHeight = Math.max(20, newWidth / initialAspectRatio.value)
        collage.updateImage(selectedImg.id, {
          x: pinchStartImgX.value + (pinchStartWidth.value - newWidth) / 2,
          y: pinchStartImgY.value + (pinchStartHeight.value - newHeight) / 2,
          width: newWidth,
          height: newHeight,
        })
      } else {
        // Pinch to zoom canvas (no image selected)
        collage.setCanvasZoom(Math.max(0.25, Math.min(4, pinchInitialZoom.value * scale)))
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
