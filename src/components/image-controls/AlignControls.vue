<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiIconButton } from '@/components/ui'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props

  // Verteilen benötigt mindestens 3 Bilder
  const canDistribute = () => api.selectedCount.value >= 3
</script>

<template>
  <div>
    <span class="block text-sm font-medium mb-2">{{ t('imageControls.align') }}</span>

    <!-- Ausrichten -->
    <div class="flex flex-wrap gap-1.5 mb-2">
      <UiIconButton
        :label="t('imageControls.alignLeft')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('left')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M4 4v16M8 8h9M8 16h5" />
        </svg>
      </UiIconButton>
      <UiIconButton
        :label="t('imageControls.alignCenterH')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('center-h')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M12 4v16M7 8h10M9 16h6" />
        </svg>
      </UiIconButton>
      <UiIconButton
        :label="t('imageControls.alignRight')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('right')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M20 4v16M7 8h9M12 16h4" />
        </svg>
      </UiIconButton>
      <UiIconButton
        :label="t('imageControls.alignTop')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('top')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M4 4h16M8 8v9M16 8v5" />
        </svg>
      </UiIconButton>
      <UiIconButton
        :label="t('imageControls.alignMiddleV')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('middle-v')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M4 12h16M8 7v10M16 9v6" />
        </svg>
      </UiIconButton>
      <UiIconButton
        :label="t('imageControls.alignBottom')"
        variant="secondary"
        size="sm"
        @click="api.alignImages('bottom')"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" d="M4 20h16M8 7v10M16 11v6" />
        </svg>
      </UiIconButton>
    </div>

    <!-- Verteilen (ab 3 Bildern) -->
    <div class="grid grid-cols-2 gap-1.5">
      <UiButton
        variant="secondary"
        size="sm"
        :disabled="!canDistribute()"
        :title="t('imageControls.distributeHorizontal')"
        @click="api.distributeImages('horizontal')"
      >
        <template #icon>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" d="M4 5v14M20 5v14M11 8v8" />
          </svg>
        </template>
        {{ t('imageControls.distributeH') }}
      </UiButton>
      <UiButton
        variant="secondary"
        size="sm"
        :disabled="!canDistribute()"
        :title="t('imageControls.distributeVertical')"
        @click="api.distributeImages('vertical')"
      >
        <template #icon>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" d="M5 4h14M5 20h14M8 11h8" />
          </svg>
        </template>
        {{ t('imageControls.distributeV') }}
      </UiButton>
    </div>
  </div>
</template>
