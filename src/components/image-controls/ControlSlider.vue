<script setup lang="ts">
  /**
   * Wiederverwendbarer Slider mit Label, formatiertem Wert und optionalem
   * Reset-Button. Ersetzt das mehrfach wiederholte Markup in ImageControls.
   *
   * Layout: Label + Anzeigewert stehen in der Kopfzeile. Darunter liegen
   * Slider, Zahlen-Spinner (beides: ui/SliderField) und Reset-Button
   * gemeinsam in EINER Zeile. Props und Events sind unverändert: `input`
   * kommt live bei jeder Änderung, `reset` beim Klick auf Zurücksetzen.
   */
  import ResetButton from '@/components/ResetButton.vue'
  import { SliderField } from '@/components/ui'

  withDefaults(
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
</script>

<template>
  <div>
    <label
      class="block"
      :class="labelSize === 'sm' ? 'text-sm font-medium mb-2' : 'text-xs text-ink-2 mb-1'"
    >
      {{ label }}: {{ displayValue }}
    </label>

    <!-- Slider, Spinner und Reset-Button in einer gemeinsamen Zeile -->
    <div class="flex items-center gap-2">
      <SliderField
        :model-value="value"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="label"
        @update:model-value="emit('input', $event)"
      />
      <!-- Reset-Platz dauerhaft reserviert, damit der Spinner beim Ein-/
           Ausblenden des Buttons nicht seitlich springt -->
      <span class="w-7 flex-shrink-0 flex justify-center">
        <ResetButton v-if="showReset" :label="resetTitle" @click="emit('reset')" />
      </span>
    </div>
  </div>
</template>
