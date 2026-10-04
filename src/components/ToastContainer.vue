<script setup lang="ts">
  import { useToastStore } from '@/stores/toast'
  import { useI18n } from 'vue-i18n'
  import type { Toast } from '@/types'

  const toast = useToastStore()
  const { t: tr } = useI18n()

  function runAction(t: Toast) {
    t.action?.handler()
    toast.removeToast(t.id)
  }

  function dismissForever(t: Toast) {
    if (t.dismissKey) toast.dismissForever(t.dismissKey)
  }
</script>

<template>
  <div
    class="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-1rem)] sm:max-w-sm"
    role="alert"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition-[opacity,transform]"
      leave-active-class="transition-[opacity,transform]"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="[
          'px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-line border-l-[3px] bg-surface-1 text-ink shadow-overlay flex items-center gap-2 sm:gap-3 cursor-pointer text-sm sm:text-base',
          t.type === 'success' && 'border-l-success',
          t.type === 'error' && 'border-l-danger',
          t.type === 'info' && 'border-l-info',
        ]"
        @click="toast.removeToast(t.id)"
      >
        <!-- success icon -->
        <svg
          v-if="t.type === 'success'"
          class="w-5 h-5 flex-shrink-0 text-success"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <!-- error icon -->
        <svg
          v-else-if="t.type === 'error'"
          class="w-5 h-5 flex-shrink-0 text-danger"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <!-- info icon -->
        <svg
          v-else
          class="w-5 h-5 flex-shrink-0 text-info"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm font-medium">{{ t.message }}</span>

        <!-- Optionale Aktion (z. B. Rückgängig) -->
        <button
          v-if="t.action"
          class="ml-1 sm:ml-2 shrink-0 px-2 py-1 rounded-sm text-xs font-semibold underline underline-offset-2 hover:bg-surface-2 transition-colors"
          @click.stop="runAction(t)"
        >
          {{ t.action.label }}
        </button>

        <!-- "Nicht mehr anzeigen" für abschaltbare Meldungen -->
        <button
          v-if="t.dismissKey"
          class="ml-auto shrink-0 pl-2 text-[11px] leading-tight text-ink-3 hover:text-ink underline underline-offset-2 transition-colors"
          :title="tr('toast.dontShowAgain')"
          @click.stop="dismissForever(t)"
        >
          {{ tr('toast.dontShowAgain') }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
