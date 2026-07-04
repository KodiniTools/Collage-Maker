<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useImageControls } from '@/composables/useImageControls'
  import SelectionBanner from './image-controls/SelectionBanner.vue'
  import SizePositionControls from './image-controls/SizePositionControls.vue'
  import AdjustControls from './image-controls/AdjustControls.vue'
  import FilterControls from './image-controls/FilterControls.vue'
  import BorderControls from './image-controls/BorderControls.vue'
  import ShadowControls from './image-controls/ShadowControls.vue'
  import LayerControls from './image-controls/LayerControls.vue'

  const { t } = useI18n()
  const api = useImageControls()
</script>

<template>
  <div
    class="bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
  >
    <h3 class="text-lg font-semibold mb-4">{{ t('imageControls.title') }}</h3>

    <!-- Auswahl vorhanden -->
    <div v-if="api.selectedCount.value > 0" class="space-y-4">
      <!-- Mehrfachauswahl-Banner + Auswahl-Buttons -->
      <SelectionBanner :api="api" />

      <!-- Größe & Position (nur bei Einzelauswahl) -->
      <SizePositionControls
        v-if="!api.isMultiSelection.value && api.selectedImage.value"
        :image="api.selectedImage.value"
        :api="api"
      />

      <!-- Rotation, Deckkraft & Eckenradius -->
      <AdjustControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Bildbearbeitungs-Filter -->
      <FilterControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Rahmen -->
      <BorderControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Schatten -->
      <ShadowControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Ebenen (Z-Index) -->
      <LayerControls :api="api" />

      <!-- Zurücksetzen -->
      <button
        class="w-full px-4 py-2 bg-warm hover:bg-warm-dark text-surface-light rounded-md font-medium"
        @click="api.resetImageChanges"
      >
        {{ t('imageControls.resetChanges') }}
      </button>

      <!-- Löschen -->
      <button
        class="w-full px-4 py-2 bg-warm hover:bg-warm-dark text-surface-light rounded-md font-medium"
        @click="api.deleteImage"
      >
        {{
          api.isMultiSelection.value
            ? t('imageControls.deleteMultiple', { count: api.selectedCount.value })
            : t('imageControls.delete')
        }}
      </button>
    </div>

    <div v-else class="text-center text-muted py-8">
      <p>{{ t('imageControls.noSelection') }}</p>
      <p class="text-xs mt-2">{{ t('imageControls.ctrlClickHint') }}</p>
    </div>
  </div>
</template>
