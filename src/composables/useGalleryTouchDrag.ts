import { ref, onUnmounted } from 'vue'
import { useCollageStore } from '@/stores/collage'

/**
 * Touch-Drag aus der Bildgalerie auf das Canvas.
 *
 * Auf Touch-Geräten funktioniert HTML5-Drag-and-Drop (`draggable`) nicht.
 * Dieses Composable stellt das Ziehen eines Galerie-Bildes per Finger nach:
 * Ein kurzer Long-Press aktiviert den Drag-Modus (damit normales Scrollen der
 * Liste und Tippen zum Auswählen erhalten bleiben), ein "Geister"-Vorschaubild
 * folgt dem Finger, und beim Loslassen über dem Canvas wird das Bild an der
 * Fingerposition eingefügt.
 *
 * Das Canvas wird über das Attribut `data-collage-canvas` erkannt und ist
 * dadurch von der Galerie entkoppelt.
 */

const LONG_PRESS_MS = 220
// Bewegungstoleranz während des Long-Press (darüber = Scrollen, kein Drag)
const MOVE_TOLERANCE = 12

export function useGalleryTouchDrag() {
  const collage = useCollageStore()

  const isDragging = ref(false)

  let activeImageId: string | null = null
  let startX = 0
  let startY = 0
  let pressTimer: ReturnType<typeof setTimeout> | null = null
  let ghost: HTMLElement | null = null
  let armed = false // touchstart erfasst, aber Drag noch nicht aktiviert

  function findCanvasAt(clientX: number, clientY: number): HTMLCanvasElement | null {
    const el = document.elementFromPoint(clientX, clientY)
    return (el?.closest('canvas[data-collage-canvas]') as HTMLCanvasElement) ?? null
  }

  function createGhost(imageUrl: string, clientX: number, clientY: number) {
    const el = document.createElement('img')
    el.src = imageUrl
    el.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:72px',
      'height:72px',
      'object-fit:cover',
      'border-radius:8px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'border:2px solid rgba(255,255,255,0.8)',
      'pointer-events:none',
      'z-index:9999',
      'opacity:0.9',
      'transition:transform 0.05s linear',
    ].join(';')
    document.body.appendChild(el)
    ghost = el
    moveGhost(clientX, clientY, false)
  }

  function moveGhost(clientX: number, clientY: number, overCanvas: boolean) {
    if (!ghost) return
    const scale = overCanvas ? 1.1 : 1
    ghost.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%) scale(${scale})`
    ghost.style.opacity = overCanvas ? '1' : '0.9'
  }

  function removeGhost() {
    if (ghost) {
      ghost.remove()
      ghost = null
    }
  }

  function cleanup() {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
    removeGhost()
    document.removeEventListener('touchmove', onDocTouchMove)
    document.removeEventListener('touchend', onDocTouchEnd)
    document.removeEventListener('touchcancel', onDocTouchEnd)
    document.body.style.userSelect = ''
    activeImageId = null
    armed = false
    isDragging.value = false
  }

  function activateDrag(clientX: number, clientY: number) {
    if (!activeImageId) return
    const image = collage.images.find((img) => img.id === activeImageId)
    if (!image) return

    isDragging.value = true
    document.body.style.userSelect = 'none'
    createGhost(image.url, clientX, clientY)

    // Ab jetzt Bewegungen global verfolgen und Seiten-Scroll unterdrücken
    document.addEventListener('touchmove', onDocTouchMove, { passive: false })
    document.addEventListener('touchend', onDocTouchEnd)
    document.addEventListener('touchcancel', onDocTouchEnd)
  }

  function onDocTouchMove(e: TouchEvent) {
    if (!isDragging.value) return
    e.preventDefault() // Seiten-Scroll während des Drags verhindern
    const touch = e.touches[0]
    if (!touch) return
    const overCanvas = !!findCanvasAt(touch.clientX, touch.clientY)
    moveGhost(touch.clientX, touch.clientY, overCanvas)
  }

  function onDocTouchEnd(e: TouchEvent) {
    if (!isDragging.value) {
      cleanup()
      return
    }
    const touch = e.changedTouches[0]
    const imageId = activeImageId
    let dropped = false

    if (touch && imageId) {
      const canvasEl = findCanvasAt(touch.clientX, touch.clientY)
      if (canvasEl && canvasEl.width > 0) {
        const rect = canvasEl.getBoundingClientRect()
        // Angezeigte Grösse vs. intrinsische Canvas-Auflösung = effektiver Zoom
        const scale = rect.width / canvasEl.width
        const source = collage.images.find((img) => img.id === imageId)
        const canvasX = (touch.clientX - rect.left) / scale
        const canvasY = (touch.clientY - rect.top) / scale
        // Bild unter dem Finger zentrieren
        const x = canvasX - (source ? source.width / 2 : 0)
        const y = canvasY - (source ? source.height / 2 : 0)
        collage.duplicateImageToPosition(imageId, x, y)
        dropped = true
      }
    }

    // Verhindere den auf touchend folgenden Klick (kein versehentliches Auswählen)
    if (dropped) {
      const swallow = (ev: Event) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      document.addEventListener('click', swallow, { capture: true, once: true })
      // Falls kein Klick folgt, Listener nach kurzer Zeit entfernen
      setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 400)
    }

    cleanup()
  }

  /** An `@touchstart` jedes Galerie-Eintrags binden. */
  function onItemTouchStart(e: TouchEvent, imageId: string) {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    activeImageId = imageId
    startX = touch.clientX
    startY = touch.clientY
    armed = true

    pressTimer = setTimeout(() => {
      if (armed) activateDrag(startX, startY)
    }, LONG_PRESS_MS)
  }

  /** An `@touchmove` jedes Galerie-Eintrags binden (passiv möglich). */
  function onItemTouchMove(e: TouchEvent) {
    if (isDragging.value || !armed) return
    const touch = e.touches[0]
    if (!touch) return
    // Bewegt der Finger sich vor dem Long-Press zu weit → Nutzer scrollt die Liste
    if (
      Math.abs(touch.clientX - startX) > MOVE_TOLERANCE ||
      Math.abs(touch.clientY - startY) > MOVE_TOLERANCE
    ) {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
      armed = false
      activeImageId = null
    }
  }

  /** An `@touchend`/`@touchcancel` jedes Galerie-Eintrags binden. */
  function onItemTouchEnd() {
    // Wurde der Drag nie aktiviert, nur den anstehenden Long-Press abbrechen.
    if (!isDragging.value) {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
      armed = false
      activeImageId = null
    }
  }

  onUnmounted(cleanup)

  return { isDragging, onItemTouchStart, onItemTouchMove, onItemTouchEnd }
}
