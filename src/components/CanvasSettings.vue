<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useCanvasSettings } from '@/composables/useCanvasSettings'
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
  <div
    class="w-full bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
  >
    <h2 class="text-lg font-semibold mb-4">{{ t('canvas.size') }}</h2>

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
  </div>
</template>
