<script setup lang="ts">
  /**
   * Dateinamen-Dialog vor dem Herunterladen. Zustand und Aktionen kommen aus
   * `useFilenamePrompt` (über `useCollageExport`).
   */
  import { nextTick, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiDialog, UiTextField } from '@/components/ui'

  const props = defineProps<{
    open: boolean
    /** Vorschau des vollständigen Dateinamens inkl. Endung. */
    resultingFilename: string
  }>()

  const filename = defineModel<string>('filename', { required: true })

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const { t } = useI18n()

  const FILENAME_INPUT_ID = 'export-filename'

  // Zwei Ticks: UiDialog setzt beim Öffnen zuerst den Fokus auf den Dialog selbst.
  watch(
    () => props.open,
    async (open) => {
      if (!open) return
      await nextTick()
      await nextTick()
      const input = document.getElementById(FILENAME_INPUT_ID)
      if (input instanceof HTMLInputElement) input.select()
    }
  )
</script>

<template>
  <UiDialog
    teleport-to="#modal-portal"
    :open="open"
    :title="t('export.filenameDialogTitle')"
    :close-label="t('common.close')"
    @close="emit('cancel')"
  >
    <UiTextField
      :id="FILENAME_INPUT_ID"
      v-model="filename"
      :label="t('export.filenameLabel')"
      :hint="resultingFilename"
      @keydown.enter="emit('confirm')"
    />
    <template #footer>
      <UiButton variant="secondary" @click="emit('cancel')">
        {{ t('export.filenameCancel') }}
      </UiButton>
      <UiButton variant="primary" @click="emit('confirm')">
        {{ t('export.filenameConfirm') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
