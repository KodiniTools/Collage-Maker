<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">{{ t('text.title') }}</h2>
      <button
        @click="collage.addText()"
        class="px-3 py-1.5 bg-accent hover:bg-accent-dark text-slate-dark text-sm font-medium rounded-md transition-colors"
      >
        + {{ t('text.addText') }}
      </button>
    </div>

    <div v-if="collage.texts.length === 0" class="text-sm text-muted text-center py-6 border border-muted/30 dark:border-slate/30 rounded-lg">
      {{ t('text.empty') }}
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="text in collage.texts"
        :key="text.id"
        @click="collage.selectText(text.id)"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-colors border',
          collage.selectedTextId === text.id
            ? 'bg-accent/10 dark:bg-accent/5 border-accent'
            : 'bg-muted/5 dark:bg-slate/20 border-muted/30 dark:border-slate/30 hover:bg-muted/10 dark:hover:bg-slate/30'
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ text.text || t('text.empty') }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ text.fontFamily }} • {{ text.fontSize }}px
            </p>
          </div>
          <div
            class="w-6 h-6 rounded border border-muted/50 dark:border-slate flex-shrink-0"
            :style="{ backgroundColor: text.color }"
            :title="text.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
