<script setup lang="ts">
  /** Wiederherstellungsdialog der automatischen Speicherung. */
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiDialog } from '@/components/ui'

  defineProps<{ open: boolean; saveDate: Date | null }>()
  const emit = defineEmits<{ restore: []; discard: []; continue: [] }>()
  const { t } = useI18n()
</script>

<template>
  <UiDialog
    teleport-to="#modal-portal"
    :open="open"
    :title="t('autoSave.restoreTitle')"
    :description="t('autoSave.restoreDescription')"
    :close-label="t('common.close')"
    @close="emit('continue')"
  >
    <p v-if="saveDate" class="text-sm text-ink-2">
      {{ t('autoSave.savedAt') }}: {{ saveDate.toLocaleString() }}
    </p>
    <template #footer>
      <UiButton variant="danger" @click="emit('discard')">
        {{ t('autoSave.discard') }}
      </UiButton>
      <UiButton variant="secondary" @click="emit('continue')">
        {{ t('autoSave.continueWithout') }}
      </UiButton>
      <UiButton variant="primary" @click="emit('restore')">
        {{ t('autoSave.restore') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
