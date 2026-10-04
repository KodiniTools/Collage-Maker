<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useImageControls } from '@/composables/useImageControls'
  import { UiButton, UiEmptyState, UiPanel } from '@/components/ui'
  import SelectionBanner from './image-controls/SelectionBanner.vue'
  import SizePositionControls from './image-controls/SizePositionControls.vue'
  import AdjustControls from './image-controls/AdjustControls.vue'
  import TransformControls from './image-controls/TransformControls.vue'
  import FilterControls from './image-controls/FilterControls.vue'
  import BorderControls from './image-controls/BorderControls.vue'
  import ShadowControls from './image-controls/ShadowControls.vue'
  import LayerControls from './image-controls/LayerControls.vue'
  import AlignControls from './image-controls/AlignControls.vue'

  const { t } = useI18n()
  const api = useImageControls()
</script>

<template>
  <UiPanel :title="t('imageControls.title')">
    <!-- Auswahl vorhanden -->
    <div v-if="api.selectedCount.value > 0" class="space-y-4">
      <!-- Mehrfachauswahl-Banner + Auswahl-Buttons -->
      <SelectionBanner :api="api" />

      <!-- Ausrichten & Verteilen (nur bei Mehrfachauswahl) -->
      <AlignControls v-if="api.isMultiSelection.value" :api="api" />

      <!-- Größe & Position (nur bei Einzelauswahl) -->
      <SizePositionControls
        v-if="!api.isMultiSelection.value && api.selectedImage.value"
        :image="api.selectedImage.value"
        :api="api"
      />

      <!-- Rotation, Deckkraft & Eckenradius -->
      <AdjustControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Transformation: Spiegelung & Neigung (klappbar) -->
      <TransformControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Bildbearbeitungs-Filter -->
      <FilterControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Rahmen -->
      <BorderControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Schatten -->
      <ShadowControls v-if="api.displayImage.value" :image="api.displayImage.value" :api="api" />

      <!-- Ebenen (Z-Index) -->
      <LayerControls :api="api" />

      <!-- Zurücksetzen & Löschen: destruktiv, deshalb textbasiert -->
      <div class="flex flex-col gap-1 border-t border-line pt-4">
        <UiButton variant="danger" block @click="api.resetImageChanges">
          {{ t('imageControls.resetChanges') }}
        </UiButton>
        <UiButton variant="danger" block @click="api.deleteImage">
          {{
            api.isMultiSelection.value
              ? t('imageControls.deleteMultiple', { count: api.selectedCount.value })
              : t('imageControls.delete')
          }}
        </UiButton>
      </div>
    </div>

    <UiEmptyState
      v-else
      :title="t('imageControls.noSelection')"
      :text="t('imageControls.ctrlClickHint')"
    />
  </UiPanel>
</template>
