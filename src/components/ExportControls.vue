<script setup lang="ts">
import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

const exportFormat = ref<'png' | 'jpeg' | 'webp'>('png')
const exportQuality = ref(0.95)

async function exportCollage() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = collage.settings.width
  canvas.height = collage.settings.height

  // Background
  ctx.fillStyle = collage.settings.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

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

    // Multi-line Text-Rendering
    const lines = text.text.split('\n')
    const lineHeight = text.fontSize * 1.2

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
    exportFormat.value === 'png' ? 'image/png' :
    exportFormat.value === 'webp' ? 'image/webp' :
    'image/jpeg'
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collage-${Date.now()}.${exportFormat.value}`
    a.click()
    URL.revokeObjectURL(url)
  }, mimeType, exportQuality.value)
}
</script>

<template>
  <div class="w-full space-y-4">
    <h2 class="text-lg font-semibold">{{ t('export.title') }}</h2>
    
    <div>
      <label class="block text-sm font-medium mb-2">{{ t('export.format') }}</label>
      <select
        v-model="exportFormat"
        class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      >
        <option value="png">PNG</option>
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
        class="w-full"
      />
    </div>

    <button
      @click="exportCollage"
      :disabled="collage.images.length === 0"
      class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
    >
      {{ t('export.download') }}
    </button>

    <button
      @click="collage.clearCollage"
      :disabled="collage.images.length === 0"
      class="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 font-medium rounded-lg transition-colors"
    >
      {{ t('controls.clear') }}
    </button>
  </div>
</template>
