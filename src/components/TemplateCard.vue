<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Template } from '@/stores/templates'

interface Props {
  template: Template
  canDelete?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  load: [template: Template]
  delete: [id: string]
}>()

const { t } = useI18n()

// Verwende nameKey für Übersetzung, falls vorhanden, sonst direkten Wert
const displayName = computed(() => {
  if (props.template.nameKey) {
    return t(props.template.nameKey)
  }
  return props.template.name || ''
})

// Verwende descriptionKey für Übersetzung, falls vorhanden, sonst direkten Wert
const displayDescription = computed(() => {
  if (props.template.descriptionKey) {
    return t(props.template.descriptionKey)
  }
  return props.template.description || ''
})
</script>

<template>
  <div class="bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
    <!-- Thumbnail -->
    <div
      @click="emit('load', template)"
      class="relative aspect-video bg-muted/10 dark:bg-slate/30 overflow-hidden"
    >
      <img
        v-if="template.thumbnail"
        :src="template.thumbnail"
        :alt="displayName"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-muted">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Overlay on hover -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-medium">
          {{ t('templates.useTemplate') }}
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm truncate">{{ displayName }}</h3>
          <p v-if="displayDescription" class="text-xs text-muted mt-1 line-clamp-2">
            {{ displayDescription }}
          </p>
        </div>

        <!-- Delete button for user templates -->
        <button
          v-if="canDelete"
          @click.stop="emit('delete', template.id)"
          class="p-1.5 hover:bg-warm/20 dark:hover:bg-warm/10 rounded transition-colors flex-shrink-0"
          :title="t('templates.deleteTemplate')"
        >
          <svg class="w-4 h-4 text-warm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <!-- Category badge -->
      <div class="mt-2">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="template.category === 'predefined'
            ? 'bg-accent/20 text-slate-dark dark:bg-accent/10 dark:text-accent'
            : 'bg-warm/20 text-warm-dark dark:bg-warm/10 dark:text-warm-light'"
        >
          {{ template.category === 'predefined' ? t('templates.predefined') : t('templates.custom') }}
        </span>
      </div>
    </div>
  </div>
</template>
