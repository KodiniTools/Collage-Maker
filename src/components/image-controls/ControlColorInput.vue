<script setup lang="ts">
  /**
   * Farbwähler bestehend aus Color-Picker und synchronisiertem Textfeld.
   * Wird für Rahmen-, Rahmenschatten- und Schattenfarbe verwendet.
   */
  withDefaults(
    defineProps<{
      label: string
      value: string
      // Grössen-/Stilvariante der Eingabefelder (Rahmenschatten nutzt 'sm')
      variant?: 'default' | 'sm'
    }>(),
    {
      variant: 'default',
    }
  )

  const emit = defineEmits<{
    input: [value: string]
  }>()

  function onInput(event: Event) {
    emit('input', (event.target as HTMLInputElement).value)
  }
</script>

<template>
  <div>
    <label class="block text-xs text-muted mb-1">{{ label }}</label>
    <div class="flex gap-2">
      <input
        type="color"
        :value="value"
        :class="[
          'rounded border border-muted/50 dark:border-slate cursor-pointer',
          variant === 'sm' ? 'w-12 h-8' : 'w-12 h-10',
        ]"
        @input="onInput"
      />
      <input
        type="text"
        :value="value"
        :class="[
          'flex-1 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark',
          variant === 'sm' ? 'px-2 py-1 text-xs font-mono' : 'px-3 py-2 text-sm',
        ]"
        @input="onInput"
      />
    </div>
  </div>
</template>
