<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiCallout } from '@/components/ui'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div class="space-y-3">
    <!-- Info für Mehrfachauswahl -->
    <UiCallout
      v-if="api.isMultiSelection.value"
      type="success"
      :title="t('imageControls.multiSelection', { count: api.selectedCount.value })"
    >
      {{ t('imageControls.multiSelectionHint') }}
    </UiCallout>

    <!-- Auswahl-Buttons -->
    <div class="flex gap-2">
      <UiButton variant="secondary" size="sm" class="flex-1" @click="api.selectAllImages">
        {{ t('imageControls.selectAll') }}
      </UiButton>
      <UiButton
        v-if="api.selectedCount.value > 0"
        variant="secondary"
        size="sm"
        class="flex-1"
        @click="api.deselectAll"
      >
        {{ t('imageControls.deselectAll') }}
      </UiButton>
    </div>
  </div>
</template>
