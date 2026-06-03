<script setup lang="ts">
  import { ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useToastStore } from '@/stores/toast'
  import { useI18n } from 'vue-i18n'
  import { compressImages } from '@/utils/imageCompression'

  const collage = useCollageStore()
  const toast = useToastStore()
  const { t } = useI18n()

  const isDragging = ref(false)
  const isProcessing = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const folderInput = ref<HTMLInputElement | null>(null)

  async function handleDrop(e: DragEvent) {
    isDragging.value = false
    const items = Array.from(e.dataTransfer?.items || [])

    // Collect files from dropped items, including folder contents
    const files: File[] = []
    const promises: Promise<void>[] = []

    for (const item of items) {
      if (item.kind !== 'file') continue
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        promises.push(collectEntryFiles(entry, files))
      } else {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    await Promise.all(promises)
    processFiles(files)
  }

  function collectEntryFiles(entry: FileSystemEntry, files: File[]): Promise<void> {
    if (entry.isFile) {
      return new Promise((resolve) => {
        ;(entry as FileSystemFileEntry).file(
          (f) => {
            files.push(f)
            resolve()
          },
          () => resolve()
        )
      })
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      return new Promise((resolve) => {
        const readAll = () => {
          reader.readEntries(
            async (entries) => {
              if (entries.length === 0) {
                resolve()
                return
              }
              await Promise.all(entries.map((e) => collectEntryFiles(e, files)))
              readAll()
            },
            () => resolve()
          )
        }
        readAll()
      })
    }
    return Promise.resolve()
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement
    processFiles(Array.from(target.files || []))
    target.value = ''
  }

  async function processFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      return file.type.startsWith('image/') && file.size <= 50 * 1024 * 1024
    })

    if (validFiles.length > 0) {
      isProcessing.value = true
      try {
        const compressedFiles = await compressImages(validFiles)
        collage.addImages(compressedFiles)
        toast.success(t('toast.uploadSuccess', { count: validFiles.length }))
      } catch {
        toast.error(t('toast.uploadError'))
      } finally {
        isProcessing.value = false
      }
    }
  }
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('upload.title') }}</h2>

    <!-- Drop zone — no @click handler, buttons below are the only triggers -->
    <div
      :aria-label="t('upload.dragDrop')"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-150',
        isDragging
          ? 'border-accent bg-accent/10 dark:bg-accent/5'
          : 'border-muted dark:border-slate hover:border-accent hover:bg-accent/5',
      ]"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          :class="[
            'p-3 rounded-full transition-colors',
            isDragging
              ? 'bg-accent text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/30 text-muted dark:text-muted-light',
          ]"
        >
          <!-- Loading spinner -->
          <svg v-if="isProcessing" class="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
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
          <!-- Upload icon -->
          <svg
            v-else
            class="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p class="text-sm text-muted dark:text-muted">
          {{ isProcessing ? t('upload.processing') : t('upload.dragDrop') }}
        </p>
        <p class="text-xs text-muted dark:text-muted">
          {{ t('upload.formats') }}
        </p>
      </div>
    </div>

    <!-- Two separate buttons below the drop zone -->
    <div class="flex gap-2 mt-3">
      <button
        type="button"
        :disabled="isProcessing"
        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent text-slate-dark hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        @click="fileInput!.click()"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4-4 4 4 4-8 4 8" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 20h16" />
        </svg>
        {{ t('upload.button') }}
      </button>

      <button
        type="button"
        :disabled="isProcessing"
        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-muted dark:border-slate text-text dark:text-text-dark hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        @click="folderInput!.click()"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
          />
        </svg>
        {{ t('upload.buttonFolder') }}
      </button>
    </div>

    <!-- Files input (no webkitdirectory) -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Folder input (webkitdirectory must be in HTML at parse time) -->
    <input
      ref="folderInput"
      type="file"
      accept="image/*"
      multiple
      webkitdirectory
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>
