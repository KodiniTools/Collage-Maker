<script setup lang="ts">
  /**
   * Export-Panel: Format, Qualität und Aktionen. Die Logik liegt in
   * `useCollageExport`, die Dialoge unter `components/export/`.
   */
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCollageExport, type ExportFormat } from '@/composables/useCollageExport'
  import LoadingSpinner from '@/components/LoadingSpinner.vue'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import ExportFilenameDialog from '@/components/export/ExportFilenameDialog.vue'
  import ExportPreviewModal from '@/components/export/ExportPreviewModal.vue'
  import ExportShareDialog from '@/components/export/ExportShareDialog.vue'
  import { UiButton, UiPanel, UiSelect } from '@/components/ui'

  const { t } = useI18n()
  const {
    collage,
    exportFormat,
    exportQuality,
    hasQuality,
    isExporting,
    startExport,
    filenamePrompt,
    isGeneratingPreview,
    showPreviewModal,
    previewDataUrl,
    generatePreview,
    closePreview,
    closePreviewAndExport,
    isPrinting,
    printCollage,
    canShare,
    canCopy,
    isSharing,
    isCopying,
    pendingShareFile,
    shareCollage,
    confirmPendingShare,
    cancelPendingShare,
    copyCollage,
  } = useCollageExport()
  const { isOpen: showFilenameDialog, filename: customFilename, resultingFilename } = filenamePrompt

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
</script>

<template>
  <UiPanel :title="t('export.title')">
    <div class="space-y-4">
      <UiSelect v-model="formatModel" :options="formatOptions" :label="t('export.format')" />

      <!-- Regler und Zahlenfeld in Prozent (10–100), intern bleibt der Faktor 0,1–1 -->
      <ControlSlider
        v-if="hasQuality"
        :label="t('export.quality')"
        :display-value="`${Math.round(exportQuality * 100)}%`"
        :value="Math.round(exportQuality * 100)"
        :min="10"
        :max="100"
        :step="5"
        @input="exportQuality = $event / 100"
      />

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

        <div v-if="canShare || canCopy" class="flex gap-2" data-testid="share-copy-row">
          <UiButton
            v-if="canShare"
            variant="secondary"
            class="flex-1"
            :disabled="collage.images.length === 0 || isSharing"
            @click="shareCollage"
          >
            <template #icon>
              <LoadingSpinner v-if="isSharing" />
              <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </template>
            {{ t('export.share') }}
          </UiButton>
          <UiButton
            v-if="canCopy"
            variant="secondary"
            class="flex-1"
            :disabled="collage.images.length === 0 || isCopying"
            @click="copyCollage"
          >
            <template #icon>
              <LoadingSpinner v-if="isCopying" />
              <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </template>
            {{ t('export.copy') }}
          </UiButton>
        </div>

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

    <ExportFilenameDialog
      v-model:filename="customFilename"
      :open="showFilenameDialog"
      :resulting-filename="resultingFilename"
      @confirm="filenamePrompt.confirm"
      @cancel="filenamePrompt.cancel"
    />

    <ExportShareDialog
      :open="pendingShareFile !== null"
      @confirm="confirmPendingShare"
      @cancel="cancelPendingShare"
    />

    <ExportPreviewModal
      :open="showPreviewModal"
      :data-url="previewDataUrl"
      :width="collage.settings.width"
      :height="collage.settings.height"
      @close="closePreview"
      @download="closePreviewAndExport"
    />
  </UiPanel>
</template>
