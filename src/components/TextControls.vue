<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import ControlSlider from './image-controls/ControlSlider.vue'
  import { availableFonts } from '@/assets/fonts/fontList'
  import {
    UiButton,
    UiEmptyState,
    UiIconButton,
    UiPanel,
    UiSegmentedControl,
  } from '@/components/ui'

  type TextAlign = 'left' | 'center' | 'right'

  const collage = useCollageStore()
  const { t } = useI18n()

  // System fonts
  const systemFonts = [
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
  ]

  // Benutzerdefinierte Schriften: flache Liste aus src/assets/fonts.
  // Jede woff2-Datei ist ein eigener Schrift-Name (z. B. "ClashDisplay Bold").
  // fonts.css (in main.ts importiert) liefert die @font-face-Regeln; die
  // woff2-Dateien werden von Vite gebündelt. Kein Server-Ordner/Fetch nötig.
  const selectedFontFamily = ref<string>('Arial')

  // Auswahl mit der aktuell gewählten Textebene synchronisieren.
  function syncFontSelection() {
    if (!collage.selectedText) return
    selectedFontFamily.value = collage.selectedText.fontFamily || 'Arial'
  }

  // Schriftart anwenden. Custom-Fonts werden vor dem Setzen geladen, damit sie
  // sofort korrekt gerendert werden (Live-Canvas & Export).
  async function updateFontFamily(family: string) {
    if (!collage.selectedText) return
    selectedFontFamily.value = family
    collage.saveStateForUndo()

    if (availableFonts.includes(family)) {
      try {
        await document.fonts.load(`48px "${family}"`)
      } catch {
        /* Font-Preload fehlgeschlagen – ignorieren, font-display: swap greift */
      }
    }

    collage.updateText(collage.selectedText.id, { fontFamily: family })
  }

  function updateTextContent(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { text: value })
  }

  function updateFontSize(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { fontSize: value })
  }

  function updateLetterSpacing(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { letterSpacing: value })
  }

  function updateColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { color: value })
  }

  const isBold = computed(() => {
    const weight = collage.selectedText?.fontWeight
    return typeof weight === 'number' ? weight >= 700 : weight === 'bold'
  })

  function toggleFontWeight() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, { fontWeight: isBold.value ? 400 : 700 })
  }

  function updateTextAlign(value: TextAlign) {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, { textAlign: value })
  }

  // UiSegmentedControl arbeitet mit string; der Proxy schreibt direkt in den Store.
  const alignOptions = computed(() => [
    { value: 'left', label: t('text.alignLeft') },
    { value: 'center', label: t('text.alignCenter') },
    { value: 'right', label: t('text.alignRight') },
  ])
  const alignModel = computed({
    get: () => (collage.selectedText?.textAlign ?? 'center') as string,
    set: (value) => updateTextAlign(value as TextAlign),
  })

  function toggleShadow() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, {
      shadowEnabled: !collage.selectedText.shadowEnabled,
    })
  }

  function updateShadowOffsetX(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowOffsetX: value })
  }

  function updateShadowOffsetY(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowOffsetY: value })
  }

  function updateShadowBlur(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowBlur: value })
  }

  function updateShadowColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { shadowColor: value })
  }

  // Stroke (Textumrandung) Funktionen
  function toggleStroke() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, {
      strokeEnabled: !collage.selectedText.strokeEnabled,
    })
  }

  function updateStrokeColor(value: string) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { strokeColor: value })
  }

  function updateStrokeWidth(value: number) {
    if (!collage.selectedText) return
    collage.saveStateForUndoDebounced()
    collage.updateText(collage.selectedText.id, { strokeWidth: value })
  }

  function deleteText() {
    if (!collage.selectedText) return
    // Undo wird in removeText gespeichert
    collage.removeText(collage.selectedText.id)
  }

  // Sync font selection when text is selected
  if (collage.selectedText) {
    syncFontSelection()
  }
</script>

<template>
  <UiPanel :title="t('text.title')">
    <UiEmptyState v-if="!collage.selectedText" :title="t('text.noSelection')" />

    <div v-else class="space-y-4">
      <!-- Text Content -->
      <div>
        <label for="text-content" class="block text-sm font-medium mb-2">
          {{ t('text.content') }}
        </label>
        <textarea
          id="text-content"
          :value="collage.selectedText.text"
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
        :display-value="`${Math.round(collage.selectedText.fontSize)}px`"
        :value="collage.selectedText.fontSize"
        :min="12"
        :max="2000"
        :step="2"
        :show-reset="collage.selectedText.fontSize !== 48"
        :reset-title="t('imageControls.resetValue')"
        @input="updateFontSize"
        @reset="updateFontSize(48)"
      />

      <!-- Letter Spacing -->
      <ControlSlider
        :label="t('text.letterSpacing')"
        :display-value="`${collage.selectedText.letterSpacing}px`"
        :value="collage.selectedText.letterSpacing"
        :min="-5"
        :max="20"
        :step="1"
        :show-reset="collage.selectedText.letterSpacing !== 0"
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

      <!-- Text Color -->
      <div>
        <label for="text-color" class="block text-sm font-medium mb-2">{{ t('text.color') }}</label>
        <div class="flex gap-2">
          <input
            id="text-color"
            type="color"
            :value="collage.selectedText.color"
            class="w-16 h-9 rounded-sm border border-line-strong cursor-pointer"
            @input="updateColor(($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            :value="collage.selectedText.color"
            placeholder="#000000"
            :aria-label="t('text.color')"
            class="flex-1 px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm font-mono focus-visible:outline-none focus-visible:shadow-focus"
            @input="updateColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- Shadow Controls -->
      <div class="border-t border-line pt-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium">{{ t('text.shadow') }}</span>
          <UiButton
            size="sm"
            :variant="collage.selectedText.shadowEnabled ? 'primary' : 'secondary'"
            :aria-pressed="collage.selectedText.shadowEnabled"
            @click="toggleShadow"
          >
            {{ collage.selectedText.shadowEnabled ? t('text.shadowOn') : t('text.shadowOff') }}
          </UiButton>
        </div>

        <div v-if="collage.selectedText.shadowEnabled" class="space-y-3">
          <ControlSlider
            label-size="xs"
            :label="t('text.shadowOffsetX')"
            :display-value="`${collage.selectedText.shadowOffsetX}px`"
            :value="collage.selectedText.shadowOffsetX"
            :min="-20"
            :max="20"
            :step="1"
            :show-reset="collage.selectedText.shadowOffsetX !== 2"
            :reset-title="t('imageControls.resetValue')"
            @input="updateShadowOffsetX"
            @reset="updateShadowOffsetX(2)"
          />
          <ControlSlider
            label-size="xs"
            :label="t('text.shadowOffsetY')"
            :display-value="`${collage.selectedText.shadowOffsetY}px`"
            :value="collage.selectedText.shadowOffsetY"
            :min="-20"
            :max="20"
            :step="1"
            :show-reset="collage.selectedText.shadowOffsetY !== 2"
            :reset-title="t('imageControls.resetValue')"
            @input="updateShadowOffsetY"
            @reset="updateShadowOffsetY(2)"
          />
          <ControlSlider
            label-size="xs"
            :label="t('text.shadowBlur')"
            :display-value="`${collage.selectedText.shadowBlur}px`"
            :value="collage.selectedText.shadowBlur"
            :min="0"
            :max="30"
            :step="1"
            :show-reset="collage.selectedText.shadowBlur !== 4"
            :reset-title="t('imageControls.resetValue')"
            @input="updateShadowBlur"
            @reset="updateShadowBlur(4)"
          />

          <!-- Shadow Color -->
          <div>
            <label for="text-shadow-color" class="block text-xs text-ink-2 mb-1">
              {{ t('text.shadowColor') }}
            </label>
            <div class="flex gap-2">
              <input
                id="text-shadow-color"
                type="color"
                :value="collage.selectedText.shadowColor"
                class="w-12 h-7 rounded-sm border border-line-strong cursor-pointer"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                :value="collage.selectedText.shadowColor"
                placeholder="#000000"
                :aria-label="t('text.shadowColor')"
                class="flex-1 px-2 py-1 border border-line-strong rounded-sm bg-surface-1 text-xs font-mono focus-visible:outline-none focus-visible:shadow-focus"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Stroke (Textumrandung) Controls -->
      <div class="border-t border-line pt-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium">{{ t('text.stroke') }}</span>
          <UiButton
            size="sm"
            :variant="collage.selectedText.strokeEnabled ? 'primary' : 'secondary'"
            :aria-pressed="collage.selectedText.strokeEnabled"
            @click="toggleStroke"
          >
            {{ collage.selectedText.strokeEnabled ? t('text.strokeOn') : t('text.strokeOff') }}
          </UiButton>
        </div>

        <div v-if="collage.selectedText.strokeEnabled" class="space-y-3">
          <ControlSlider
            label-size="xs"
            :label="t('text.strokeWidth')"
            :display-value="`${collage.selectedText.strokeWidth}px`"
            :value="collage.selectedText.strokeWidth"
            :min="1"
            :max="10"
            :step="1"
            :show-reset="collage.selectedText.strokeWidth !== 2"
            :reset-title="t('imageControls.resetValue')"
            @input="updateStrokeWidth"
            @reset="updateStrokeWidth(2)"
          />

          <!-- Stroke Color -->
          <div>
            <label for="text-stroke-color" class="block text-xs text-ink-2 mb-1">
              {{ t('text.strokeColor') }}
            </label>
            <div class="flex gap-2">
              <input
                id="text-stroke-color"
                type="color"
                :value="collage.selectedText.strokeColor"
                class="w-12 h-7 rounded-sm border border-line-strong cursor-pointer"
                @input="updateStrokeColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                :value="collage.selectedText.strokeColor"
                placeholder="#ffffff"
                :aria-label="t('text.strokeColor')"
                class="flex-1 px-2 py-1 border border-line-strong rounded-sm bg-surface-1 text-xs font-mono focus-visible:outline-none focus-visible:shadow-focus"
                @input="updateStrokeColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Delete: destruktiv, deshalb textbasiert -->
      <UiButton variant="danger" block @click="deleteText">
        {{ t('text.delete') }}
      </UiButton>
    </div>
  </UiPanel>
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
