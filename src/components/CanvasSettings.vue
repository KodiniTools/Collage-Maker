<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useCanvasSettings } from '@/composables/useCanvasSettings'
  import { UiPanel } from '@/components/ui'
  import CanvasSizeControls from './canvas-settings/CanvasSizeControls.vue'
  import CanvasCornerRadius from './canvas-settings/CanvasCornerRadius.vue'
  import CanvasBorderControls from './canvas-settings/CanvasBorderControls.vue'
  import CanvasBackgroundColor from './canvas-settings/CanvasBackgroundColor.vue'
  import CanvasBackgroundImage from './canvas-settings/CanvasBackgroundImage.vue'
  import CanvasZoomControl from './canvas-settings/CanvasZoomControl.vue'
  import CanvasGridControls from './canvas-settings/CanvasGridControls.vue'

  const { t } = useI18n()
  const api = useCanvasSettings()
</script>

<template>
  <UiPanel :title="t('canvas.size')">
    <div class="space-y-4">
      <!-- Größe: Seitenverhältnis, Inhalts-Skalierung, Breite & Höhe -->
      <CanvasSizeControls :api="api" />

      <!-- Ecken abrunden -->
      <CanvasCornerRadius :api="api" />

      <!-- Canvas-Rahmen -->
      <CanvasBorderControls :api="api" />

      <!-- Hintergrundfarbe -->
      <CanvasBackgroundColor :api="api" />

      <!-- Hintergrundbild -->
      <CanvasBackgroundImage :api="api" />

      <!-- Zoom & Ansicht -->
      <CanvasZoomControl :api="api" />

      <!-- Hilfsraster -->
      <CanvasGridControls :api="api" />
    </div>
  </UiPanel>
</template>
