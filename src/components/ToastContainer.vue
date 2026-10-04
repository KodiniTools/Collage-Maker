<script setup lang="ts">
  import { useToastStore } from '@/stores/toast'
  import { useI18n } from 'vue-i18n'
  import type { Toast } from '@/types'
  import { UiToast } from '@/components/ui'

  const toast = useToastStore()
  const { t } = useI18n()

  /** Aktion des Toasts: eigene Aktion (z. B. Rückgängig) oder "Nicht mehr anzeigen". */
  function actionLabel(item: Toast): string | undefined {
    if (item.action) return item.action.label
    if (item.dismissKey) return t('toast.dontShowAgain')
    return undefined
  }

  function runAction(item: Toast) {
    if (item.action) {
      item.action.handler()
      toast.removeToast(item.id)
      return
    }
    if (item.dismissKey) toast.dismissForever(item.dismissKey)
  }
</script>

<template>
  <Teleport to="#modal-portal">
    <div
      class="toast-stack fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-toast flex flex-col gap-2"
    >
      <TransitionGroup name="toast">
        <UiToast
          v-for="item in toast.toasts"
          :key="item.id"
          :message="item.message"
          :type="item.type"
          :action-label="actionLabel(item)"
          :dismiss-label="t('common.close')"
          dismiss-on-click
          @action="runAction(item)"
          @dismiss="toast.removeToast(item.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
  .toast-stack {
    max-width: calc(100vw - 1rem);
    pointer-events: none;
  }

  .toast-stack > * {
    pointer-events: auto;
  }

  .toast-enter-active,
  .toast-leave-active {
    transition:
      opacity var(--ds-duration-slow) var(--ds-ease),
      transform var(--ds-duration-slow) var(--ds-ease);
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateX(16px);
  }
</style>
