<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const { getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts()

const categories = getShortcutsByCategory()

function close() {
  emit('update:modelValue', false)
}

const categoryIcons = {
  selection: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />`,
  editing: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />`,
  navigation: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />`,
  canvas: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />`,
  general: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="relative w-full max-w-3xl max-h-[85vh] bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-muted/20 dark:border-slate/20 bg-muted/5 dark:bg-slate/5">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h2 class="text-xl font-semibold">{{ t('shortcuts.title') }}</h2>
          </div>
          <button
            @click="close"
            class="p-2 rounded-lg hover:bg-muted/10 dark:hover:bg-slate/10 transition-colors"
            :aria-label="t('common.cancel')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid gap-6 md:grid-cols-2">
            <!-- Selection Category -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wide">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="categoryIcons.selection"></svg>
                {{ t('shortcuts.categories.selection') }}
              </div>
              <div class="space-y-2">
                <div
                  v-for="shortcut in categories.selection"
                  :key="shortcut.descriptionKey"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="text-sm text-slate-dark dark:text-slate/90">{{ t(shortcut.descriptionKey) }}</span>
                  <kbd class="px-2 py-1 text-xs font-mono bg-muted/20 dark:bg-slate/20 rounded border border-muted/30 dark:border-slate/30">
                    {{ formatShortcut(shortcut) }}
                  </kbd>
                </div>
              </div>
            </div>

            <!-- Editing Category -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wide">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="categoryIcons.editing"></svg>
                {{ t('shortcuts.categories.editing') }}
              </div>
              <div class="space-y-2">
                <div
                  v-for="shortcut in categories.editing"
                  :key="shortcut.descriptionKey"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="text-sm text-slate-dark dark:text-slate/90">{{ t(shortcut.descriptionKey) }}</span>
                  <kbd class="px-2 py-1 text-xs font-mono bg-muted/20 dark:bg-slate/20 rounded border border-muted/30 dark:border-slate/30">
                    {{ formatShortcut(shortcut) }}
                  </kbd>
                </div>
              </div>
            </div>

            <!-- Navigation Category -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wide">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="categoryIcons.navigation"></svg>
                {{ t('shortcuts.categories.navigation') }}
              </div>
              <div class="space-y-2">
                <div
                  v-for="shortcut in categories.navigation.slice(0, 4)"
                  :key="shortcut.descriptionKey"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="text-sm text-slate-dark dark:text-slate/90">{{ t(shortcut.descriptionKey) }}</span>
                  <kbd class="px-2 py-1 text-xs font-mono bg-muted/20 dark:bg-slate/20 rounded border border-muted/30 dark:border-slate/30">
                    {{ formatShortcut(shortcut) }}
                  </kbd>
                </div>
                <div class="text-xs text-muted dark:text-slate/60 mt-2">
                  {{ t('shortcuts.shiftHint') }}
                </div>
              </div>
            </div>

            <!-- Canvas Category -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wide">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="categoryIcons.canvas"></svg>
                {{ t('shortcuts.categories.canvas') }}
              </div>
              <div class="space-y-2">
                <div
                  v-for="shortcut in categories.canvas.filter((s, i, arr) => arr.findIndex(x => x.descriptionKey === s.descriptionKey) === i)"
                  :key="shortcut.descriptionKey"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="text-sm text-slate-dark dark:text-slate/90">{{ t(shortcut.descriptionKey) }}</span>
                  <kbd class="px-2 py-1 text-xs font-mono bg-muted/20 dark:bg-slate/20 rounded border border-muted/30 dark:border-slate/30">
                    {{ formatShortcut(shortcut) }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <!-- Tips Section -->
          <div class="mt-6 p-4 bg-accent/10 dark:bg-accent/5 rounded-lg border border-accent/20">
            <h3 class="text-sm font-semibold text-accent mb-2">{{ t('shortcuts.tips.title') }}</h3>
            <ul class="text-sm text-slate-dark dark:text-slate/80 space-y-1">
              <li>{{ t('shortcuts.tips.multiSelect') }}</li>
              <li>{{ t('shortcuts.tips.shiftResize') }}</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-muted/20 dark:border-slate/20 bg-muted/5 dark:bg-slate/5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted dark:text-slate/60">
              {{ t('shortcuts.pressToOpen') }}
            </span>
            <button
              @click="close"
              class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark font-medium rounded-lg transition-colors"
            >
              {{ t('shortcuts.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
