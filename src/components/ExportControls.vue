<script setup lang="ts">
import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const toast = useToastStore()
const { t } = useI18n()

const exportFormat = ref<'png' | 'png-transparent' | 'jpeg' | 'webp'>('png')
const exportQuality = ref(0.95)
const isExporting = ref(false)
const isGeneratingPreview = ref(false)
const showPreviewModal = ref(false)
const previewDataUrl = ref<string | null>(null)

async function drawBackgroundImageExport(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): Promise<void> {
  const bgSettings = collage.settings.backgroundImage
  if (!bgSettings.url) return

  const bgUrl = bgSettings.url
  const fit = bgSettings.fit

  const img = new Image()
  img.src = bgUrl
  await new Promise((resolve) => {
    img.onload = resolve
  })

  const imgWidth = img.naturalWidth
  const imgHeight = img.naturalHeight

  ctx.save()

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
    ctx.filter = filters.join(' ')
  }

  // Transparenz anwenden
  ctx.globalAlpha = bgSettings.opacity

  if (fit === 'cover') {
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else if (fit === 'contain') {
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    const x = (canvasWidth - scaledWidth) / 2
    const y = (canvasHeight - scaledHeight) / 2
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else if (fit === 'stretch') {
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  } else if (fit === 'tile') {
    const pattern = ctx.createPattern(img, 'repeat')
    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  }

  ctx.filter = 'none'
  ctx.globalAlpha = 1
  ctx.restore()
}

async function exportCollage() {
  isExporting.value = true

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error(t('toast.exportError'))
      return
    }

    canvas.width = collage.settings.width
    canvas.height = collage.settings.height

    // Background nur zeichnen wenn NICHT transparent
    if (exportFormat.value !== 'png-transparent') {
      // Background Color
      ctx.fillStyle = collage.settings.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Background Image
      await drawBackgroundImageExport(ctx, canvas.width, canvas.height)
    }

    // Render images - NUR Canvas-Instanzen exportieren (keine Gallery-Templates)
    const canvasImages = collage.images.filter(img => img.isGalleryTemplate !== true)
    for (const img of [...canvasImages].sort((a, b) => a.zIndex - b.zIndex)) {
      const htmlImg = new Image()
      htmlImg.src = img.url

      await new Promise((resolve) => {
        htmlImg.onload = resolve
      })

      ctx.save()
      ctx.translate(img.x + img.width / 2, img.y + img.height / 2)
      ctx.rotate((img.rotation * Math.PI) / 180)

      // Deckkraft anwenden
      ctx.globalAlpha = img.opacity

      const x = -img.width / 2
      const y = -img.height / 2
      const radius = Math.min(img.borderRadius, img.width / 2, img.height / 2)

      // Wenn abgerundete Ecken + Schatten: Erst Schatten-Form zeichnen, dann Bild mit Clipping
      if (radius > 0 && img.shadowEnabled) {
        // Schatten auf abgerundete Form anwenden
        ctx.shadowOffsetX = img.shadowOffsetX
        ctx.shadowOffsetY = img.shadowOffsetY
        ctx.shadowBlur = img.shadowBlur
        ctx.shadowColor = img.shadowColor

        // Gefüllten Pfad für Schatten zeichnen
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + img.width - radius, y)
        ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
        ctx.lineTo(x + img.width, y + img.height - radius)
        ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
        ctx.lineTo(x + radius, y + img.height)
        ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        ctx.closePath()
        ctx.fillStyle = '#000000' // Farbe egal, wird vom Bild überdeckt
        ctx.fill()

        // Schatten zurücksetzen vor dem eigentlichen Bild
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      } else if (img.shadowEnabled) {
        // Normaler Schatten ohne abgerundete Ecken
        ctx.shadowOffsetX = img.shadowOffsetX
        ctx.shadowOffsetY = img.shadowOffsetY
        ctx.shadowBlur = img.shadowBlur
        ctx.shadowColor = img.shadowColor
      }

      // Clip-Pfad mit abgerundeten Ecken erstellen
      if (radius > 0) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + img.width - radius, y)
        ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
        ctx.lineTo(x + img.width, y + img.height - radius)
        ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
        ctx.lineTo(x + radius, y + img.height)
        ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        ctx.closePath()
        ctx.clip()
      }

      // Bildbearbeitungs-Filter anwenden (gleiche Logik wie in CollageCanvas.vue)
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
              const highlightMask = Math.pow(pixelBrightness / 255, 2)
              const adjustment = highlightFactor * highlightMask * 50
              r = Math.max(0, Math.min(255, r + adjustment))
              g = Math.max(0, Math.min(255, g + adjustment))
              b = Math.max(0, Math.min(255, b + adjustment))
            }

            // Tiefen (Shadows): Hellt dunkle Bereiche auf/ab
            if (shadows !== 0) {
              const shadowFactor = shadows / 100
              const shadowMask = Math.pow(1 - pixelBrightness / 255, 2)
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

          // Zeichne das manipulierte Bild zurück auf das Export-Canvas
          ctx.drawImage(tempCanvas, x, y, img.width, img.height)
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
          ctx.filter = filters.join(' ')
        }

        // Zeichne das Bild mit CSS-Filtern
        ctx.drawImage(htmlImg, x, y, img.width, img.height)

        // Filter zurücksetzen
        ctx.filter = 'none'
      }

      // Schatten für normale Bilder (ohne abgerundete Ecken) zurücksetzen
      if (img.shadowEnabled && radius === 0) {
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }

      // Border zeichnen (falls aktiviert)
      if (img.borderEnabled) {
        // Border-Shadow anwenden (falls aktiviert) oder Bildschatten beibehalten
        if (img.borderShadowEnabled) {
          ctx.shadowOffsetX = img.borderShadowOffsetX
          ctx.shadowOffsetY = img.borderShadowOffsetY
          ctx.shadowBlur = img.borderShadowBlur
          ctx.shadowColor = img.borderShadowColor
        } else if (img.shadowEnabled) {
          // Bildschatten auf Border anwenden
          ctx.shadowOffsetX = img.shadowOffsetX
          ctx.shadowOffsetY = img.shadowOffsetY
          ctx.shadowBlur = img.shadowBlur
          ctx.shadowColor = img.shadowColor
        }

        ctx.beginPath()
        if (radius > 0) {
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + img.width - radius, y)
          ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
          ctx.lineTo(x + img.width, y + img.height - radius)
          ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
          ctx.lineTo(x + radius, y + img.height)
          ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
          ctx.lineTo(x, y + radius)
          ctx.arcTo(x, y, x + radius, y, radius)
          ctx.closePath()
        } else {
          ctx.rect(x, y, img.width, img.height)
        }

        ctx.strokeStyle = img.borderColor
        ctx.lineWidth = img.borderWidth

        // Border-Stil anwenden
        if (img.borderStyle === 'dashed') {
          ctx.setLineDash([10, 5])
        } else if (img.borderStyle === 'dotted') {
          ctx.setLineDash([2, 3])
        } else if (img.borderStyle === 'double') {
          ctx.setLineDash([])
          ctx.lineWidth = img.borderWidth / 3
          ctx.stroke()
          const offset = img.borderWidth * 0.66
          ctx.beginPath()
          if (radius > 0) {
            const innerRadius = Math.max(0, radius - offset)
            ctx.moveTo(x + innerRadius + offset, y + offset)
            ctx.lineTo(x + img.width - innerRadius - offset, y + offset)
            ctx.arcTo(x + img.width - offset, y + offset, x + img.width - offset, y + innerRadius + offset, innerRadius)
            ctx.lineTo(x + img.width - offset, y + img.height - innerRadius - offset)
            ctx.arcTo(x + img.width - offset, y + img.height - offset, x + img.width - innerRadius - offset, y + img.height - offset, innerRadius)
            ctx.lineTo(x + innerRadius + offset, y + img.height - offset)
            ctx.arcTo(x + offset, y + img.height - offset, x + offset, y + img.height - innerRadius - offset, innerRadius)
            ctx.lineTo(x + offset, y + innerRadius + offset)
            ctx.arcTo(x + offset, y + offset, x + innerRadius + offset, y + offset, innerRadius)
            ctx.closePath()
          } else {
            ctx.rect(x + offset, y + offset, img.width - offset * 2, img.height - offset * 2)
          }
        } else {
          ctx.setLineDash([])
        }

        ctx.stroke()
        ctx.setLineDash([])

        // Schatten zurücksetzen (Bild- oder Border-Shadow)
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }

      ctx.restore()
    }

    // Texte zeichnen (nach Bildern, sortiert nach zIndex)
    for (const text of [...collage.texts].sort((a, b) => a.zIndex - b.zIndex)) {
      ctx.save()
      ctx.translate(text.x, text.y)
      ctx.rotate((text.rotation * Math.PI) / 180)

      // Schatten anwenden, wenn aktiviert
      if (text.shadowEnabled) {
        ctx.shadowOffsetX = text.shadowOffsetX
        ctx.shadowOffsetY = text.shadowOffsetY
        ctx.shadowBlur = text.shadowBlur
        ctx.shadowColor = text.shadowColor
      }

      // Text-Styling
      ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
      ctx.fillStyle = text.color
      ctx.textAlign = text.textAlign
      ctx.textBaseline = 'middle'
      // Buchstabenabstand (Letter Spacing)
      ctx.letterSpacing = `${text.letterSpacing ?? 0}px`

      // Multi-line Text-Rendering
      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2

      // Stroke (Textumrandung) zeichnen, wenn aktiviert
      // Stroke wird ZUERST gezeichnet, damit der Fill darüber liegt
      if (text.strokeEnabled) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth * 2 // Verdoppeln, da die Hälfte vom Fill überdeckt wird
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2

        lines.forEach((line, index) => {
          const y = (index - (lines.length - 1) / 2) * lineHeight
          ctx.strokeText(line, 0, y)
        })
      }

      // Fill-Text zeichnen
      lines.forEach((line, index) => {
        const y = (index - (lines.length - 1) / 2) * lineHeight
        ctx.fillText(line, 0, y)
      })

      // Schatten zurücksetzen
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      ctx.restore()
    }

    // Download
    const mimeType =
      exportFormat.value === 'png' || exportFormat.value === 'png-transparent' ? 'image/png' :
      exportFormat.value === 'webp' ? 'image/webp' :
      'image/jpeg'

    // Dateiendung bestimmen (png-transparent -> png)
    const fileExtension = exportFormat.value === 'png-transparent' ? 'png' : exportFormat.value

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `collage-${Date.now()}.${fileExtension}`
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      }, mimeType, exportQuality.value)
    })

    toast.success(t('toast.exportSuccess'))
  } catch (error) {
    console.error('Export error:', error)
    toast.error(t('toast.exportError'))
  } finally {
    isExporting.value = false
  }
}

async function generatePreview() {
  isGeneratingPreview.value = true

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error(t('toast.exportError'))
      return
    }

    canvas.width = collage.settings.width
    canvas.height = collage.settings.height

    // Background nur zeichnen wenn NICHT transparent
    if (exportFormat.value !== 'png-transparent') {
      // Background Color
      ctx.fillStyle = collage.settings.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Background Image
      await drawBackgroundImageExport(ctx, canvas.width, canvas.height)
    }

    // Render images - NUR Canvas-Instanzen exportieren (keine Gallery-Templates)
    const canvasImages = collage.images.filter(img => img.isGalleryTemplate !== true)
    for (const img of [...canvasImages].sort((a, b) => a.zIndex - b.zIndex)) {
      const htmlImg = new Image()
      htmlImg.src = img.url

      await new Promise((resolve) => {
        htmlImg.onload = resolve
      })

      ctx.save()
      ctx.translate(img.x + img.width / 2, img.y + img.height / 2)
      ctx.rotate((img.rotation * Math.PI) / 180)

      // Deckkraft anwenden
      ctx.globalAlpha = img.opacity

      const x = -img.width / 2
      const y = -img.height / 2
      const radius = Math.min(img.borderRadius, img.width / 2, img.height / 2)

      // Wenn abgerundete Ecken + Schatten: Erst Schatten-Form zeichnen, dann Bild mit Clipping
      if (radius > 0 && img.shadowEnabled) {
        ctx.shadowOffsetX = img.shadowOffsetX
        ctx.shadowOffsetY = img.shadowOffsetY
        ctx.shadowBlur = img.shadowBlur
        ctx.shadowColor = img.shadowColor

        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + img.width - radius, y)
        ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
        ctx.lineTo(x + img.width, y + img.height - radius)
        ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
        ctx.lineTo(x + radius, y + img.height)
        ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        ctx.closePath()
        ctx.fillStyle = '#000000'
        ctx.fill()

        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      } else if (img.shadowEnabled) {
        ctx.shadowOffsetX = img.shadowOffsetX
        ctx.shadowOffsetY = img.shadowOffsetY
        ctx.shadowBlur = img.shadowBlur
        ctx.shadowColor = img.shadowColor
      }

      if (radius > 0) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + img.width - radius, y)
        ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
        ctx.lineTo(x + img.width, y + img.height - radius)
        ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
        ctx.lineTo(x + radius, y + img.height)
        ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        ctx.closePath()
        ctx.clip()
      }

      const brightness = img.brightness ?? 100
      const contrast = img.contrast ?? 100
      const saturation = img.saturation ?? 100
      const highlights = img.highlights ?? 0
      const shadows = img.shadows ?? 0
      const warmth = img.warmth ?? 0
      const sharpness = img.sharpness ?? 0

      if (highlights !== 0 || shadows !== 0 || warmth !== 0 || sharpness !== 0) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const tempCtx = tempCanvas.getContext('2d')

        if (tempCtx) {
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

          tempCtx.drawImage(htmlImg, 0, 0, img.width, img.height)
          tempCtx.filter = 'none'

          const imageData = tempCtx.getImageData(0, 0, img.width, img.height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i]
            let g = data[i + 1]
            let b = data[i + 2]

            const pixelBrightness = (r + g + b) / 3

            if (highlights !== 0) {
              const highlightFactor = highlights / 100
              const highlightMask = Math.pow(pixelBrightness / 255, 2)
              const adjustment = highlightFactor * highlightMask * 50
              r = Math.max(0, Math.min(255, r + adjustment))
              g = Math.max(0, Math.min(255, g + adjustment))
              b = Math.max(0, Math.min(255, b + adjustment))
            }

            if (shadows !== 0) {
              const shadowFactor = shadows / 100
              const shadowMask = Math.pow(1 - pixelBrightness / 255, 2)
              const adjustment = shadowFactor * shadowMask * 50
              r = Math.max(0, Math.min(255, r + adjustment))
              g = Math.max(0, Math.min(255, g + adjustment))
              b = Math.max(0, Math.min(255, b + adjustment))
            }

            if (warmth !== 0) {
              const warmthFactor = warmth / 100
              r = Math.max(0, Math.min(255, r + warmthFactor * 30))
              b = Math.max(0, Math.min(255, b - warmthFactor * 30))
            }

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

          tempCtx.putImageData(imageData, 0, 0)
          ctx.drawImage(tempCanvas, x, y, img.width, img.height)
        }
      } else {
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
          ctx.filter = filters.join(' ')
        }

        ctx.drawImage(htmlImg, x, y, img.width, img.height)
        ctx.filter = 'none'
      }

      if (img.shadowEnabled && radius === 0) {
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }

      if (img.borderEnabled) {
        if (img.borderShadowEnabled) {
          ctx.shadowOffsetX = img.borderShadowOffsetX
          ctx.shadowOffsetY = img.borderShadowOffsetY
          ctx.shadowBlur = img.borderShadowBlur
          ctx.shadowColor = img.borderShadowColor
        } else if (img.shadowEnabled) {
          ctx.shadowOffsetX = img.shadowOffsetX
          ctx.shadowOffsetY = img.shadowOffsetY
          ctx.shadowBlur = img.shadowBlur
          ctx.shadowColor = img.shadowColor
        }

        ctx.beginPath()
        if (radius > 0) {
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + img.width - radius, y)
          ctx.arcTo(x + img.width, y, x + img.width, y + radius, radius)
          ctx.lineTo(x + img.width, y + img.height - radius)
          ctx.arcTo(x + img.width, y + img.height, x + img.width - radius, y + img.height, radius)
          ctx.lineTo(x + radius, y + img.height)
          ctx.arcTo(x, y + img.height, x, y + img.height - radius, radius)
          ctx.lineTo(x, y + radius)
          ctx.arcTo(x, y, x + radius, y, radius)
          ctx.closePath()
        } else {
          ctx.rect(x, y, img.width, img.height)
        }

        ctx.strokeStyle = img.borderColor
        ctx.lineWidth = img.borderWidth

        if (img.borderStyle === 'dashed') {
          ctx.setLineDash([10, 5])
        } else if (img.borderStyle === 'dotted') {
          ctx.setLineDash([2, 3])
        } else if (img.borderStyle === 'double') {
          ctx.setLineDash([])
          ctx.lineWidth = img.borderWidth / 3
          ctx.stroke()
          const offset = img.borderWidth * 0.66
          ctx.beginPath()
          if (radius > 0) {
            const innerRadius = Math.max(0, radius - offset)
            ctx.moveTo(x + innerRadius + offset, y + offset)
            ctx.lineTo(x + img.width - innerRadius - offset, y + offset)
            ctx.arcTo(x + img.width - offset, y + offset, x + img.width - offset, y + innerRadius + offset, innerRadius)
            ctx.lineTo(x + img.width - offset, y + img.height - innerRadius - offset)
            ctx.arcTo(x + img.width - offset, y + img.height - offset, x + img.width - innerRadius - offset, y + img.height - offset, innerRadius)
            ctx.lineTo(x + innerRadius + offset, y + img.height - offset)
            ctx.arcTo(x + offset, y + img.height - offset, x + offset, y + img.height - innerRadius - offset, innerRadius)
            ctx.lineTo(x + offset, y + innerRadius + offset)
            ctx.arcTo(x + offset, y + offset, x + innerRadius + offset, y + offset, innerRadius)
            ctx.closePath()
          } else {
            ctx.rect(x + offset, y + offset, img.width - offset * 2, img.height - offset * 2)
          }
        } else {
          ctx.setLineDash([])
        }

        ctx.stroke()
        ctx.setLineDash([])

        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }

      ctx.restore()
    }

    // Texte zeichnen (nach Bildern, sortiert nach zIndex)
    for (const text of [...collage.texts].sort((a, b) => a.zIndex - b.zIndex)) {
      ctx.save()
      ctx.translate(text.x, text.y)
      ctx.rotate((text.rotation * Math.PI) / 180)

      if (text.shadowEnabled) {
        ctx.shadowOffsetX = text.shadowOffsetX
        ctx.shadowOffsetY = text.shadowOffsetY
        ctx.shadowBlur = text.shadowBlur
        ctx.shadowColor = text.shadowColor
      }

      ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
      ctx.fillStyle = text.color
      ctx.textAlign = text.textAlign
      ctx.textBaseline = 'middle'
      // Buchstabenabstand (Letter Spacing)
      ctx.letterSpacing = `${text.letterSpacing ?? 0}px`

      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2

      // Stroke (Textumrandung) zeichnen, wenn aktiviert
      // Stroke wird ZUERST gezeichnet, damit der Fill darüber liegt
      if (text.strokeEnabled) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth * 2 // Verdoppeln, da die Hälfte vom Fill überdeckt wird
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2

        lines.forEach((line, index) => {
          const y = (index - (lines.length - 1) / 2) * lineHeight
          ctx.strokeText(line, 0, y)
        })
      }

      // Fill-Text zeichnen
      lines.forEach((line, index) => {
        const y = (index - (lines.length - 1) / 2) * lineHeight
        ctx.fillText(line, 0, y)
      })

      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      ctx.restore()
    }

    // Generate data URL for preview
    const mimeType =
      exportFormat.value === 'png' || exportFormat.value === 'png-transparent' ? 'image/png' :
      exportFormat.value === 'webp' ? 'image/webp' :
      'image/jpeg'

    previewDataUrl.value = canvas.toDataURL(mimeType, exportQuality.value)
    showPreviewModal.value = true
  } catch (error) {
    console.error('Preview error:', error)
    toast.error(t('toast.exportError'))
  } finally {
    isGeneratingPreview.value = false
  }
}

function closePreview() {
  showPreviewModal.value = false
  previewDataUrl.value = null
}
</script>

<template>
  <div class="w-full space-y-4">
    <h2 class="text-lg font-semibold">{{ t('export.title') }}</h2>

    <div>
      <label class="block text-sm font-medium mb-2">{{ t('export.format') }}</label>
      <select
        v-model="exportFormat"
        class="w-full px-3 py-2 rounded-lg border border-muted/50 dark:border-slate bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Export format"
      >
        <option value="png">PNG</option>
        <option value="png-transparent">{{ t('export.pngTransparent') }}</option>
        <option value="jpeg">JPEG</option>
        <option value="webp">WebP</option>
      </select>
    </div>

    <div v-if="exportFormat === 'jpeg' || exportFormat === 'webp'">
      <label class="block text-sm font-medium mb-2">
        {{ t('export.quality') }}: {{ Math.round(exportQuality * 100) }}%
      </label>
      <input
        v-model.number="exportQuality"
        type="range"
        min="0.1"
        max="1"
        step="0.05"
        class="w-full accent-accent"
        aria-label="Export quality"
      />
    </div>

    <button
      @click="generatePreview"
      :disabled="collage.images.length === 0 || isGeneratingPreview"
      class="w-full px-4 py-3 border-2 border-accent text-accent hover:bg-accent hover:text-slate-dark disabled:border-muted/50 disabled:text-muted/50 font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark flex items-center justify-center gap-2"
      aria-label="Preview collage"
    >
      <!-- loading spinner -->
      <svg
        v-if="isGeneratingPreview"
        class="w-5 h-5 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <!-- eye icon -->
      <svg
        v-else
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>{{ t('export.preview') }}</span>
    </button>

    <button
      @click="exportCollage"
      :disabled="collage.images.length === 0 || isExporting"
      class="w-full px-4 py-3 bg-accent hover:bg-accent-dark disabled:bg-muted/50 text-slate-dark font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark flex items-center justify-center gap-2"
      aria-label="Download collage"
    >
      <!-- loading spinner -->
      <svg
        v-if="isExporting"
        class="w-5 h-5 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{{ t('export.download') }}</span>
    </button>

    <button
      @click="collage.clearCollage"
      :disabled="collage.images.length === 0"
      class="w-full px-4 py-2 border border-warm text-warm hover:bg-warm/10 dark:hover:bg-warm/5 disabled:opacity-50 font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm focus:ring-offset-2 dark:focus:ring-offset-surface-dark"
      aria-label="Clear all images"
    >
      {{ t('controls.clear') }}
    </button>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="closePreview"
      >
        <div class="relative max-w-[90vw] max-h-[90vh] bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-muted/20 dark:border-slate/20">
            <h3 class="text-lg font-semibold">{{ t('export.previewTitle') }}</h3>
            <button
              @click="closePreview"
              class="p-2 rounded-lg hover:bg-muted/10 dark:hover:bg-slate/10 transition-colors"
              aria-label="Close preview"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Preview Image Container -->
          <div class="p-4 overflow-auto max-h-[calc(90vh-120px)]">
            <img
              v-if="previewDataUrl"
              :src="previewDataUrl"
              :alt="t('export.previewAlt')"
              class="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              style="max-height: calc(90vh - 180px);"
            />
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-muted/20 dark:border-slate/20 bg-muted/5 dark:bg-slate/5">
            <p class="text-sm text-muted dark:text-slate/70">
              {{ collage.settings.width }} x {{ collage.settings.height }} px
            </p>
            <div class="flex gap-2">
              <button
                @click="closePreview"
                class="px-4 py-2 border border-muted/50 dark:border-slate/50 text-muted dark:text-slate/70 hover:bg-muted/10 dark:hover:bg-slate/10 font-medium rounded-lg transition-colors"
              >
                {{ t('export.close') }}
              </button>
              <button
                @click="closePreview(); exportCollage()"
                class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark font-medium rounded-lg transition-colors"
              >
                {{ t('export.download') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
