<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useKeyboardShortcuts, type KeyboardShortcut } from '@/composables/useKeyboardShortcuts'
  import { UiButton, UiCallout, UiDialog, UiKbd } from '@/components/ui'

  const modelValue = defineModel<boolean>({ required: true })

  const { t } = useI18n()
  const { getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts()

  const categories = getShortcutsByCategory()

  function close() {
    modelValue.value = false
  }

  /** "Ctrl + Shift + Z" → ['Ctrl', 'Shift', 'Z'] für UiKbd. */
  function keysOf(shortcut: KeyboardShortcut): string[] {
    return formatShortcut(shortcut).split(' + ')
  }

  /** Gleiche Beschreibung nur einmal zeigen (z. B. Zoom per Taste und per Rad). */
  function unique(shortcuts: KeyboardShortcut[]): KeyboardShortcut[] {
    return shortcuts.filter(
      (s, i, arr) => arr.findIndex((x) => x.descriptionKey === s.descriptionKey) === i
    )
  }

  type CategoryId = 'selection' | 'editing' | 'navigation' | 'canvas'

  const sections: { id: CategoryId; shortcuts: KeyboardShortcut[]; hint?: string }[] = [
    { id: 'selection', shortcuts: categories.selection },
    { id: 'editing', shortcuts: categories.editing },
    { id: 'navigation', shortcuts: categories.navigation.slice(0, 4), hint: 'shortcuts.shiftHint' },
    { id: 'canvas', shortcuts: unique(categories.canvas) },
  ]

  const categoryIcons: Record<CategoryId, string> = {
    selection: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />`,
    editing: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />`,
    navigation: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />`,
    canvas: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />`,
  }
</script>

<template>
  <UiDialog
    teleport-to="#modal-portal"
    :open="modelValue"
    :title="t('shortcuts.title')"
    :close-label="t('shortcuts.close')"
    size="lg"
    @close="close"
  >
    <div class="grid gap-5 sm:gap-6 md:grid-cols-2">
      <section v-for="section in sections" :key="section.id" class="space-y-2">
        <h3
          class="flex items-center gap-2 text-xs font-semibold text-ink-2 uppercase tracking-wide"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
            v-html="categoryIcons[section.id]"
          ></svg>
          {{ t(`shortcuts.categories.${section.id}`) }}
        </h3>
        <ul class="space-y-1">
          <li
            v-for="shortcut in section.shortcuts"
            :key="shortcut.descriptionKey"
            class="flex items-center justify-between gap-3 py-1"
          >
            <span class="text-sm text-ink">{{ t(shortcut.descriptionKey) }}</span>
            <UiKbd :keys="keysOf(shortcut)" />
          </li>
        </ul>
        <p v-if="section.hint" class="text-xs text-ink-2">{{ t(section.hint) }}</p>
      </section>
    </div>

    <UiCallout type="info" :title="t('shortcuts.tips.title')" class="mt-5">
      <ul class="space-y-1">
        <li>{{ t('shortcuts.tips.multiSelect') }}</li>
        <li>{{ t('shortcuts.tips.shiftResize') }}</li>
      </ul>
    </UiCallout>

    <template #footer>
      <span class="mr-auto self-center text-xs text-ink-2">{{ t('shortcuts.pressToOpen') }}</span>
      <UiButton variant="primary" @click="close">{{ t('shortcuts.close') }}</UiButton>
    </template>
  </UiDialog>
</template>
