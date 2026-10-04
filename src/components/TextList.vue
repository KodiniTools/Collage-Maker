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
        class="px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-sm font-medium rounded-sm transition-colors focus-visible:outline-none focus-visible:shadow-focus"
        aria-label="Add new text"
        @click="collage.addText()"
      >
        + {{ t('text.addText') }}
      </button>
    </div>

    <div
      v-if="collage.texts.length === 0"
      class="text-sm text-ink-2 text-center py-6 border border-line rounded-md"
    >
      {{ t('text.empty') }}
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="text in collage.texts"
        :key="text.id"
        tabindex="0"
        role="button"
        :aria-pressed="collage.selectedTextId === text.id"
        :class="[
          'p-3 rounded-md cursor-pointer transition-colors border',
          'focus-visible:outline-none focus-visible:shadow-focus',
          collage.selectedTextId === text.id
            ? 'bg-accent-soft border-accent'
            : 'bg-surface-2 border-line hover:bg-surface-3',
        ]"
        @click="collage.selectText(text.id)"
        @keydown.enter="collage.selectText(text.id)"
        @keydown.space.prevent="collage.selectText(text.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ text.text || t('text.empty') }}
            </p>
            <p class="text-xs text-ink-2 mt-1">
              {{ text.fontFamily }} • {{ Math.round(text.fontSize) }}px
            </p>
          </div>
          <div
            class="w-6 h-6 rounded-sm border border-line-strong flex-shrink-0"
            :style="{ backgroundColor: text.color }"
            :title="text.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
