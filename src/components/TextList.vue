<script setup lang="ts">
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import { UiButton, UiEmptyState, UiPanel } from '@/components/ui'

  const collage = useCollageStore()
  const { t } = useI18n()
</script>

<template>
  <UiPanel :title="t('text.title')" :count="collage.texts.length">
    <template #actions>
      <UiButton variant="primary" size="sm" @click="collage.addText()">
        <template #icon>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        {{ t('text.addText') }}
      </UiButton>
    </template>

    <UiEmptyState v-if="collage.texts.length === 0" :title="t('text.empty')" />

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
  </UiPanel>
</template>
