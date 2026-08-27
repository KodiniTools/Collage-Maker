<script setup lang="ts">
  import { ref } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import ControlSlider from './image-controls/ControlSlider.vue'
  import { availableFonts } from '@/assets/fonts/fontList'

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

  function toggleFontWeight() {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    const currentWeight =
      typeof collage.selectedText.fontWeight === 'number'
        ? collage.selectedText.fontWeight
        : collage.selectedText.fontWeight === 'bold'
          ? 700
          : 400
    const newWeight = currentWeight >= 700 ? 400 : 700
    collage.updateText(collage.selectedText.id, { fontWeight: newWeight })
  }

  function updateTextAlign(value: 'left' | 'center' | 'right') {
    if (!collage.selectedText) return
    collage.saveStateForUndo()
    collage.updateText(collage.selectedText.id, { textAlign: value })
  }

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
  <div
    class="w-full bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
  >
    <h2 class="text-lg font-semibold mb-4">{{ t('text.title') }}</h2>

    <div
      v-if="!collage.selectedText"
      class="text-sm text-muted dark:text-muted-light text-center py-4"
    >
      {{ t('text.noSelection') }}
    </div>

    <div v-else class="space-y-4">
      <!-- Text Content -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.content') }}</label>
        <textarea
          :value="collage.selectedText.text"
          rows="3"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark resize-none"
          @input="updateTextContent(($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <!-- Font Family -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.fontFamily') }}</label>
        <select
          v-model="selectedFontFamily"
          class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
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
      <div class="flex gap-2">
        <button
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            (
              typeof collage.selectedText.fontWeight === 'number'
                ? collage.selectedText.fontWeight >= 700
                : collage.selectedText.fontWeight === 'bold'
            )
              ? 'bg-accent text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50',
          ]"
          @click="toggleFontWeight"
        >
          <strong>B</strong>
        </button>

        <button
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'left'
              ? 'bg-accent text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50',
          ]"
          @click="updateTextAlign('left')"
        >
          ←
        </button>

        <button
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'center'
              ? 'bg-accent text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50',
          ]"
          @click="updateTextAlign('center')"
        >
          ↔
        </button>

        <button
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'right'
              ? 'bg-accent text-slate-dark'
              : 'bg-muted/20 dark:bg-navy/50',
          ]"
          @click="updateTextAlign('right')"
        >
          →
        </button>
      </div>

      <!-- Text Color -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.color') }}</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="collage.selectedText.color"
            class="w-16 h-10 rounded border border-muted/50 dark:border-slate cursor-pointer"
            @input="updateColor(($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            :value="collage.selectedText.color"
            placeholder="#000000"
            class="flex-1 px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-sm font-mono"
            @input="updateColor(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- Shadow Controls -->
      <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('text.shadow') }}</label>
          <button
            :class="[
              'px-3 py-1 text-xs rounded-md font-medium transition-colors',
              collage.selectedText.shadowEnabled
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700',
            ]"
            @click="toggleShadow"
          >
            {{ collage.selectedText.shadowEnabled ? t('text.shadowOn') : t('text.shadowOff') }}
          </button>
        </div>

        <div v-if="collage.selectedText.shadowEnabled" class="space-y-3">
          <!-- Shadow X Offset -->
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

          <!-- Shadow Y Offset -->
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

          <!-- Shadow Blur -->
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
            <label class="block text-xs text-muted dark:text-muted-light mb-1">
              {{ t('text.shadowColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="collage.selectedText.shadowColor"
                class="w-12 h-8 rounded border border-muted/50 dark:border-slate cursor-pointer"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                :value="collage.selectedText.shadowColor"
                placeholder="#000000"
                class="flex-1 px-2 py-1 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-xs font-mono"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Stroke (Textumrandung) Controls -->
      <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('text.stroke') }}</label>
          <button
            :class="[
              'px-3 py-1 text-xs rounded-md font-medium transition-colors',
              collage.selectedText.strokeEnabled
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700',
            ]"
            @click="toggleStroke"
          >
            {{ collage.selectedText.strokeEnabled ? t('text.strokeOn') : t('text.strokeOff') }}
          </button>
        </div>

        <div v-if="collage.selectedText.strokeEnabled" class="space-y-3">
          <!-- Stroke Width -->
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
            <label class="block text-xs text-muted dark:text-muted-light mb-1">
              {{ t('text.strokeColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="collage.selectedText.strokeColor"
                class="w-12 h-8 rounded border border-muted/50 dark:border-slate cursor-pointer"
                @input="updateStrokeColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                :value="collage.selectedText.strokeColor"
                placeholder="#ffffff"
                class="flex-1 px-2 py-1 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark text-xs font-mono"
                @input="updateStrokeColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Button -->
      <button
        class="w-full px-4 py-2 bg-warm hover:bg-warm-dark text-surface-light font-medium rounded-lg transition-colors"
        @click="deleteText"
      >
        {{ t('text.delete') }}
      </button>
    </div>
  </div>
</template>
