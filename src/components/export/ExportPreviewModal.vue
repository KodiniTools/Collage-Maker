<script setup lang="ts">
  /** Export-Vorschau (breit, deshalb kein UiDialog). Schachbrett zeigt Transparenz. */
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiIconButton } from '@/components/ui'

  defineProps<{
    open: boolean
    dataUrl: string | null
    width: number
    height: number
  }>()

  const emit = defineEmits<{
    close: []
    download: []
  }>()

  const { t } = useI18n()
</script>

<template>
  <Teleport to="#modal-portal">
    <div
      v-if="open"
      class="fixed inset-0 z-backdrop flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('close')"
    >
      <div
        class="relative max-w-[90vw] max-h-[90vh] bg-surface-1 text-ink rounded-lg border border-line shadow-overlay overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3 border-b border-line"
        >
          <h3 class="text-lg font-semibold">{{ t('export.previewTitle') }}</h3>
          <UiIconButton :label="t('export.close')" size="sm" @click="emit('close')">
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
            v-if="dataUrl"
            :src="dataUrl"
            :alt="t('export.previewAlt')"
            class="max-w-full h-auto mx-auto rounded-md"
            style="max-height: calc(90vh - 180px)"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-t border-line"
        >
          <p class="text-xs sm:text-sm text-ink-2">{{ width }} x {{ height }} px</p>
          <div class="flex gap-2 w-full sm:w-auto">
            <UiButton variant="secondary" class="flex-1 sm:flex-initial" @click="emit('close')">
              {{ t('export.close') }}
            </UiButton>
            <UiButton variant="primary" class="flex-1 sm:flex-initial" @click="emit('download')">
              {{ t('export.download') }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
