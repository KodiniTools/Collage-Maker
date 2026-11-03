<script setup lang="ts">
  /**
   * Teilen erneut bestätigen: Der Browser hat das Teilen nach dem Rendern blockiert
   * (fehlende Nutzeraktion, v. a. Safari); ein zweiter Klick teilt die fertige Datei.
   */
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiDialog } from '@/components/ui'

  defineProps<{ open: boolean }>()

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const { t } = useI18n()
</script>

<template>
  <UiDialog
    teleport-to="#modal-portal"
    :open="open"
    :title="t('export.shareReadyTitle')"
    :description="t('export.shareReadyText')"
    :close-label="t('common.close')"
    @close="emit('cancel')"
  >
    <template #footer>
      <UiButton variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton variant="primary" @click="emit('confirm')">
        {{ t('export.share') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
