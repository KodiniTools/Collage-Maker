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

  // Render images
  const loadedImages = new Map<string, HTMLImageElement>()
  
  for (const img of [...collage.images].sort((a, b) => a.zIndex - b.zIndex)) {
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

    // Schatten anwenden, wenn aktiviert
    if (img.shadowEnabled) {
      ctx.shadowOffsetX = img.shadowOffsetX
      ctx.shadowOffsetY = img.shadowOffsetY
      ctx.shadowBlur = img.shadowBlur
      ctx.shadowColor = img.shadowColor
    }

    // Clip-Pfad mit abgerundeten Ecken erstellen
    const x = -img.width / 2
    const y = -img.height / 2
    const radius = Math.min(img.borderRadius, img.width / 2, img.height / 2)

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

    ctx.drawImage(htmlImg, x, y, img.width, img.height)

    // Schatten nur zurücksetzen, wenn weder Border noch abgerundete Ecken mit Schatten vorhanden sind
    // Damit der Bildschatten auch auf den Border/abgerundeten Rand angewendet wird
    const needsShadowOnBorder = img.borderEnabled || (radius > 0 && img.shadowEnabled)
    if (!needsShadowOnBorder || img.borderShadowEnabled) {
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
    }

    // Border oder Schatten-Rand zeichnen (bei aktiviertem Border oder abgerundeten Ecken mit Schatten)
    if (img.borderEnabled || (radius > 0 && img.shadowEnabled)) {
      // Border-Shadow anwenden (falls aktiviert) - überschreibt Bildschatten
      if (img.borderShadowEnabled) {
        ctx.shadowOffsetX = img.borderShadowOffsetX
        ctx.shadowOffsetY = img.borderShadowOffsetY
        ctx.shadowBlur = img.borderShadowBlur
        ctx.shadowColor = img.borderShadowColor
      }
      // Sonst bleibt der Bildschatten aktiv (falls er aktiviert war)

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

      // Wenn kein Border aktiviert ist, zeichnen wir einen unsichtbaren Rand nur für den Schatten
      if (!img.borderEnabled && radius > 0 && img.shadowEnabled) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.01)' // Fast transparent
        ctx.lineWidth = 1
        ctx.setLineDash([])
      } else {
        // Normaler Border
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
