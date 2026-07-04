<script setup lang="ts">
  /**
   * Wiederverwendbarer Slider mit Label, formatiertem Wert und optionalem
   * Reset-Button. Ersetzt das mehrfach wiederholte Markup in ImageControls.
   */
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

  function onInput(event: Event) {
    emit('input', Number((event.target as HTMLInputElement).value))
  }
</script>

<template>
  <div>
    <div class="flex items-center justify-between" :class="labelSize === 'sm' ? 'mb-2' : 'mb-1'">
      <label :class="labelSize === 'sm' ? 'text-sm font-medium' : 'text-xs text-muted'">
        {{ label }}: {{ displayValue }}
      </label>
      <button
        v-if="showReset"
        class="text-xs text-muted hover:text-accent transition-colors"
        :title="resetTitle"
        @click="emit('reset')"
      >
        ↺
      </button>
    </div>
    <input
      type="range"
      :value="value"
      :min="min"
      :max="max"
      :step="step"
      class="w-full"
      @input="onInput"
    />
  </div>
</template>
