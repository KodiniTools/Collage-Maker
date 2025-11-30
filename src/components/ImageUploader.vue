<script setup lang="ts">
import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useToastStore } from '@/stores/toast'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const toast = useToastStore()
const { t } = useI18n()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)
}

function processFiles(files: File[]) {
  const validFiles = files.filter(file => {
    const isImage = file.type.startsWith('image/')
    const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB
    return isImage && isValidSize
  })

  if (validFiles.length > 0) {
    collage.addImages(validFiles)
    toast.success(t('toast.uploadSuccess', { count: validFiles.length }))
  }
}

function openFileDialog() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-3">{{ t('upload.title') }}</h2>
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @click="openFileDialog"
      @keydown.enter="openFileDialog"
      @keydown.space.prevent="openFileDialog"
      role="button"
      tabindex="0"
      :aria-label="t('upload.dragDrop')"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
        isDragging
          ? 'border-accent bg-accent/10 dark:bg-accent/5 scale-[1.02]'
          : 'border-muted dark:border-slate hover:border-accent hover:bg-accent/5 hover:scale-[1.01]'
      ]"
    >
      <!-- upload icon -->
      <div class="flex flex-col items-center gap-2">
        <div :class="[
          'p-3 rounded-full transition-colors',
          isDragging ? 'bg-accent text-slate-dark' : 'bg-muted/20 dark:bg-slate/30 text-muted dark:text-muted-light'
        ]">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p class="text-xs text-muted dark:text-muted">{{ t('upload.formats') }}</p>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        class="hidden"
      />
    </div>
  </div>
</template>
