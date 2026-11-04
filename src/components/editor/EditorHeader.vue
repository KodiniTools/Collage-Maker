<script setup lang="ts">
  /** Kopfzeile des Editors: Zurück, Titel, Rückgängig/Wiederholen, Vorlagen, Tastenkürzel. */
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { UiButton, UiIconButton } from '@/components/ui'
  import { useCollageStore } from '@/stores/collage'

  const emit = defineEmits<{
    'save-template': []
    'open-templates': []
    'open-shortcuts': []
  }>()

  const { t } = useI18n()
  const collage = useCollageStore()
</script>

<template>
  <header class="sticky top-0 z-50 bg-surface-1 border-b border-line">
    <div class="container mx-auto px-2 py-2 sm:px-4 sm:py-4 flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Back to Landing Button -->
        <RouterLink
          to="/"
          class="p-2 rounded-md hover:bg-surface-2 transition-colors"
          :title="t('app.backToHome')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </RouterLink>
        <div class="min-w-0">
          <h1 class="text-lg sm:text-2xl font-bold truncate">{{ t('app.title') }}</h1>
          <p class="text-sm text-ink-2 hidden sm:block">
            {{ t('app.subtitle') }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <!-- Undo/Redo Buttons -->
        <div class="flex items-center gap-1 mr-1 sm:mr-2">
          <UiIconButton
            :label="`${t('shortcuts.undo')} (Ctrl+Z)`"
            :disabled="!collage.canUndo"
            @click="collage.undo"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </UiIconButton>
          <UiIconButton
            :label="`${t('shortcuts.redo')} (Ctrl+Y)`"
            :disabled="!collage.canRedo"
            @click="collage.redo"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
              />
            </svg>
          </UiIconButton>
        </div>

        <!-- Vorlagen: unter sm nur Icons, ab sm Buttons mit Text -->
        <div class="contents sm:hidden">
          <UiIconButton :label="t('templates.saveAsCurrent')" @click="emit('save-template')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-4 4m0 0L8 3m4 4V3"
              />
            </svg>
          </UiIconButton>
          <UiIconButton :label="t('templates.library')" @click="emit('open-templates')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
          </UiIconButton>
        </div>
        <div class="hidden sm:contents">
          <UiButton variant="secondary" @click="emit('save-template')">
            <template #icon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-4 4m0 0L8 3m4 4V3"
                />
              </svg>
            </template>
            {{ t('templates.saveAsCurrent') }}
          </UiButton>
          <UiButton variant="secondary" @click="emit('open-templates')">
            <template #icon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
            </template>
            {{ t('templates.library') }}
          </UiButton>
        </div>
        <UiIconButton :label="t('shortcuts.title')" @click="emit('open-shortcuts')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </UiIconButton>
      </div>
    </div>
  </header>
</template>
