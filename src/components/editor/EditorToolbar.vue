<script setup lang="ts">
  /** Icon-Leiste: wechselt das Werkzeug-Panel. Aktives Werkzeug erneut anklicken klappt es ein. */
  import { useI18n } from 'vue-i18n'
  import type { ToolTab } from '@/composables/useEditorLayout'

  defineProps<{ activeTool: ToolTab }>()
  const emit = defineEmits<{ select: [tool: Exclude<ToolTab, null>] }>()
  const { t } = useI18n()

  // Werkzeuge der Icon-Leiste (Reihenfolge = Anzeige). Icons als SVG-Pfad.
  const tools: { id: Exclude<ToolTab, null>; label: string; icon: string }[] = [
    {
      id: 'upload',
      label: 'upload.title',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'layouts',
      label: 'layout.title',
      icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    },
    {
      id: 'effects',
      label: 'stylePresets.title',
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    },
    {
      id: 'frames',
      label: 'frameGallery.title',
      icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm3 2v10h10V7H7z',
    },
    {
      id: 'images',
      label: 'images.title',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
  ]
</script>

<template>
  <nav
    class="flex lg:flex-col gap-1.5 p-1.5 flex-shrink-0 lg:self-start overflow-x-auto bg-surface-1 rounded-lg border border-line"
    :aria-label="t('editor.tools')"
  >
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors"
      :class="activeTool === tool.id ? 'bg-accent-soft text-ink' : 'text-ink-2 hover:bg-surface-2'"
      :title="t(tool.label)"
      :aria-label="t(tool.label)"
      :aria-pressed="activeTool === tool.id"
      @click="emit('select', tool.id)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="tool.icon" />
      </svg>
    </button>
  </nav>
</template>
