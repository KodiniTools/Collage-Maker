<script setup lang="ts">
  /**
   * Textbearbeitung. Die Logik liegt in `useTextControls`, die Abschnitte unter
   * `components/text-controls/`.
   */
  import { useI18n } from 'vue-i18n'
  import { useTextControls } from '@/composables/useTextControls'
  import { UiButton, UiEmptyState, UiPanel } from '@/components/ui'
  import TextTypographyControls from './text-controls/TextTypographyControls.vue'
  import TextColorControl from './text-controls/TextColorControl.vue'
  import TextShadowControls from './text-controls/TextShadowControls.vue'
  import TextStrokeControls from './text-controls/TextStrokeControls.vue'

  const { t } = useI18n()
  const api = useTextControls()
  const { collage, deleteText } = api
</script>

<template>
  <UiPanel :title="t('text.title')">
    <UiEmptyState v-if="!collage.selectedText" :title="t('text.noSelection')" />

    <div v-else class="space-y-4">
      <!-- Inhalt, Schrift, Größe, Laufweite, Fett & Ausrichtung -->
      <TextTypographyControls :text="collage.selectedText" :api="api" />

      <!-- Text Color -->
      <TextColorControl :text="collage.selectedText" :api="api" />

      <!-- Shadow Controls -->
      <TextShadowControls :text="collage.selectedText" :api="api" />

      <!-- Stroke (Textumrandung) Controls -->
      <TextStrokeControls :text="collage.selectedText" :api="api" />

      <!-- Delete: destruktiv, deshalb textbasiert -->
      <UiButton variant="danger" block @click="deleteText">
        {{ t('text.delete') }}
      </UiButton>
    </div>
  </UiPanel>
</template>
