import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import {
  renderCollage,
  exportToPdf,
  printCanvas,
  canvasToBlob,
  canShareFileType,
  canShareImageFiles,
  shareFile,
  canCopyImage,
  copyImageToClipboard,
} from '@/lib/export-engine'
import { useFilenamePrompt } from '@/composables/useFilenamePrompt'

export type ExportFormat = 'png' | 'png-transparent' | 'jpeg' | 'webp' | 'pdf'

/** Formate mit Qualitätsregler (verlustbehaftet bzw. PDF mit JPEG-Bild). */
const QUALITY_FORMATS: readonly ExportFormat[] = ['jpeg', 'webp', 'pdf']

/** Dateiendung zum Format (transparentes PNG bleibt `.png`). */
export function fileExtensionFor(format: ExportFormat): string {
  return format === 'png-transparent' ? 'png' : format
}

/** MIME-Typ für Canvas-Ausgabe; PDF rendert intern als JPEG. */
export function mimeTypeFor(format: ExportFormat): string {
  if (format === 'webp') return 'image/webp'
  if (format === 'png' || format === 'png-transparent') return 'image/png'
  return 'image/jpeg'
}

/**
 * Kapselt die gesamte Logik des Export-Panels (ExportControls): Format und Qualität,
 * Herunterladen (mit Dateinamen-Dialog), Vorschau, Drucken, Teilen und Kopieren.
 *
 * Wird EINMAL in ExportControls.vue aufgerufen; die Dialoge unter
 * `components/export/` bekommen Zustand und Aktionen als Props/Events.
 */
export function useCollageExport() {
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

  const hasQuality = computed(() => QUALITY_FORMATS.includes(exportFormat.value))
  const fileExtension = computed(() => fileExtensionFor(exportFormat.value))

  const filenamePrompt = useFilenamePrompt(fileExtension)

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

  async function exportCollage(filename?: string) {
    isExporting.value = true
    try {
      const canvas = await renderCollage(buildRenderOptions())
      const finalName = `${filename ?? 'collage'}.${fileExtension.value}`

      if (exportFormat.value === 'pdf') {
        await exportToPdf({ canvas, quality: exportQuality.value, filename: finalName })
        toast.notify('toast.exportSuccess', t('toast.exportSuccess'))
        return
      }

      const mimeType = mimeTypeFor(exportFormat.value)

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
    const filename = await filenamePrompt.prompt()
    if (filename === null) return
    exportCollage(filename)
  }

  async function generatePreview() {
    isGeneratingPreview.value = true
    try {
      const canvas = await renderCollage(buildRenderOptions())
      // PDF-Vorschau als JPEG anzeigen (PDF selbst hat kein dataURL-Format)
      const mimeType = exportFormat.value === 'pdf' ? 'image/jpeg' : mimeTypeFor(exportFormat.value)
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

  async function closePreviewAndExport() {
    closePreview()
    await startExport()
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

  // Teilen / Kopieren: Buttons nur anbieten, wenn der Browser es unterstützt.
  const canShare = canShareImageFiles()
  const canCopy = canCopyImage()
  const isSharing = ref(false)
  const isCopying = ref(false)
  // Datei, deren Teilen der Browser mangels Nutzeraktion blockiert hat (v. a. Safari
  // nach langem Rendern); ein zweiter Klick im Dialog teilt sie ohne neues Rendern.
  const pendingShareFile = ref<File | null>(null)

  /** Teilen nutzt das gewählte Bildformat; PDF und nicht teilbare Typen werden PNG. */
  function getShareMimeType(): string {
    if (exportFormat.value === 'pdf') return 'image/png'
    const mimeType = mimeTypeFor(exportFormat.value)
    return canShareFileType(mimeType) ? mimeType : 'image/png'
  }

  async function runShare(file: File) {
    const result = await shareFile(file, t('export.shareTitle'))
    pendingShareFile.value = result === 'blocked' ? file : null
  }

  async function shareCollage() {
    if (isSharing.value) return
    isSharing.value = true
    try {
      const canvas = await renderCollage(buildRenderOptions())
      const mimeType = getShareMimeType()
      const blob = await canvasToBlob(canvas, mimeType, exportQuality.value)
      const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
      await runShare(new File([blob], `collage.${extension}`, { type: mimeType }))
    } catch (error) {
      console.error('Share error:', error)
      toast.error(t('toast.shareError'))
    } finally {
      isSharing.value = false
    }
  }

  async function confirmPendingShare() {
    const file = pendingShareFile.value
    pendingShareFile.value = null
    if (!file) return
    try {
      await runShare(file)
    } catch (error) {
      console.error('Share error:', error)
      toast.error(t('toast.shareError'))
    }
  }

  function cancelPendingShare() {
    pendingShareFile.value = null
  }

  function copyCollage() {
    if (isCopying.value) return
    isCopying.value = true
    // Kein await vor clipboard.write: Safari verlangt den Aufruf synchron im Klick.
    // Zwischenablage nimmt nur PNG, deshalb Alpha immer erhalten.
    const pngBlob = renderCollage({ ...buildRenderOptions(), supportsAlpha: true }).then((canvas) =>
      canvasToBlob(canvas, 'image/png')
    )
    let write: Promise<void>
    try {
      write = copyImageToClipboard(pngBlob)
    } catch (error) {
      write = Promise.reject(error)
      // Render-Promise läuft weiter; der Fehler wird über `write` gemeldet.
      pngBlob.catch(() => undefined)
    }
    write
      .then(() => toast.success(t('toast.copySuccess')))
      .catch((error: unknown) => {
        console.error('Copy error:', error)
        toast.error(t('toast.copyError'))
      })
      .finally(() => {
        isCopying.value = false
      })
  }

  return {
    collage,
    // Format & Qualität
    exportFormat,
    exportQuality,
    hasQuality,
    // Herunterladen
    isExporting,
    startExport,
    filenamePrompt,
    // Vorschau
    isGeneratingPreview,
    showPreviewModal,
    previewDataUrl,
    generatePreview,
    closePreview,
    closePreviewAndExport,
    // Drucken
    isPrinting,
    printCollage,
    // Teilen & Kopieren
    canShare,
    canCopy,
    isSharing,
    isCopying,
    pendingShareFile,
    shareCollage,
    confirmPendingShare,
    cancelPendingShare,
    copyCollage,
  }
}

export type CollageExportApi = ReturnType<typeof useCollageExport>
