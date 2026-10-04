<script setup lang="ts">
  import { UiIconButton } from '@/components/ui'

  /** Zurücksetzen-Button neben Slidern und Feldern (28 px, Lucide „rotate-ccw“). */
  defineProps<{ label: string }>()
</script>

<template>
  <UiIconButton :label="label" size="sm">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  </UiIconButton>
</template>
