<script setup lang="ts">
  /** Bestätigung beim Löschen aus der Bilderliste (einzeln oder Auswahl), mit „Nicht mehr fragen". */
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiDialog, UiSwitch } from '@/components/ui'
  import type { ImageListApi } from '@/composables/useImageList'

  const props = defineProps<{ api: ImageListApi }>()
  const { t } = useI18n()
  const {
    selectedCount,
    showDeleteConfirm,
    deleteMode,
    imageToDelete,
    dontAskAgain,
    deleteInstanceCount,
    deleteAffectsBackground,
    cancelDelete,
    confirmDelete,
  } = props.api
</script>

<template>
  <!-- Delete Confirmation -->
  <UiDialog
    teleport-to="#modal-portal"
    :open="showDeleteConfirm"
    :title="
      deleteMode === 'single'
        ? t('gallery.deleteConfirmTitle')
        : t('gallery.deleteSelectedConfirmTitle', { count: selectedCount })
    "
    :description="
      deleteMode === 'single'
        ? t('gallery.deleteConfirmMessage')
        : t('gallery.deleteSelectedConfirmMessage')
    "
    :close-label="t('common.close')"
    @close="cancelDelete"
  >
    <div class="space-y-3">
      <p v-if="deleteMode === 'single' && imageToDelete" class="text-sm text-ink break-words">
        {{ imageToDelete.file.name }}
      </p>
      <p v-if="deleteInstanceCount > 0" class="text-sm text-danger font-medium">
        {{ t('gallery.deleteConfirmOnCanvas', { count: deleteInstanceCount }) }}
      </p>
      <p v-if="deleteAffectsBackground" class="text-sm text-danger font-medium">
        {{ t('gallery.deleteConfirmBackground') }}
      </p>
      <UiSwitch v-model="dontAskAgain" :label="t('gallery.dontAskAgain')" />
    </div>
    <template #footer>
      <UiButton variant="secondary" @click="cancelDelete">
        {{ t('gallery.deleteConfirmCancel') }}
      </UiButton>
      <UiButton variant="danger" @click="confirmDelete">
        {{ t('gallery.deleteConfirmConfirm') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
