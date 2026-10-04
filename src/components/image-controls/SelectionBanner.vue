<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div>
    <!-- Info-Banner für Mehrfachauswahl -->
    <div v-if="api.isMultiSelection.value" class="bg-accent-soft border rounded-md p-3 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="font-medium text-sm">
            {{ t('imageControls.multiSelection', { count: api.selectedCount.value }) }}
          </span>
        </div>
        <button class="text-xs text-ink-2 hover:text-ink underline" @click="api.deselectAll">
          {{ t('imageControls.deselectAll') }}
        </button>
      </div>
      <p class="text-xs text-ink-2 mt-1">
        {{ t('imageControls.multiSelectionHint') }}
      </p>
    </div>

    <!-- Auswahl-Buttons -->
    <div class="flex gap-2 mb-4">
      <button
        class="flex-1 px-3 py-2 text-xs bg-surface-2 hover:bg-surface-3 rounded-sm transition-colors"
        @click="api.selectAllImages"
      >
        {{ t('imageControls.selectAll') }}
      </button>
      <button
        v-if="api.selectedCount.value > 0"
        class="flex-1 px-3 py-2 text-xs bg-surface-2 hover:bg-surface-3 rounded-sm transition-colors"
        @click="api.deselectAll"
      >
        {{ t('imageControls.deselectAll') }}
      </button>
    </div>
  </div>
</template>
