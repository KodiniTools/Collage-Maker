import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { useI18n } from 'vue-i18n'
import { compressImages } from '@/utils/imageCompression'

export function useClipboardPaste() {
  const collage = useCollageStore()
  const toast = useToastStore()
  const { t } = useI18n()

  async function handlePaste(e: ClipboardEvent) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const items = Array.from(e.clipboardData?.items ?? [])
    const imageFiles = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => {
        const file = item.getAsFile()
        if (!file) return null
        return new File([file], `paste-${Date.now()}.${file.type.split('/')[1] || 'png'}`, {
          type: file.type,
        })
      })
      .filter((f): f is File => f !== null)

    if (imageFiles.length === 0) return

    e.preventDefault()

    try {
      const compressed = await compressImages(imageFiles)
      collage.addImages(compressed)
      toast.success(t('toast.pasteSuccess', { count: imageFiles.length }))
    } catch {
      toast.error(t('toast.uploadError'))
    }
  }

  function setupClipboardListener() {
    window.addEventListener('paste', handlePaste)
  }

  function cleanupClipboardListener() {
    window.removeEventListener('paste', handlePaste)
  }

  return { setupClipboardListener, cleanupClipboardListener }
}
