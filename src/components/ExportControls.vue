<script setup lang="ts">
  import { ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useToastStore } from '@/stores/toast'
  import { useI18n } from 'vue-i18n'
  import { renderCollage, exportToPdf } from '@/lib/export-engine'

  const collage = useCollageStore()
  const toast = useToastStore()
  const { t } = useI18n()

  const exportFormat = ref<'png' | 'png-transparent' | 'jpeg' | 'webp' | 'pdf'>('png')
  const exportQuality = ref(0.95)
  const isExporting = ref(false)
  const isGeneratingPreview = ref(false)
  const showPreviewModal = ref(false)
  const previewDataUrl = ref<string | null>(null)

  function buildRenderOptions() {
    return {
      width: collage.settings.width,
      height: collage.settings.height,
      backgroundColor: collage.settings.backgroundColor,
      backgroundImage: collage.settings.backgroundImage,
      images: collage.images.filter((img) => img.isGalleryTemplate !== true),
      texts: collage.texts,
      transparent: exportFormat.value === 'png-transparent',
    }
  }

  function getMimeType(): string {
    if (exportFormat.value === 'webp') return 'image/webp'
    if (exportFormat.value === 'png' || exportFormat.value === 'png-transparent') return 'image/png'
    return 'image/jpeg'
  }

  async function exportCollage() {
    isExporting.value = true
    try {
      const canvas = await renderCollage(buildRenderOptions())

      if (exportFormat.value === 'pdf') {
        await exportToPdf({ canvas, quality: exportQuality.value })
        toast.success(t('toast.exportSuccess'))
        return
      }

      const mimeType = getMimeType()
      const fileExtension = exportFormat.value === 'png-transparent' ? 'png' : exportFormat.value

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
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
          },
          mimeType,
          exportQuality.value
        )
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
      const canvas = await renderCollage(buildRenderOptions())
      // PDF-Vorschau als JPEG anzeigen (PDF selbst hat kein dataURL-Format)
      const mimeType = exportFormat.value === 'pdf' ? 'image/jpeg' : getMimeType()
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

  function closePreviewAndExport() {
    closePreview()
    exportCollage()
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
        <option value="pdf">PDF</option>
      </select>
    </div>

    <div v-if="exportFormat === 'jpeg' || exportFormat === 'webp' || exportFormat === 'pdf'">
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
      :disabled="collage.images.length === 0 || isGeneratingPreview"
      class="w-full px-4 py-3 border-2 border-accent text-accent hover:bg-accent hover:text-slate-dark disabled:border-muted/50 disabled:text-muted/50 font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark flex items-center justify-center gap-2"
      aria-label="Preview collage"
      @click="generatePreview"
    >
      <!-- loading spinner -->
      <svg v-if="isGeneratingPreview" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
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
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>{{ t('export.preview') }}</span>
    </button>

    <button
      :disabled="collage.images.length === 0 || isExporting"
      class="w-full px-4 py-3 bg-accent hover:bg-accent-dark disabled:bg-muted/50 text-slate-dark font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark flex items-center justify-center gap-2"
      aria-label="Download collage"
      @click="exportCollage"
    >
      <!-- loading spinner -->
      <svg v-if="isExporting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span>{{ t('export.download') }}</span>
    </button>

    <button
      :disabled="collage.images.length === 0"
      class="w-full px-4 py-2 border border-warm text-warm hover:bg-warm/10 dark:hover:bg-warm/5 disabled:opacity-50 font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm focus:ring-offset-2 dark:focus:ring-offset-surface-dark"
      aria-label="Clear all images"
      @click="collage.clearCollage"
    >
      {{ t('controls.clear') }}
    </button>

    <!-- Preview Modal -->
    <Teleport to="#modal-portal">
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="closePreview"
      >
        <div
          class="relative max-w-[90vw] max-h-[90vh] bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-muted/20 dark:border-slate/20"
          >
            <h3 class="text-base sm:text-lg font-semibold">{{ t('export.previewTitle') }}</h3>
            <button
              class="p-2 rounded-lg hover:bg-muted/10 dark:hover:bg-navy/10 transition-colors"
              aria-label="Close preview"
              @click="closePreview"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Preview Image Container -->
          <div
            class="p-2 sm:p-4 overflow-auto max-h-[calc(90vh-120px)]"
            style="
              background-image: repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%);
              background-size: 20px 20px;
            "
          >
            <img
              v-if="previewDataUrl"
              :src="previewDataUrl"
              :alt="t('export.previewAlt')"
              class="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              style="max-height: calc(90vh - 180px)"
            />
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-t border-muted/20 dark:border-slate/20 bg-muted/5 dark:bg-navy/5"
          >
            <p class="text-xs sm:text-sm text-muted dark:text-slate/70">
              {{ collage.settings.width }} x {{ collage.settings.height }} px
            </p>
            <div class="flex gap-2 w-full sm:w-auto">
              <button
                class="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 border border-muted/50 dark:border-slate/50 text-muted dark:text-slate/70 hover:bg-muted/10 dark:hover:bg-navy/10 font-medium rounded-lg transition-colors text-sm"
                @click="closePreview"
              >
                {{ t('export.close') }}
              </button>
              <button
                class="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 bg-accent hover:bg-accent-dark text-slate-dark font-medium rounded-lg transition-colors text-sm"
                @click="closePreviewAndExport"
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
