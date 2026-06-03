import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { SNAP_THRESHOLD } from '@/config/constants'

export interface GuideLine {
  type: 'horizontal' | 'vertical'
  position: number // x für vertikal, y für horizontal
  start: number
  end: number
}

export { SNAP_THRESHOLD }

export function useAlignmentGuides() {
  const collage = useCollageStore()
  const activeGuides = ref<GuideLine[]>([])

  // Smart Guides: Erkennt Ausrichtungen und berechnet Snap-Positionen
  function detectAlignments(
    imgX: number,
    imgY: number,
    imgWidth: number,
    imgHeight: number,
    excludeId: string
  ): { snapX: number | null; snapY: number | null; guides: GuideLine[] } {
    const guides: GuideLine[] = []
    let snapX: number | null = null
    let snapY: number | null = null

    const canvasWidth = collage.settings.width
    const canvasHeight = collage.settings.height

    // Kanten und Mitte des verschobenen Bildes
    const imgLeft = imgX
    const imgRight = imgX + imgWidth
    const imgCenterX = imgX + imgWidth / 2
    const imgTop = imgY
    const imgBottom = imgY + imgHeight
    const imgCenterY = imgY + imgHeight / 2

    // Sammel alle relevanten Ausrichtungspunkte
    const verticalPoints: { pos: number; source: string }[] = [
      { pos: 0, source: 'canvas-left' },
      { pos: canvasWidth, source: 'canvas-right' },
      { pos: canvasWidth / 2, source: 'canvas-center' },
    ]
    const horizontalPoints: { pos: number; source: string }[] = [
      { pos: 0, source: 'canvas-top' },
      { pos: canvasHeight, source: 'canvas-bottom' },
      { pos: canvasHeight / 2, source: 'canvas-center' },
    ]

    // Füge Kanten und Mitten anderer Bilder hinzu
    const otherImages = collage.images.filter(
      (img) => img.isGalleryTemplate !== true && img.id !== excludeId
    )

    otherImages.forEach((img) => {
      verticalPoints.push({ pos: img.x, source: `img-${img.id}-left` })
      verticalPoints.push({ pos: img.x + img.width, source: `img-${img.id}-right` })
      verticalPoints.push({ pos: img.x + img.width / 2, source: `img-${img.id}-center` })
      horizontalPoints.push({ pos: img.y, source: `img-${img.id}-top` })
      horizontalPoints.push({ pos: img.y + img.height, source: `img-${img.id}-bottom` })
      horizontalPoints.push({ pos: img.y + img.height / 2, source: `img-${img.id}-center` })
    })

    // Prüfe vertikale Ausrichtungen (linke Kante, rechte Kante, Mitte)
    const imgVerticalEdges = [
      { edge: imgLeft, type: 'left' },
      { edge: imgRight, type: 'right' },
      { edge: imgCenterX, type: 'center' },
    ]

    for (const imgEdge of imgVerticalEdges) {
      for (const point of verticalPoints) {
        const diff = Math.abs(imgEdge.edge - point.pos)
        if (diff < SNAP_THRESHOLD) {
          // Berechne Snap-Position
          if (imgEdge.type === 'left') {
            snapX = point.pos
          } else if (imgEdge.type === 'right') {
            snapX = point.pos - imgWidth
          } else if (imgEdge.type === 'center') {
            snapX = point.pos - imgWidth / 2
          }

          // Füge Guide-Linie hinzu
          guides.push({
            type: 'vertical',
            position: point.pos,
            start: 0,
            end: canvasHeight,
          })
          break // Nur eine Snap-Position pro Achse
        }
      }
      if (snapX !== null) break
    }

    // Prüfe horizontale Ausrichtungen (obere Kante, untere Kante, Mitte)
    const imgHorizontalEdges = [
      { edge: imgTop, type: 'top' },
      { edge: imgBottom, type: 'bottom' },
      { edge: imgCenterY, type: 'center' },
    ]

    for (const imgEdge of imgHorizontalEdges) {
      for (const point of horizontalPoints) {
        const diff = Math.abs(imgEdge.edge - point.pos)
        if (diff < SNAP_THRESHOLD) {
          // Berechne Snap-Position
          if (imgEdge.type === 'top') {
            snapY = point.pos
          } else if (imgEdge.type === 'bottom') {
            snapY = point.pos - imgHeight
          } else if (imgEdge.type === 'center') {
            snapY = point.pos - imgHeight / 2
          }

          // Füge Guide-Linie hinzu
          guides.push({
            type: 'horizontal',
            position: point.pos,
            start: 0,
            end: canvasWidth,
          })
          break // Nur eine Snap-Position pro Achse
        }
      }
      if (snapY !== null) break
    }

    return { snapX, snapY, guides }
  }

  // Smart Guides für Resize: Erkennt Ausrichtungen für spezifische Kanten
  function detectResizeAlignments(
    imgX: number,
    imgY: number,
    imgWidth: number,
    imgHeight: number,
    excludeId: string,
    handle: string
  ): {
    snapLeft: number | null
    snapRight: number | null
    snapTop: number | null
    snapBottom: number | null
    guides: GuideLine[]
  } {
    const guides: GuideLine[] = []
    let snapLeft: number | null = null
    let snapRight: number | null = null
    let snapTop: number | null = null
    let snapBottom: number | null = null

    const canvasWidth = collage.settings.width
    const canvasHeight = collage.settings.height

    // Kanten des Bildes
    const imgLeft = imgX
    const imgRight = imgX + imgWidth
    const imgTop = imgY
    const imgBottom = imgY + imgHeight

    // Sammel alle relevanten Ausrichtungspunkte
    const verticalPoints: number[] = [0, canvasWidth, canvasWidth / 2]
    const horizontalPoints: number[] = [0, canvasHeight, canvasHeight / 2]

    // Füge Kanten anderer Bilder hinzu
    const otherImages = collage.images.filter(
      (img) => img.isGalleryTemplate !== true && img.id !== excludeId
    )

    otherImages.forEach((img) => {
      verticalPoints.push(img.x, img.x + img.width, img.x + img.width / 2)
      horizontalPoints.push(img.y, img.y + img.height, img.y + img.height / 2)
    })

    // Prüfe nur die relevanten Kanten basierend auf dem Handle
    const checkLeft = handle.includes('w')
    const checkRight = handle.includes('e')
    const checkTop = handle.includes('n')
    const checkBottom = handle.includes('s')

    if (checkLeft) {
      for (const point of verticalPoints) {
        if (Math.abs(imgLeft - point) < SNAP_THRESHOLD) {
          snapLeft = point
          guides.push({ type: 'vertical', position: point, start: 0, end: canvasHeight })
          break
        }
      }
    }

    if (checkRight) {
      for (const point of verticalPoints) {
        if (Math.abs(imgRight - point) < SNAP_THRESHOLD) {
          snapRight = point
          guides.push({ type: 'vertical', position: point, start: 0, end: canvasHeight })
          break
        }
      }
    }

    if (checkTop) {
      for (const point of horizontalPoints) {
        if (Math.abs(imgTop - point) < SNAP_THRESHOLD) {
          snapTop = point
          guides.push({ type: 'horizontal', position: point, start: 0, end: canvasWidth })
          break
        }
      }
    }

    if (checkBottom) {
      for (const point of horizontalPoints) {
        if (Math.abs(imgBottom - point) < SNAP_THRESHOLD) {
          snapBottom = point
          guides.push({ type: 'horizontal', position: point, start: 0, end: canvasWidth })
          break
        }
      }
    }

    return { snapLeft, snapRight, snapTop, snapBottom, guides }
  }

  // Zeichnet die aktiven Guide-Linien
  function drawGuides(ctx: CanvasRenderingContext2D | null) {
    if (!ctx || activeGuides.value.length === 0) return

    const context = ctx
    context.save()

    // Guide-Linien-Stil
    context.strokeStyle = '#f97316' // Orange
    context.lineWidth = 1
    context.setLineDash([4, 4])

    for (const guide of activeGuides.value) {
      context.beginPath()
      if (guide.type === 'vertical') {
        context.moveTo(guide.position, guide.start)
        context.lineTo(guide.position, guide.end)
      } else {
        context.moveTo(guide.start, guide.position)
        context.lineTo(guide.end, guide.position)
      }
      context.stroke()
    }

    context.setLineDash([])
    context.restore()
  }

  return { activeGuides, detectAlignments, detectResizeAlignments, drawGuides }
}
