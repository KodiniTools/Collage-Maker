<script setup lang="ts">
  /** Inhalt, Schriftart, Größe, Laufweite, Fett und Ausrichtung. */
  import { useI18n } from 'vue-i18n'
  import ControlSlider from '@/components/image-controls/ControlSlider.vue'
  import { UiIconButton, UiSegmentedControl } from '@/components/ui'
  import type { CollageText } from '@/types'
  import type { TextControlsApi } from '@/composables/useTextControls'

  const props = defineProps<{ text: CollageText; api: TextControlsApi }>()
  const { t } = useI18n()
  const {
    systemFonts,
    availableFonts,
    selectedFontFamily,
    updateFontFamily,
    updateTextContent,
    updateFontSize,
    updateLetterSpacing,
    isBold,
    toggleFontWeight,
    alignOptions,
    alignModel,
  } = props.api
</script>

<template>
  <div class="space-y-4">
    <!-- Text Content -->
    <div>
      <label for="text-content" class="block text-sm font-medium mb-2">
        {{ t('text.content') }}
      </label>
      <textarea
        id="text-content"
        :value="text.text"
        rows="3"
        class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm resize-none focus-visible:outline-none focus-visible:shadow-focus"
        @input="updateTextContent(($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <!-- Font Family: natives Select wegen <optgroup> -->
    <div>
      <label for="text-font" class="block text-sm font-medium mb-2">
        {{ t('text.fontFamily') }}
      </label>
      <select
        id="text-font"
        v-model="selectedFontFamily"
        class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
        @change="updateFontFamily(selectedFontFamily)"
      >
        <optgroup label="System Fonts">
          <option v-for="font in systemFonts" :key="font" :value="font">
            {{ font }}
          </option>
        </optgroup>
        <optgroup v-if="availableFonts.length > 0" label="Custom Fonts">
          <option
            v-for="font in availableFonts"
            :key="font"
            :value="font"
            :style="{ fontFamily: `'${font}'` }"
          >
            {{ font }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Font Size -->
    <ControlSlider
      :label="t('text.fontSize')"
      :display-value="`${Math.round(text.fontSize)}px`"
      :value="text.fontSize"
      :min="12"
      :max="2000"
      :step="2"
      :show-reset="text.fontSize !== 48"
      :reset-title="t('imageControls.resetValue')"
      @input="updateFontSize"
      @reset="updateFontSize(48)"
    />

    <!-- Letter Spacing -->
    <ControlSlider
      :label="t('text.letterSpacing')"
      :display-value="`${text.letterSpacing}px`"
      :value="text.letterSpacing"
      :min="-5"
      :max="20"
      :step="1"
      :show-reset="text.letterSpacing !== 0"
      :reset-title="t('imageControls.resetValue')"
      @input="updateLetterSpacing"
      @reset="updateLetterSpacing(0)"
    />

    <!-- Font Weight & Align -->
    <div class="flex items-center gap-2">
      <UiIconButton
        :label="t('text.fontWeight')"
        variant="secondary"
        :pressed="isBold"
        @click="toggleFontWeight"
      >
        <strong>B</strong>
      </UiIconButton>
      <UiSegmentedControl
        v-model="alignModel"
        class="text-align-control"
        :options="alignOptions"
        :label="t('text.textAlign')"
      />
    </div>
  </div>
</template>

<style scoped>
  /* Ausrichtung füllt die Restbreite neben dem Fett-Schalter. */
  .text-align-control {
    flex: 1 1 0;
    min-width: 0;
  }

  .text-align-control :deep(.ui-segmented__option) {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 var(--ds-space-2);
  }
</style>
