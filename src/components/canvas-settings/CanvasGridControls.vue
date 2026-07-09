<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <!-- Hilfsraster -->
  <div class="border-t border-muted/30 dark:border-slate/30 pt-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">{{ t('grid.enabled') }}</label>
      <button
        :class="[
          'px-3 py-1 text-xs rounded transition-colors',
          collage.settings.gridEnabled
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        :aria-pressed="collage.settings.gridEnabled"
        @click="api.toggleGrid"
      >
        {{ collage.settings.gridEnabled ? t('grid.on') : t('grid.off') }}
      </button>
    </div>

    <!-- Rastergröße -->
    <div v-if="collage.settings.gridEnabled" class="mt-3">
      <label class="block text-xs text-muted mb-1">
        {{ t('grid.size') }}: {{ collage.settings.gridSize }}px
      </label>
      <input
        type="range"
        :value="collage.settings.gridSize"
        min="10"
        max="200"
        step="5"
        class="w-full accent-accent"
        :aria-label="t('grid.size')"
        @input="api.updateGridSize(Number(($event.target as HTMLInputElement).value))"
      />
      <div class="flex justify-between text-xs text-muted mt-1">
        <span>10px</span>
        <span>200px</span>
      </div>
    </div>

    <p class="text-xs text-muted mt-3">
      {{ t('grid.hint') }}
    </p>
  </div>
</template>
