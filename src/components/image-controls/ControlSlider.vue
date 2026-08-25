<script setup lang="ts">
  /**
   * Wiederverwendbarer Slider mit Label, formatiertem Wert und optionalem
   * Reset-Button. Ersetzt das mehrfach wiederholte Markup in ImageControls.
   *
   * Layout: Label + Anzeigewert stehen in der Kopfzeile. Darunter liegen
   * Slider, Zahlen-Spinner und Reset-Button gemeinsam in EINER Zeile. Der
   * Spinner erlaubt die präzise numerische Eingabe (inkl. Auf-/Ab-Pfeilen)
   * und spiegelt denselben Rohwert wie der Slider.
   */
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      label: string
      // Bereits formatierter Anzeigewert (z. B. "45°", "80%", "6px")
      displayValue: string
      value: number
      min: number
      max: number
      step?: number | string
      // Reset-Button anzeigen (üblicherweise wenn Wert != Standard)
      showReset?: boolean
      resetTitle?: string
      // Textgröße des Labels: 'sm' (Standard) oder 'xs'
      labelSize?: 'sm' | 'xs'
    }>(),
    {
      step: 1,
      showReset: false,
      resetTitle: '',
      labelSize: 'sm',
    }
  )

  const emit = defineEmits<{
    input: [value: number]
    reset: []
  }>()

  // Schrittweite als Zahl (step kann als String übergeben werden)
  const stepNum = computed(() => Number(props.step) || 1)

  // Wert für den Spinner auf das Schritt-Raster einrasten und float-Rauschen
  // (z. B. 45.30000001) auf die passende Nachkommastellenzahl kürzen. So zeigt
  // der Spinner denselben Wert wie das Label, ohne lange Kommazahlen.
  const spinnerValue = computed(() => {
    const step = stepNum.value
    const snapped = Math.round(props.value / step) * step
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0
    return Number(snapped.toFixed(decimals))
  })

  function onInput(event: Event) {
    emit('input', Number((event.target as HTMLInputElement).value))
  }

  // Eingabe im Zahlenfeld: leeres/ungültiges Feld ignorieren, sonst auf den
  // erlaubten Bereich [min, max] begrenzen und übernehmen (commit bei Änderung
  // bzw. Klick auf die Spinner-Pfeile).
  function onNumberInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value
    if (raw === '') return
    const n = Number(raw)
    if (Number.isNaN(n)) return
    const clamped = Math.min(props.max, Math.max(props.min, n))
    emit('input', clamped)
  }
</script>

<template>
  <div>
    <label
      class="block"
      :class="labelSize === 'sm' ? 'text-sm font-medium mb-2' : 'text-xs text-muted mb-1'"
    >
      {{ label }}: {{ displayValue }}
    </label>

    <!-- Slider, Spinner und Reset-Button in einer gemeinsamen Zeile -->
    <div class="flex items-center gap-2">
      <input
        type="range"
        :value="value"
        :min="min"
        :max="max"
        :step="step"
        class="flex-1 min-w-0"
        @input="onInput"
      />
      <input
        type="number"
        :value="spinnerValue"
        :min="min"
        :max="max"
        :step="step"
        class="w-16 flex-shrink-0 px-1.5 py-1 text-xs border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
        :aria-label="label"
        @change="onNumberInput"
      />
      <!-- Reset-Platz dauerhaft reserviert, damit der Spinner beim Ein-/
           Ausblenden des Buttons nicht seitlich springt -->
      <span class="w-5 flex-shrink-0 flex justify-center">
        <button
          v-if="showReset"
          class="text-sm leading-none text-muted hover:text-accent transition-colors"
          :title="resetTitle"
          @click="emit('reset')"
        >
          ↺
        </button>
      </span>
    </div>
  </div>
</template>
