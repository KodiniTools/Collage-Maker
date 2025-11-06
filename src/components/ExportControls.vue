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
    ctx.drawImage(htmlImg, -img.width / 2, -img.height / 2, img.width, img.height)
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
