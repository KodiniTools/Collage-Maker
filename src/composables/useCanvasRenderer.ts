import { watch, nextTick, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { drawCanvasBorder } from '@/lib/export-engine/drawCanvasBorder'

export function useCanvasRenderer(
  canvas: Ref<HTMLCanvasElement | null>,
  drawGuides: (ctx: CanvasRenderingContext2D | null) => void
) {
  const collage = useCollageStore()
  let ctx: CanvasRenderingContext2D | null = null
  const loadedImages = new Map<string, HTMLImageElement>()
  let backgroundImageElement: HTMLImageElement | null = null
  let loadedBackgroundUrl: string | null = null

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

  function drawGrid(): void {
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

  async function renderCanvas(): Promise<void> {
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
    const canvasImages = collage.images.filter((img) => img.isGalleryTemplate !== true)

    // Clean up loadedImages for removed images
    const currentImageIds = new Set(canvasImages.map((img) => img.id))
    for (const [id] of loadedImages) {
      if (!currentImageIds.has(id)) {
        loadedImages.delete(id)
      }
    }

    // Bilder laden und zeichnen
    for (const img of [...canvasImages].sort((a, b) => a.zIndex - b.zIndex)) {
      let htmlImg = loadedImages.get(img.id)

      // Check if cached image has a different URL (e.g., after restore) or is broken
      if (htmlImg && (htmlImg.src !== img.url || !htmlImg.complete || htmlImg.naturalWidth === 0)) {
        loadedImages.delete(img.id)
        htmlImg = undefined
      }

      if (!htmlImg) {
        htmlImg = new Image()
        htmlImg.src = img.url
        loadedImages.set(img.id, htmlImg)
        const loaded = await new Promise<boolean>((resolve) => {
          htmlImg!.onload = () => resolve(true)
          htmlImg!.onerror = () => resolve(false)
        })
        if (!loaded) {
          loadedImages.delete(img.id)
          continue // Skip broken images
        }
      }

      // Double-check: skip if image is in broken state
      if (!htmlImg.complete || htmlImg.naturalWidth === 0) {
        loadedImages.delete(img.id)
        continue
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
          context.arcTo(
            x + img.width,
            y + img.height,
            x + img.width - radius,
            y + img.height,
            radius
          )
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
            context.arcTo(
              x + img.width - offset,
              y + offset,
              x + img.width - offset,
              y + innerRadius + offset,
              innerRadius
            )
            context.lineTo(x + img.width - offset, y + img.height - innerRadius - offset)
            context.arcTo(
              x + img.width - offset,
              y + img.height - offset,
              x + img.width - innerRadius - offset,
              y + img.height - offset,
              innerRadius
            )
            context.lineTo(x + innerRadius + offset, y + img.height - offset)
            context.arcTo(
              x + offset,
              y + img.height - offset,
              x + offset,
              y + img.height - innerRadius - offset,
              innerRadius
            )
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
      const deleteButtonSize = 14
      const deleteButtonX = img.width / 2 - deleteButtonSize / 2
      const deleteButtonY = -img.height / 2 - deleteButtonSize / 2

      // Roter Kreis für Löschbutton
      context.fillStyle = '#ef4444'
      context.strokeStyle = '#ffffff'
      context.lineWidth = 1.5
      context.beginPath()
      context.arc(deleteButtonX, deleteButtonY, deleteButtonSize / 2, 0, Math.PI * 2)
      context.fill()
      context.stroke()

      // Weißes X im Löschbutton
      context.strokeStyle = '#ffffff'
      context.lineWidth = 1.5
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
        context.lineWidth = isPrimarySelected ? 2 : 1.5
        context.strokeRect(-img.width / 2, -img.height / 2, img.width, img.height)

        // Resize-Handles nur für das primär ausgewählte Bild zeichnen
        if (isPrimarySelected) {
          const handleSize = 8
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
          context.lineWidth = 1.5
          handles.forEach((handle) => {
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
          const checkSize = 12
          const checkX = -img.width / 2 + 6
          const checkY = -img.height / 2 + 6

          // Grüner Kreis mit Häkchen
          context.fillStyle = '#22c55e'
          context.beginPath()
          context.arc(checkX, checkY, checkSize / 2, 0, Math.PI * 2)
          context.fill()

          // Weißes Häkchen
          context.strokeStyle = '#ffffff'
          context.lineWidth = 1.5
          context.lineCap = 'round'
          context.lineJoin = 'round'
          context.beginPath()
          context.moveTo(checkX - 3, checkY)
          context.lineTo(checkX - 0.5, checkY + 2)
          context.lineTo(checkX + 3.5, checkY - 3)
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
      // Buchstabenabstand (Letter Spacing)
      context.letterSpacing = `${text.letterSpacing}px`

      // Multi-line Text-Rendering
      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2
      const totalHeight = lines.length * lineHeight

      // Stroke (Textumrandung) zeichnen, wenn aktiviert
      // Stroke wird ZUERST gezeichnet, damit der Fill darüber liegt
      if (text.strokeEnabled) {
        context.strokeStyle = text.strokeColor
        context.lineWidth = text.strokeWidth * 2 // Verdoppeln, da die Hälfte vom Fill überdeckt wird
        context.lineJoin = 'round'
        context.miterLimit = 2

        lines.forEach((line, index) => {
          const y = (index - (lines.length - 1) / 2) * lineHeight
          context.strokeText(line, 0, y)
        })
      }

      // Fill-Text zeichnen
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
        const maxWidth = Math.max(...lines.map((line) => context.measureText(line).width))
        const boxWidth = maxWidth
        const boxHeight = totalHeight

        let offsetX = 0
        if (text.textAlign === 'center') offsetX = -boxWidth / 2
        else if (text.textAlign === 'right') offsetX = -boxWidth

        context.strokeStyle = '#3b82f6'
        context.lineWidth = 2
        context.strokeRect(offsetX - 5, -boxHeight / 2 - 5, boxWidth + 10, boxHeight + 10)

        // Skalierungspunkte (Eck-Handles) zum Vergrössern/Verkleinern des Textes
        const handleSize = 8
        const corners = [
          { hx: offsetX - 5, hy: -boxHeight / 2 - 5 },
          { hx: offsetX + boxWidth + 5, hy: -boxHeight / 2 - 5 },
          { hx: offsetX + boxWidth + 5, hy: boxHeight / 2 + 5 },
          { hx: offsetX - 5, hy: boxHeight / 2 + 5 },
        ]
        context.fillStyle = '#ffffff'
        context.strokeStyle = '#3b82f6'
        context.lineWidth = 1.5
        corners.forEach((c) => {
          context.fillRect(c.hx - handleSize / 2, c.hy - handleSize / 2, handleSize, handleSize)
          context.strokeRect(c.hx - handleSize / 2, c.hy - handleSize / 2, handleSize, handleSize)
        })
      }

      context.restore()
    }

    // Rahmen um die Leinwand (über allen Inhalten, vor den Smart Guides)
    drawCanvasBorder(context, canvas.value.width, canvas.value.height, collage.settings.border)

    // Smart Guides zeichnen (nach Bildern und Texten, während des Draggings)
    drawGuides(ctx)

    // Restore scroll position after all rendering is complete (prevents jump)
    requestAnimationFrame(() => {
      if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
        window.scrollTo(scrollX, scrollY)
      }
    })
  }

  onMounted(() => {
    if (canvas.value) {
      ctx = canvas.value.getContext('2d')
      renderCanvas()
    }
  })

  watch(
    () => [
      collage.images,
      collage.texts,
      collage.settings,
      collage.selectedImageIds,
      collage.selectedTextId,
      collage.isBackgroundSelected,
    ],
    () => {
      nextTick(() => renderCanvas())
    },
    { deep: true }
  )

  // Cleanup watch for removed images
  watch(
    () => collage.images,
    (newImages, oldImages) => {
      oldImages?.forEach((img) => {
        if (!newImages.find((ni) => ni.id === img.id)) {
          loadedImages.delete(img.id)
        }
      })
    }
  )

  function getCtx() {
    return ctx
  }

  return { renderCanvas, getCtx }
}
