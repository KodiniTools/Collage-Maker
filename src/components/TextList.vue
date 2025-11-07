<script setup lang="ts">
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

function handleTextClick(event: MouseEvent, textId: string) {
  event.preventDefault()
  collage.selectText(textId)
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">{{ t('text.title') }}</h2>
      <button
        @click="collage.addText()"
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        + {{ t('text.addText') }}
      </button>
    </div>

    <div v-if="collage.texts.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-6 border border-gray-200 dark:border-gray-700 rounded-lg">
      {{ t('text.empty') }}
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="text in collage.texts"
        :key="text.id"
        @click="handleTextClick($event, text.id)"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-colors border',
          collage.selectedTextId === text.id
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ text.text || t('text.empty') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ text.fontFamily }} • {{ text.fontSize }}px
            </p>
          </div>
          <div
            class="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
            :style="{ backgroundColor: text.color }"
            :title="text.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
