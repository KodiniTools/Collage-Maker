<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props

  // Verteilen benötigt mindestens 3 Bilder
  const canDistribute = () => api.selectedCount.value >= 3
</script>

<template>
  <div>
    <label class="block text-sm font-medium mb-2">{{ t('imageControls.align') }}</label>

    <!-- Ausrichten -->
    <div class="grid grid-cols-6 gap-1.5 mb-2">
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignLeft')"
        :aria-label="t('imageControls.alignLeft')"
        @click="api.alignImages('left')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 4v16M8 8h9M8 16h5" />
        </svg>
      </button>
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignCenterH')"
        :aria-label="t('imageControls.alignCenterH')"
        @click="api.alignImages('center-h')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M12 4v16M7 8h10M9 16h6" />
        </svg>
      </button>
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignRight')"
        :aria-label="t('imageControls.alignRight')"
        @click="api.alignImages('right')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M20 4v16M7 8h9M12 16h4" />
        </svg>
      </button>
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignTop')"
        :aria-label="t('imageControls.alignTop')"
        @click="api.alignImages('top')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 4h16M8 8v9M16 8v5" />
        </svg>
      </button>
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignMiddleV')"
        :aria-label="t('imageControls.alignMiddleV')"
        @click="api.alignImages('middle-v')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 12h16M8 7v10M16 9v6" />
        </svg>
      </button>
      <button
        class="flex items-center justify-center px-2 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 rounded-md"
        :title="t('imageControls.alignBottom')"
        :aria-label="t('imageControls.alignBottom')"
        @click="api.alignImages('bottom')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 20h16M8 7v10M16 11v6" />
        </svg>
      </button>
    </div>

    <!-- Verteilen (ab 3 Bildern) -->
    <div class="grid grid-cols-2 gap-1.5">
      <button
        class="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canDistribute()"
        :title="t('imageControls.distributeHorizontal')"
        @click="api.distributeImages('horizontal')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 5v14M20 5v14M11 8v8" />
        </svg>
        {{ t('imageControls.distributeH') }}
      </button>
      <button
        class="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs bg-muted/30 hover:bg-muted/50 dark:bg-navy/50 dark:hover:bg-navy/70 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canDistribute()"
        :title="t('imageControls.distributeVertical')"
        @click="api.distributeImages('vertical')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M5 4h14M5 20h14M8 11h8" />
        </svg>
        {{ t('imageControls.distributeV') }}
      </button>
    </div>
  </div>
</template>
