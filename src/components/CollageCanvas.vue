<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useCollageStore } from '@/stores/collage'

const collage = useCollageStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const dragImageStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const shiftPressed = ref(false)
const initialAspectRatio = ref(1)

// Smart Guides
const SNAP_THRESHOLD = 8 // Pixel-Abstand für Einrasten
interface GuideLine {
  type: 'horizontal' | 'vertical'
  position: number // x für vertikal, y für horizontal
  start: number
  end: number
}
const activeGuides = ref<GuideLine[]>([])

let ctx: CanvasRenderingContext2D | null = null
const loadedImages = new Map<string, HTMLImageElement>()
let backgroundImageElement: HTMLImageElement | null = null
let loadedBackgroundUrl: string | null = null

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    renderCanvas()
  }
})

watch(() => [collage.images, collage.texts, collage.settings, collage.selectedImageIds, collage.selectedTextId, collage.isBackgroundSelected], () => {
  nextTick(() => renderCanvas())
}, { deep: true })

function getContrastColor(hexColor: string): string {
  // Konvertiere Hex zu RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Berechne Helligkeit (Luminanz)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Rückgabe einer kontrastierenden Farbe (dunkel für helle Hintergründe, hell für dunkle)
  return luminance > 0.5 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
}

async function drawBackgroundImage(): Promise<void> {
  if (!canvas.value || !ctx || !collage.settings.backgroundImage.url) return

  const context = ctx
  const bgSettings = collage.settings.backgroundImage
  const bgUrl = bgSettings.url
  const fit = bgSettings.fit
  const canvasWidth = canvas.value.width
  const canvasHeight = canvas.value.height

  // Lade Bild nur wenn URL sich geändert hat
  if (loadedBackgroundUrl !== bgUrl || !backgroundImageElement) {
    backgroundImageElement = new Image()
    loadedBackgroundUrl = bgUrl

    await new Promise<void>((resolve) => {
      backgroundImageElement!.onload = () => resolve()
      backgroundImageElement!.onerror = () => resolve() // Bei Fehler auch fortfahren
      backgroundImageElement!.src = bgUrl!
    })
  }

  // Prüfe ob Bild korrekt geladen wurde
  if (!backgroundImageElement || backgroundImageElement.naturalWidth === 0) return

  const img = backgroundImageElement
  const imgWidth = img.naturalWidth
  const imgHeight = img.naturalHeight

  context.save()

  // Filter anwenden
  const filters = []
  if (bgSettings.brightness !== 100) {
    filters.push(`brightness(${bgSettings.brightness}%)`)
  }
  if (bgSettings.contrast !== 100) {
    filters.push(`contrast(${bgSettings.contrast}%)`)
  }
  if (bgSettings.saturation !== 100) {
    filters.push(`saturate(${bgSettings.saturation}%)`)
  }
  if (bgSettings.blur > 0) {
    filters.push(`blur(${bgSettings.blur}px)`)
  }
  if (filters.length > 0) {
    context.filter = filters.join(' ')
  }

  // Transparenz anwenden
  context.globalAlpha = bgSettings.opacity

  if (fit === 'cover') {
    // Cover: Bild füllt Canvas komplett aus (kann beschnitten werden)
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    context.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else if (fit === 'contain') {
    // Contain: Ganzes Bild sichtbar (kann Leerräume haben)
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    context.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else if (fit === 'stretch') {
    // Stretch: Bild wird auf Canvas-Größe gestreckt
    context.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  } else if (fit === 'tile') {
    // Tile: Bild wird gekachelt wiederholt
    const pattern = context.createPattern(img, 'repeat')
    if (pattern) {
      context.fillStyle = pattern
      context.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  }

  context.filter = 'none'
  context.globalAlpha = 1
  context.restore()

  // Auswahlrahmen zeichnen, wenn Hintergrundbild ausgewählt ist
  if (collage.isBackgroundSelected) {
    context.save()
    context.strokeStyle = '#3b82f6' // Primärfarbe
    context.lineWidth = 3
    context.setLineDash([8, 4])
    context.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8)
    context.restore()
  }
}

function drawGrid() {
  if (!canvas.value || !ctx || !collage.settings.gridEnabled) return

  const gridSize = collage.settings.gridSize
  const width = canvas.value.width
  const height = canvas.value.height

  // Bestimme die Grid-Farbe basierend auf dem Hintergrund
  const gridColor = getContrastColor(collage.settings.backgroundColor)

  ctx.save()
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])

  // Vertikale Linien
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Horizontale Linien
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.restore()
}

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
    { pos: canvasWidth / 2, source: 'canvas-center' }
  ]
  const horizontalPoints: { pos: number; source: string }[] = [
    { pos: 0, source: 'canvas-top' },
    { pos: canvasHeight, source: 'canvas-bottom' },
    { pos: canvasHeight / 2, source: 'canvas-center' }
  ]

  // Füge Kanten und Mitten anderer Bilder hinzu
  const otherImages = collage.images.filter(
    img => img.isGalleryTemplate !== true && img.id !== excludeId
  )

  otherImages.forEach(img => {
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
    { edge: imgCenterX, type: 'center' }
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
          end: canvasHeight
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
    { edge: imgCenterY, type: 'center' }
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
          end: canvasWidth
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
): { snapLeft: number | null; snapRight: number | null; snapTop: number | null; snapBottom: number | null; guides: GuideLine[] } {
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
    img => img.isGalleryTemplate !== true && img.id !== excludeId
  )

  otherImages.forEach(img => {
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
function drawGuides() {
  if (!canvas.value || !ctx || activeGuides.value.length === 0) return

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

async function renderCanvas() {
  if (!canvas.value || !ctx) return

  // Type guard: ctx ist ab hier garantiert nicht null
  const context = ctx

  // Save scroll position before potential layout change
  const scrollY = window.scrollY
  const scrollX = window.scrollX

  canvas.value.width = collage.settings.width
  canvas.value.height = collage.settings.height

  // Background Color
  context.fillStyle = collage.settings.backgroundColor
  context.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // Background Image (nach Hintergrundfarbe, vor Grid)
  await drawBackgroundImage()

  // Grid zeichnen (nach Hintergrund, vor Bildern)
  drawGrid()

  // Nur Canvas-Instanzen rendern (keine Gallery-Templates)
  const canvasImages = collage.images.filter(img => img.isGalleryTemplate !== true)

  // Bilder laden und zeichnen
  for (const img of [...canvasImages].sort((a, b) => a.zIndex - b.zIndex)) {
    let htmlImg = loadedImages.get(img.id)

    if (!htmlImg) {
      htmlImg = new Image()
      htmlImg.src = img.url
      loadedImages.set(img.id, htmlImg)
      await new Promise((resolve) => {
        htmlImg!.onload = resolve
      })
    }

    context.save()
    context.translate(img.x + img.width / 2, img.y + img.height / 2)
    context.rotate((img.rotation * Math.PI) / 180)

    // Deckkraft anwenden
    context.globalAlpha = img.opacity

    const x = -img.width / 2
    const y = -img.height / 2
    const radius = Math.min(img.borderRadius, img.width / 2, img.height / 2)

    // Wenn abgerundete Ecken + Schatten: Erst Schatten-Form zeichnen, dann Bild mit Clipping
    if (radius > 0 && img.shadowEnabled) {
      // Schatten auf abgerundete Form anwenden
      context.shadowOffsetX = img.shadowOffsetX
      context.shadowOffsetY = img.shadowOffsetY
      context.shadowBlur = img.shadowBlur
      context.shadowColor = img.shadowColor

      // Gefüllten Pfad für Schatten zeichnen
      context.beginPath()
      context.moveTo(x + radius, y)
      context.lineTo(x + img.width - radius, y)
      context.arcTo(x + img.width, y, x + img.width, y + radius, radius)
      context.lineTo(x + img.width, y + img.height - radius)
      context.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
      context.lineTo(x + radius, y + img.height)
      context.arcTo(x, y + img.height, x, y + img.height - radius, radius)
      context.lineTo(x, y + radius)
      context.arcTo(x, y, x + radius, y, radius)
      context.closePath()
      context.fillStyle = '#000000' // Farbe egal, wird vom Bild überdeckt
      context.fill()

      // Schatten zurücksetzen vor dem eigentlichen Bild
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
      context.shadowBlur = 0
      context.shadowColor = 'transparent'
    } else if (img.shadowEnabled) {
      // Normaler Schatten ohne abgerundete Ecken
      context.shadowOffsetX = img.shadowOffsetX
      context.shadowOffsetY = img.shadowOffsetY
      context.shadowBlur = img.shadowBlur
      context.shadowColor = img.shadowColor
    }

    // Clip-Pfad mit abgerundeten Ecken erstellen
    if (radius > 0) {
      context.beginPath()
      context.moveTo(x + radius, y)
      context.lineTo(x + img.width - radius, y)
      context.arcTo(x + img.width, y, x + img.width, y + radius, radius)
      context.lineTo(x + img.width, y + img.height - radius)
      context.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
      context.lineTo(x + radius, y + img.height)
      context.arcTo(x, y + img.height, x, y + img.height - radius, radius)
      context.lineTo(x, y + radius)
      context.arcTo(x, y, x + radius, y, radius)
      context.closePath()
      context.clip()
    }

    // Bildbearbeitungs-Filter anwenden (mit Abwärtskompatibilität)
    const brightness = img.brightness ?? 100
    const contrast = img.contrast ?? 100
    const saturation = img.saturation ?? 100
    const highlights = img.highlights ?? 0
    const shadows = img.shadows ?? 0
    const warmth = img.warmth ?? 0
    const sharpness = img.sharpness ?? 0

    // Prüfe ob erweiterte Filter benötigt werden (Pixel-basiert)
    if (highlights !== 0 || shadows !== 0 || warmth !== 0 || sharpness !== 0) {
      // Erstelle ein temporäres Canvas für die Bildmanipulation
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      const tempCtx = tempCanvas.getContext('2d')

      if (tempCtx) {
        // Wende CSS-Filter auf das temporäre Canvas an
        const filters = []
        if (brightness !== 100) {
          filters.push(`brightness(${brightness}%)`)
        }
        if (contrast !== 100) {
          filters.push(`contrast(${contrast}%)`)
        }
        if (saturation !== 100) {
          filters.push(`saturate(${saturation}%)`)
        }
        if (filters.length > 0) {
          tempCtx.filter = filters.join(' ')
        }

        // Zeichne das Bild auf das temporäre Canvas mit CSS-Filtern
        tempCtx.drawImage(htmlImg, 0, 0, img.width, img.height)
        tempCtx.filter = 'none'

        // Hole die Bilddaten für Pixel-basierte Manipulation
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height)
        const data = imageData.data

        // Wende Pixel-basierte Filter an
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          // Berechne Helligkeit des Pixels
          const pixelBrightness = (r + g + b) / 3

          // Lichter (Highlights): Hellt helle Bereiche auf/ab
          if (highlights !== 0) {
            const highlightFactor = highlights / 100
            const highlightMask = Math.pow(pixelBrightness / 255, 2) // Stärker bei helleren Pixeln
            const adjustment = highlightFactor * highlightMask * 50
            r = Math.max(0, Math.min(255, r + adjustment))
            g = Math.max(0, Math.min(255, g + adjustment))
            b = Math.max(0, Math.min(255, b + adjustment))
          }

          // Tiefen (Shadows): Hellt dunkle Bereiche auf/ab
          if (shadows !== 0) {
            const shadowFactor = shadows / 100
            const shadowMask = Math.pow(1 - pixelBrightness / 255, 2) // Stärker bei dunkleren Pixeln
            const adjustment = shadowFactor * shadowMask * 50
            r = Math.max(0, Math.min(255, r + adjustment))
            g = Math.max(0, Math.min(255, g + adjustment))
            b = Math.max(0, Math.min(255, b + adjustment))
          }

          // Wärme: Verschiebt Farben zu Orange (warm) oder Blau (kalt)
          if (warmth !== 0) {
            const warmthFactor = warmth / 100
            r = Math.max(0, Math.min(255, r + warmthFactor * 30))
            b = Math.max(0, Math.min(255, b - warmthFactor * 30))
          }

          // Schärfen: Erhöht den Kontrast zwischen benachbarten Pixeln
          if (sharpness !== 0) {
            const sharpnessFactor = sharpness / 100
            const average = (r + g + b) / 3
            r = Math.max(0, Math.min(255, r + (r - average) * sharpnessFactor))
            g = Math.max(0, Math.min(255, g + (g - average) * sharpnessFactor))
            b = Math.max(0, Math.min(255, b + (b - average) * sharpnessFactor))
          }

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }

        // Setze die manipulierten Bilddaten zurück
        tempCtx.putImageData(imageData, 0, 0)

        // Zeichne das manipulierte Bild zurück auf das Haupt-Canvas
        context.drawImage(tempCanvas, x, y, img.width, img.height)
      }
    } else {
      // Verwende nur CSS-Filter (schneller)
      const filters = []
      if (brightness !== 100) {
        filters.push(`brightness(${brightness}%)`)
      }
      if (contrast !== 100) {
        filters.push(`contrast(${contrast}%)`)
      }
      if (saturation !== 100) {
        filters.push(`saturate(${saturation}%)`)
      }
      if (filters.length > 0) {
        context.filter = filters.join(' ')
      }

      // Zeichne das Bild mit CSS-Filtern
      context.drawImage(htmlImg, x, y, img.width, img.height)

      // Filter zurücksetzen
      context.filter = 'none'
    }

    // Schatten für normale Bilder (ohne abgerundete Ecken) zurücksetzen
    if (img.shadowEnabled && radius === 0) {
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
      context.shadowBlur = 0
      context.shadowColor = 'transparent'
    }

    // Border zeichnen (falls aktiviert)
    if (img.borderEnabled) {
      // Border-Shadow anwenden (falls aktiviert) oder Bildschatten beibehalten
      if (img.borderShadowEnabled) {
        context.shadowOffsetX = img.borderShadowOffsetX
        context.shadowOffsetY = img.borderShadowOffsetY
        context.shadowBlur = img.borderShadowBlur
        context.shadowColor = img.borderShadowColor
      } else if (img.shadowEnabled) {
        // Bildschatten auf Border anwenden
        context.shadowOffsetX = img.shadowOffsetX
        context.shadowOffsetY = img.shadowOffsetY
        context.shadowBlur = img.shadowBlur
        context.shadowColor = img.shadowColor
      }

      context.beginPath()
      if (radius > 0) {
        context.moveTo(x + radius, y)
        context.lineTo(x + img.width - radius, y)
        context.arcTo(x + img.width, y, x + img.width, y + radius, radius)
        context.lineTo(x + img.width, y + img.height - radius)
        context.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
        context.lineTo(x + radius, y + img.height)
        context.arcTo(x, y + img.height, x, y + img.height - radius, radius)
        context.lineTo(x, y + radius)
        context.arcTo(x, y, x + radius, y, radius)
        context.closePath()
      } else {
        context.rect(x, y, img.width, img.height)
      }

      context.strokeStyle = img.borderColor
      context.lineWidth = img.borderWidth

      // Border-Stil anwenden
      if (img.borderStyle === 'dashed') {
        context.setLineDash([10, 5])
      } else if (img.borderStyle === 'dotted') {
        context.setLineDash([2, 3])
      } else if (img.borderStyle === 'double') {
        context.setLineDash([])
        context.lineWidth = img.borderWidth / 3
        context.stroke()
        const offset = img.borderWidth * 0.66
        context.beginPath()
        if (radius > 0) {
          const innerRadius = Math.max(0, radius - offset)
          context.moveTo(x + innerRadius + offset, y + offset)
          context.lineTo(x + img.width - innerRadius - offset, y + offset)
          context.arcTo(x + img.width - offset, y + offset, x + img.width - offset, y + innerRadius + offset, innerRadius)
          context.lineTo(x + img.width - offset, y + img.height - innerRadius - offset)
          context.arcTo(x + img.width - offset, y + img.height - offset, x + img.width - innerRadius - offset, y + img.height - offset, innerRadius)
          context.lineTo(x + innerRadius + offset, y + img.height - offset)
          context.arcTo(x + offset, y + img.height - offset, x + offset, y + img.height - innerRadius - offset, innerRadius)
          context.lineTo(x + offset, y + innerRadius + offset)
          context.arcTo(x + offset, y + offset, x + innerRadius + offset, y + offset, innerRadius)
          context.closePath()
        } else {
          context.rect(x + offset, y + offset, img.width - offset * 2, img.height - offset * 2)
        }
      } else {
        context.setLineDash([])
      }

      context.stroke()
      context.setLineDash([])

      // Schatten zurücksetzen (Bild- oder Border-Shadow)
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
      context.shadowBlur = 0
      context.shadowColor = 'transparent'
    }

    // Löschbutton zeichnen (oben rechts, immer sichtbar für alle Bilder)
    const deleteButtonSize = 24
    const deleteButtonX = img.width / 2 - deleteButtonSize / 2
    const deleteButtonY = -img.height / 2 - deleteButtonSize / 2

    // Roter Kreis für Löschbutton
    context.fillStyle = '#ef4444'
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.beginPath()
    context.arc(deleteButtonX, deleteButtonY, deleteButtonSize / 2, 0, Math.PI * 2)
    context.fill()
    context.stroke()

    // Weißes X im Löschbutton
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.lineCap = 'round'
    const xSize = deleteButtonSize * 0.4
    context.beginPath()
    context.moveTo(deleteButtonX - xSize / 2, deleteButtonY - xSize / 2)
    context.lineTo(deleteButtonX + xSize / 2, deleteButtonY + xSize / 2)
    context.moveTo(deleteButtonX + xSize / 2, deleteButtonY - xSize / 2)
    context.lineTo(deleteButtonX - xSize / 2, deleteButtonY + xSize / 2)
    context.stroke()

    // Highlight für ausgewählte Bilder (Mehrfachauswahl)
    const isSelected = collage.isImageSelected(img.id)
    const isPrimarySelected = collage.selectedImageId === img.id

    if (isSelected) {
      // Primär ausgewähltes Bild: Blau, sekundäre: Cyan
      context.strokeStyle = isPrimarySelected ? '#3b82f6' : '#06b6d4'
      context.lineWidth = isPrimarySelected ? 3 : 2
      context.strokeRect(-img.width / 2, -img.height / 2, img.width, img.height)

      // Resize-Handles nur für das primär ausgewählte Bild zeichnen
      if (isPrimarySelected) {
        const handleSize = 16
        const handles = [
          { x: -img.width / 2, y: -img.height / 2, cursor: 'nw' }, // top-left
          { x: 0, y: -img.height / 2, cursor: 'n' }, // top-center
          { x: img.width / 2, y: -img.height / 2, cursor: 'ne' }, // top-right
          { x: img.width / 2, y: 0, cursor: 'e' }, // middle-right
          { x: img.width / 2, y: img.height / 2, cursor: 'se' }, // bottom-right
          { x: 0, y: img.height / 2, cursor: 's' }, // bottom-center
          { x: -img.width / 2, y: img.height / 2, cursor: 'sw' }, // bottom-left
          { x: -img.width / 2, y: 0, cursor: 'w' }, // middle-left
        ]

        // Zeichne Handles mit weißem Rand für bessere Sichtbarkeit
        context.fillStyle = '#ffffff'
        context.strokeStyle = '#3b82f6'
        context.lineWidth = 2
        handles.forEach(handle => {
          context.fillRect(
            handle.x - handleSize / 2,
            handle.y - handleSize / 2,
            handleSize,
            handleSize
          )
          context.strokeRect(
            handle.x - handleSize / 2,
            handle.y - handleSize / 2,
            handleSize,
            handleSize
          )
        })
      }

      // Auswahl-Indikator für Mehrfachauswahl (kleine Markierung oben links)
      if (collage.selectedImageIds.length > 1) {
        const checkSize = 18
        const checkX = -img.width / 2 + 8
        const checkY = -img.height / 2 + 8

        // Grüner Kreis mit Häkchen
        context.fillStyle = '#22c55e'
        context.beginPath()
        context.arc(checkX, checkY, checkSize / 2, 0, Math.PI * 2)
        context.fill()

        // Weißes Häkchen
        context.strokeStyle = '#ffffff'
        context.lineWidth = 2
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.beginPath()
        context.moveTo(checkX - 4, checkY)
        context.lineTo(checkX - 1, checkY + 3)
        context.lineTo(checkX + 5, checkY - 4)
        context.stroke()
      }
    }

    context.restore()
  }

  // Texte zeichnen (nach Bildern, sortiert nach zIndex)
  for (const text of [...collage.texts].sort((a, b) => a.zIndex - b.zIndex)) {
    context.save()
    context.translate(text.x, text.y)
    context.rotate((text.rotation * Math.PI) / 180)

    // Schatten anwenden, wenn aktiviert
    if (text.shadowEnabled) {
      context.shadowOffsetX = text.shadowOffsetX
      context.shadowOffsetY = text.shadowOffsetY
      context.shadowBlur = text.shadowBlur
      context.shadowColor = text.shadowColor
    }

    // Text-Styling
    context.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
    context.fillStyle = text.color
    context.textAlign = text.textAlign
    context.textBaseline = 'middle'

    // Multi-line Text-Rendering
    const lines = text.text.split('\n')
    const lineHeight = text.fontSize * 1.2
    const totalHeight = lines.length * lineHeight

    lines.forEach((line, index) => {
      const y = (index - (lines.length - 1) / 2) * lineHeight
      context.fillText(line, 0, y)
    })

    // Schatten zurücksetzen
    context.shadowOffsetX = 0
    context.shadowOffsetY = 0
    context.shadowBlur = 0
    context.shadowColor = 'transparent'

    // Highlight für selektierten Text
    if (collage.selectedTextId === text.id) {
      // Berechne Text-Bounding-Box
      const maxWidth = Math.max(...lines.map(line => context.measureText(line).width))
      const boxWidth = maxWidth
      const boxHeight = totalHeight

      let offsetX = 0
      if (text.textAlign === 'center') offsetX = -boxWidth / 2
      else if (text.textAlign === 'right') offsetX = -boxWidth

      context.strokeStyle = '#3b82f6'
      context.lineWidth = 2
      context.strokeRect(offsetX - 5, -boxHeight / 2 - 5, boxWidth + 10, boxHeight + 10)
    }

    context.restore()
  }

  // Smart Guides zeichnen (nach Bildern und Texten, während des Draggings)
  drawGuides()

  // Restore scroll position after all rendering is complete (prevents jump)
  requestAnimationFrame(() => {
    if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
      window.scrollTo(scrollX, scrollY)
    }
  })
}

function getResizeHandle(x: number, y: number, img: any): string | null {
  const handleSize = 16
  const hitRadius = handleSize // Größerer Hit-Bereich
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2

  // Transform click point to image coordinate system (considering rotation)
  const angle = (img.rotation * Math.PI) / 180
  const dx = x - centerX
  const dy = y - centerY
  const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
  const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

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

function isDeleteButtonClicked(x: number, y: number, img: any): boolean {
  const deleteButtonSize = 24
  const centerX = img.x + img.width / 2
  const centerY = img.y + img.height / 2

  // Transform click point to image coordinate system (considering rotation)
  const angle = (img.rotation * Math.PI) / 180
  const dx = x - centerX
  const dy = y - centerY
  const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle)
  const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle)

  // Position des Löschbuttons im Bild-Koordinatensystem
  const deleteButtonX = img.width / 2 - deleteButtonSize / 2
  const deleteButtonY = -img.height / 2 - deleteButtonSize / 2

  // Prüfe ob Klick innerhalb des Löschbuttons ist (Kreis)
  const distance = Math.sqrt(
    Math.pow(rotatedX - deleteButtonX, 2) + Math.pow(rotatedY - deleteButtonY, 2)
  )

  return distance <= deleteButtonSize / 2
}

function handleMouseDown(e: MouseEvent) {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  // Berücksichtige Zoom beim Berechnen der Koordinaten
  const zoom = collage.canvasZoom
  const x = (e.clientX - rect.left) / zoom
  const y = (e.clientY - rect.top) / zoom

  // Prüfe ob ein Löschbutton angeklickt wurde (NUR Canvas-Instanzen, keine Templates!)
  const clickedDeleteImage = collage.images
    .filter(img => img.isGalleryTemplate !== true)
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(img => isDeleteButtonClicked(x, y, img))

  if (clickedDeleteImage) {
    // Speichere Zustand für Undo VOR dem Löschen
    collage.saveStateForUndo()
    // Bild aus Canvas entfernen
    collage.removeImage(clickedDeleteImage.id)
    return
  }

  // Prüfe ob ein Resize-Handle des ausgewählten Bildes angeklickt wurde
  const selectedImg = collage.selectedImage
  if (selectedImg) {
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
        height: selectedImg.height
      }
      shiftPressed.value = e.shiftKey
      initialAspectRatio.value = selectedImg.width / selectedImg.height
      return
    }
  }

  // Finde angeklickten Text (von oben nach unten, höchster zIndex zuerst)
  const clickedText = [...collage.texts]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(text => {
      if (!ctx) return false

      const context = ctx

      context.save()
      context.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
      context.textAlign = text.textAlign

      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2
      const totalHeight = lines.length * lineHeight
      const maxWidth = Math.max(...lines.map(line => context.measureText(line).width))

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
  const canvasImages = collage.images.filter(img => img.isGalleryTemplate !== true)
  const clickedImage = [...canvasImages]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(img =>
      x >= img.x && x <= img.x + img.width &&
      y >= img.y && y <= img.y + img.height
    )

  if (clickedImage) {
    // Speichere Zustand für Undo VOR dem Verschieben
    collage.saveStateForUndo()
    // Ctrl/Cmd+Click für Mehrfachauswahl
    if (e.ctrlKey || e.metaKey) {
      collage.toggleImageSelection(clickedImage.id)
      // Bei Mehrfachauswahl: Dragging nur starten, wenn das Bild bereits ausgewählt war
      if (collage.isImageSelected(clickedImage.id)) {
        isDragging.value = true
        dragStartPos.value = { x, y }
        dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
      }
    } else {
      // Normaler Klick: Ersetzt die Auswahl
      collage.selectImage(clickedImage.id)
      isDragging.value = true
      dragStartPos.value = { x, y }
      dragImageStart.value = { x: clickedImage.x, y: clickedImage.y }
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

  if ((!collage.selectedImageId && !collage.selectedTextId) || (!isDragging.value && !isResizing.value)) return

  const rect = canvas.value.getBoundingClientRect()
  // Berücksichtige Zoom beim Berechnen der Koordinaten
  const zoom = collage.canvasZoom
  const x = (e.clientX - rect.left) / zoom
  const y = (e.clientY - rect.top) / zoom

  // Text-Drag-Funktionalität
  if (isDragging.value && collage.selectedTextId && collage.selectedText) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y
    collage.updateText(collage.selectedText.id, {
      x: dragImageStart.value.x + dx,
      y: dragImageStart.value.y + dy
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
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
          const avgChange = (newWidth / resizeStart.value.width + newHeight / resizeStart.value.height) / 2
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
      const resizeSnap = detectResizeAlignments(
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
      activeGuides.value = resizeSnap.guides

      // Nochmal Mindestgröße prüfen nach Snap
      if (newWidth >= 20 && newHeight >= 20) {
        collage.updateImage(collage.selectedImageId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        })
      }
    }
  } else if (isDragging.value && collage.selectedImageId) {
    const dx = x - dragStartPos.value.x
    const dy = y - dragStartPos.value.y

    // Berechne Zielposition
    let targetX = dragImageStart.value.x + dx
    let targetY = dragImageStart.value.y + dy

    // Hole das aktuell gezogene Bild für die Dimensionen
    const selectedImg = collage.selectedImage
    if (selectedImg) {
      // Smart Guides: Erkennung und Snap
      const alignment = detectAlignments(
        targetX,
        targetY,
        selectedImg.width,
        selectedImg.height,
        selectedImg.id
      )

      // Wende Snap-Positionen an, wenn vorhanden
      if (alignment.snapX !== null) {
        targetX = alignment.snapX
      }
      if (alignment.snapY !== null) {
        targetY = alignment.snapY
      }

      // Aktualisiere aktive Guide-Linien für die Anzeige
      activeGuides.value = alignment.guides
    }

    collage.updateImage(collage.selectedImageId, {
      x: targetX,
      y: targetY
    })
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  resizeHandle.value = null
  // Smart Guides ausblenden wenn Drag/Resize beendet
  activeGuides.value = []
}

// Drag-Drop Funktionalität für Bilder aus der Galerie
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()

  if (!canvas.value || !e.dataTransfer) return

  const imageId = e.dataTransfer.getData('imageId')
  if (!imageId) return

  // Berechne die Drop-Position relativ zum Canvas (mit Zoom)
  const rect = canvas.value.getBoundingClientRect()
  const zoom = collage.canvasZoom
  const x = (e.clientX - rect.left) / zoom
  const y = (e.clientY - rect.top) / zoom

  // Dupliziere das Bild an der Drop-Position
  collage.duplicateImageToPosition(imageId, x, y)
}

// Cleanup
watch(() => collage.images, (newImages, oldImages) => {
  oldImages?.forEach(img => {
    if (!newImages.find(ni => ni.id === img.id)) {
      loadedImages.delete(img.id)
    }
  })
})
</script>

<template>
  <div ref="container" class="w-full bg-muted/10 dark:bg-slate/30 rounded-lg p-4 overflow-auto relative" style="max-height: 80vh;">
    <!-- Zoom Info-Badge -->
    <div
      v-if="collage.canvasZoom !== 1"
      class="absolute top-2 right-2 z-10 bg-slate-dark/80 text-surface-light text-xs px-2 py-1 rounded pointer-events-none"
    >
      {{ Math.round(collage.canvasZoom * 100) }}%
    </div>
    <!-- Scrollable Content Wrapper - dimensions match zoomed canvas size -->
    <div
      class="flex items-center justify-center"
      :style="{
        minWidth: (collage.settings.width * collage.canvasZoom) + 'px',
        minHeight: Math.max(400, collage.settings.height * collage.canvasZoom) + 'px'
      }"
    >
      <canvas
        ref="canvas"
        tabindex="-1"
        @mousedown.prevent="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @dragover="handleDragOver"
        @drop="handleDrop"
        class="shadow-lg outline-none cursor-move"
        :style="{
          transform: `scale(${collage.canvasZoom})`,
          transformOrigin: 'center center'
        }"
        style="image-rendering: high-quality;"
      />
    </div>
  </div>
</template>
