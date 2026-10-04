<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useToastStore } from '@/stores/toast'
  import { useI18n } from 'vue-i18n'
  import { renderCollage, exportToPdf, printCanvas } from '@/lib/export-engine'
  import LoadingSpinner from '@/components/LoadingSpinner.vue'
  import { UiButton, UiDialog, UiIconButton, UiPanel, UiSelect, UiTextField } from '@/components/ui'

  type ExportFormat = 'png' | 'png-transparent' | 'jpeg' | 'webp' | 'pdf'

  const collage = useCollageStore()
  const toast = useToastStore()
  const { t } = useI18n()

  const exportFormat = ref<ExportFormat>('png')
  const exportQuality = ref(0.95)
  const isExporting = ref(false)
  const isPrinting = ref(false)
  const isGeneratingPreview = ref(false)
  const showPreviewModal = ref(false)
  const previewDataUrl = ref<string | null>(null)

  // UiSelect arbeitet mit string; der Proxy hält den Union-Typ im State.
  const formatModel = computed({
    get: () => exportFormat.value as string,
    set: (value) => {
      exportFormat.value = value as ExportFormat
    },
  })
  const formatOptions = computed(() => [
    { value: 'png', label: 'PNG' },
    { value: 'png-transparent', label: t('export.pngTransparent') },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
    { value: 'pdf', label: 'PDF' },
  ])
  const hasQuality = computed(() => ['jpeg', 'webp', 'pdf'].includes(exportFormat.value))

  // Filename dialog state
  const FILENAME_INPUT_ID = 'export-filename'
  const showFilenameDialog = ref(false)
  const customFilename = ref('collage')
  let resolveFilename: ((name: string | null) => void) | null = null

  const resultingFilename = computed(
    () => `${customFilename.value.trim() || 'collage'}.${getFileExtension()}`
  )

  function getFileExtension(): string {
    return exportFormat.value === 'png-transparent' ? 'png' : exportFormat.value
  }

  async function focusFilenameInput() {
    // Zwei Ticks: UiDialog setzt beim Öffnen zuerst den Fokus auf den Dialog selbst.
    await nextTick()
    await nextTick()
    const input = document.getElementById(FILENAME_INPUT_ID)
    if (input instanceof HTMLInputElement) input.select()
  }

  function promptFilename(): Promise<string | null> {
    customFilename.value = 'collage'
    showFilenameDialog.value = true
    void focusFilenameInput()
    return new Promise((resolve) => {
      resolveFilename = resolve
    })
  }

  function confirmFilename() {
    const name = customFilename.value.trim() || 'collage'
    showFilenameDialog.value = false
    resolveFilename?.(name)
    resolveFilename = null
  }

  function cancelFilename() {
    showFilenameDialog.value = false
    resolveFilename?.(null)
    resolveFilename = null
  }

  function buildRenderOptions() {
    return {
      width: collage.settings.width,
      height: collage.settings.height,
      backgroundColor: collage.settings.backgroundColor,
      backgroundImage: collage.settings.backgroundImage,
      images: collage.images.filter((img) => img.isGalleryTemplate !== true),
      texts: collage.texts,
      transparent: exportFormat.value === 'png-transparent',
      // Nur JPEG hat keinen Alpha-Kanal; alle anderen Formate (PNG, WebP, PDF)
      // behalten abgerundete Ecken transparent, wie im Live-Editor.
      supportsAlpha: exportFormat.value !== 'jpeg',
      border: collage.settings.border,
      cornerRadius: collage.settings.cornerRadius,
    }
  }

  function getMimeType(): string {
    if (exportFormat.value === 'webp') return 'image/webp'
    if (exportFormat.value === 'png' || exportFormat.value === 'png-transparent') return 'image/png'
    return 'image/jpeg'
  }

  async function exportCollage(filename?: string) {
    isExporting.value = true
    try {
      const canvas = await renderCollage(buildRenderOptions())
      const fileExtension = getFileExtension()
      const finalName = `${filename ?? 'collage'}.${fileExtension}`

      if (exportFormat.value === 'pdf') {
        await exportToPdf({ canvas, quality: exportQuality.value, filename: finalName })
        toast.notify('toast.exportSuccess', t('toast.exportSuccess'))
        return
      }

      const mimeType = getMimeType()

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
            a.download = finalName
            a.click()
            URL.revokeObjectURL(url)
            resolve()
          },
          mimeType,
          exportQuality.value
        )
      })

      toast.notify('toast.exportSuccess', t('toast.exportSuccess'))
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('toast.exportError'))
    } finally {
      isExporting.value = false
    }
  }

  async function startExport() {
    const filename = await promptFilename()
    if (filename === null) return
    exportCollage(filename)
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

  async function printCollage() {
    if (isPrinting.value) return
    isPrinting.value = true
    try {
      // Druck zeigt die Collage wie im Editor: Hintergrund wird immer mitgedruckt,
      // abgerundete Ecken bleiben transparent (weißes Papier).
      const canvas = await renderCollage({
        ...buildRenderOptions(),
        transparent: false,
        supportsAlpha: true,
      })
      await printCanvas(canvas, { title: 'Collage' })
    } catch (error) {
      console.error('Print error:', error)
      toast.error(t('toast.printError'))
    } finally {
      isPrinting.value = false
    }
  }

  function closePreview() {
    showPreviewModal.value = false
    previewDataUrl.value = null
  }

  async function closePreviewAndExport() {
    closePreview()
    const filename = await promptFilename()
    if (filename === null) return
    exportCollage(filename)
  }
</script>

<template>
  <UiPanel :title="t('export.title')">
    <div class="space-y-4">
      <UiSelect v-model="formatModel" :options="formatOptions" :label="t('export.format')" />

      <div v-if="hasQuality">
        <label for="export-quality" class="block text-sm font-medium mb-2">
          {{ t('export.quality') }}: {{ Math.round(exportQuality * 100) }}%
        </label>
        <input
          id="export-quality"
          v-model.number="exportQuality"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2">
        <UiButton
          variant="secondary"
          block
          :disabled="collage.images.length === 0 || isGeneratingPreview"
          @click="generatePreview"
        >
          <template #icon>
            <LoadingSpinner v-if="isGeneratingPreview" />
            <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </template>
          {{ t('export.preview') }}
        </UiButton>

        <UiButton
          variant="primary"
          block
          :disabled="collage.images.length === 0 || isExporting"
          @click="startExport"
        >
          <template v-if="isExporting" #icon>
            <LoadingSpinner />
          </template>
          {{ t('export.download') }}
        </UiButton>

        <UiButton
          variant="secondary"
          block
          :disabled="collage.images.length === 0 || isPrinting"
          @click="printCollage"
        >
          <template #icon>
            <LoadingSpinner v-if="isPrinting" />
            <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </template>
          {{ t('export.print') }}
        </UiButton>

        <UiButton
          variant="danger"
          block
          :disabled="collage.images.length === 0"
          @click="collage.clearCollage"
        >
          {{ t('controls.clear') }}
        </UiButton>
      </div>
    </div>

    <!-- Filename Dialog -->
    <UiDialog
      teleport-to="#modal-portal"
      :open="showFilenameDialog"
      :title="t('export.filenameDialogTitle')"
      :close-label="t('common.close')"
      @close="cancelFilename"
    >
      <UiTextField
        :id="FILENAME_INPUT_ID"
        v-model="customFilename"
        :label="t('export.filenameLabel')"
        :hint="resultingFilename"
        @keydown.enter="confirmFilename"
      />
      <template #footer>
        <UiButton variant="secondary" @click="cancelFilename">
          {{ t('export.filenameCancel') }}
        </UiButton>
        <UiButton variant="primary" @click="confirmFilename">
          {{ t('export.filenameConfirm') }}
        </UiButton>
      </template>
    </UiDialog>

    <!-- Preview Modal (breit, deshalb kein UiDialog) -->
    <Teleport to="#modal-portal">
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-backdrop flex items-center justify-center p-4 bg-black/50"
        @click.self="closePreview"
      >
        <div
          class="relative max-w-[90vw] max-h-[90vh] bg-surface-1 text-ink rounded-lg border border-line shadow-overlay overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3 border-b border-line"
          >
            <h3 class="text-lg font-semibold">{{ t('export.previewTitle') }}</h3>
            <UiIconButton :label="t('export.close')" size="sm" @click="closePreview">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiIconButton>
          </div>

          <!-- Preview Image Container (Schachbrett zeigt Transparenz) -->
          <div
            class="p-2 sm:p-4 overflow-auto max-h-[calc(90vh-120px)]"
            style="
              background-image: repeating-conic-gradient(
                var(--ds-surface-3) 0% 25%,
                var(--ds-surface-1) 0% 50%
              );
              background-size: 20px 20px;
            "
          >
            <img
              v-if="previewDataUrl"
              :src="previewDataUrl"
              :alt="t('export.previewAlt')"
              class="max-w-full h-auto mx-auto rounded-md"
              style="max-height: calc(90vh - 180px)"
            />
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-t border-line"
          >
            <p class="text-xs sm:text-sm text-ink-2">
              {{ collage.settings.width }} x {{ collage.settings.height }} px
            </p>
            <div class="flex gap-2 w-full sm:w-auto">
              <UiButton variant="secondary" class="flex-1 sm:flex-initial" @click="closePreview">
                {{ t('export.close') }}
              </UiButton>
              <UiButton
                variant="primary"
                class="flex-1 sm:flex-initial"
                @click="closePreviewAndExport"
              >
                {{ t('export.download') }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </UiPanel>
</template>
