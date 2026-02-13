<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import ImageUploader from '@/components/ImageUploader.vue'
import LayoutSelector from '@/components/LayoutSelector.vue'
import GridControls from '@/components/GridControls.vue'
import CanvasSettings from '@/components/CanvasSettings.vue'
import ImageList from '@/components/ImageList.vue'
import TextList from '@/components/TextList.vue'
import ThumbnailBar from '@/components/ThumbnailBar.vue'
import CollageCanvas from '@/components/CollageCanvas.vue'
import ImageControls from '@/components/ImageControls.vue'
import TextControls from '@/components/TextControls.vue'
import ExportControls from '@/components/ExportControls.vue'
import TemplateLibrary from '@/components/TemplateLibrary.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useCollageStore } from '@/stores/collage'
import { useAutoSave } from '@/composables/useAutoSave'

const { t } = useI18n()
const showTemplates = ref(false)
const showRestoreDialog = ref(false)
const restoreSaveDate = ref<Date | null>(null)
const collage = useCollageStore()

// Collapsible Sidebar State
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const mobileRightPanel = ref(false)

function toggleLeftSidebar() {
  leftSidebarCollapsed.value = !leftSidebarCollapsed.value
}

function toggleRightSidebar() {
  rightSidebarCollapsed.value = !rightSidebarCollapsed.value
}

const { showShortcutsModal, setupKeyboardListeners, cleanupKeyboardListeners } = useKeyboardShortcuts()
const autoSave = useAutoSave()

// Wiederherstellungsdialog Funktionen
async function handleRestore() {
  showRestoreDialog.value = false
  await autoSave.restoreState()
}

function handleDiscardRestore() {
  showRestoreDialog.value = false
  autoSave.clearSavedState()
}

function handleContinueWithoutRestore() {
  showRestoreDialog.value = false
}

onMounted(() => {
  setupKeyboardListeners()
  autoSave.setupAutoSave()

  // Auto-collapse left sidebar on smaller screens
  if (window.innerWidth < 1024) {
    leftSidebarCollapsed.value = true
  }

  // Prüfe ob gespeicherte Daten vorhanden sind
  if (autoSave.hasSavedState()) {
    restoreSaveDate.value = autoSave.getSaveDate()
    showRestoreDialog.value = true
  }
})

onUnmounted(() => {
  cleanupKeyboardListeners()
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-page-gradient text-slate-dark dark:text-muted-light transition-colors">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-muted/30 dark:border-slate/30">
      <div class="container mx-auto px-2 py-2 sm:px-4 sm:py-4 flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Back to Landing Button -->
          <RouterLink
            to="/"
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
            :title="t('app.backToHome')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </RouterLink>
          <div>
            <h1 class="text-lg sm:text-2xl font-bold">{{ t('app.title') }}</h1>
            <p class="text-xs sm:text-sm text-muted dark:text-muted hidden sm:block">{{ t('app.subtitle') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1 sm:gap-3">
          <!-- Undo/Redo Buttons -->
          <div class="flex items-center gap-1 mr-1 sm:mr-2">
            <button
              @click="collage.undo"
              :disabled="!collage.canUndo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-navy/20"
              :title="`${t('shortcuts.undo')} (Ctrl+Z)`"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
            <button
              @click="collage.redo"
              :disabled="!collage.canRedo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-navy/20"
              :title="`${t('shortcuts.redo')} (Ctrl+Y)`"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
              </svg>
            </button>
          </div>

          <button
            @click="showTemplates = true"
            class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span class="hidden sm:inline">{{ t('templates.library') }}</span>
          </button>
          <button
            @click="showShortcutsModal = true"
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
            :title="t('shortcuts.title')"
            :aria-label="t('shortcuts.title')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-2 py-3 sm:px-4 sm:py-6">
      <div class="flex gap-2 sm:gap-4 lg:gap-6">
        <!-- Left Sidebar - Collapsible -->
        <aside
          class="transition-all duration-300 ease-in-out flex-shrink-0"
          :class="leftSidebarCollapsed ? 'w-14' : 'w-72 xl:w-80'"
        >
          <!-- Sidebar Header with Toggle -->
          <div class="flex items-center justify-between mb-4">
            <h2
              v-if="!leftSidebarCollapsed"
              class="text-sm font-semibold text-muted dark:text-muted-light uppercase tracking-wide"
            >
              {{ t('editor.tools') }}
            </h2>
            <button
              @click="toggleLeftSidebar"
              class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
              :title="leftSidebarCollapsed ? t('editor.expandSidebar') : t('editor.collapseSidebar')"
            >
              <svg
                class="w-5 h-5 transition-transform duration-300"
                :class="leftSidebarCollapsed ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <!-- Collapsed State: Icon Bar -->
          <div
            v-if="leftSidebarCollapsed"
            class="flex flex-col items-center gap-2"
          >
            <button
              @click="toggleLeftSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('upload.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              @click="toggleLeftSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('layout.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              @click="toggleLeftSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('grid.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              @click="toggleLeftSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('images.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              @click="toggleLeftSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('text.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          <!-- Expanded State: Full Content -->
          <div
            v-else
            class="space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2"
          >
            <ImageUploader />
            <LayoutSelector />
            <GridControls />
            <ImageList />
            <TextList />
          </div>
        </aside>

        <!-- Canvas - Expands to fill available space -->
        <section class="flex-1 min-w-0">
          <ThumbnailBar />
          <CollageCanvas />
        </section>

        <!-- Mobile Settings FAB -->
        <button
          @click="mobileRightPanel = !mobileRightPanel"
          class="lg:hidden fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-accent hover:bg-accent-dark text-slate-dark shadow-lg flex items-center justify-center transition-colors"
          :title="t('editor.settings')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Mobile backdrop for right panel -->
        <div
          v-if="mobileRightPanel"
          class="lg:hidden fixed inset-0 bg-black/50 z-40"
          @click="mobileRightPanel = false"
        />

        <!-- Right Sidebar - Collapsible Controls -->
        <aside
          class="transition-all duration-300 ease-in-out flex-shrink-0"
          :class="[
            mobileRightPanel
              ? 'fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[calc(100vw-3rem)] bg-surface-light dark:bg-surface-dark shadow-2xl overflow-y-auto p-4 lg:p-0 lg:static lg:z-auto lg:max-w-none lg:bg-transparent lg:dark:bg-transparent lg:shadow-none lg:overflow-visible'
              : 'hidden lg:block',
            rightSidebarCollapsed ? 'lg:w-14' : 'lg:w-72 xl:w-80',
          ]"
        >
          <!-- Mobile close button -->
          <div v-if="mobileRightPanel" class="lg:hidden flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-muted dark:text-muted-light uppercase tracking-wide">
              {{ t('editor.settings') }}
            </h2>
            <button
              @click="mobileRightPanel = false"
              class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Sidebar Header with Toggle (desktop) -->
          <div class="hidden lg:flex items-center mb-4" :class="rightSidebarCollapsed ? 'justify-center' : 'justify-between'">
            <h2
              v-if="!rightSidebarCollapsed"
              class="text-sm font-semibold text-muted dark:text-muted-light uppercase tracking-wide"
            >
              {{ t('editor.settings') }}
            </h2>
            <button
              @click="toggleRightSidebar"
              class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
              :title="rightSidebarCollapsed ? t('editor.expandSidebar') : t('editor.collapseSidebar')"
            >
              <svg
                class="w-5 h-5 transition-transform duration-300"
                :class="rightSidebarCollapsed ? '' : 'rotate-180'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Collapsed State: Icon Bar (desktop only) -->
          <div
            v-if="rightSidebarCollapsed"
            class="hidden lg:flex flex-col items-center gap-2"
          >
            <button
              @click="toggleRightSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('canvas.size')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              @click="toggleRightSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('imageControls.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <button
              @click="toggleRightSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('text.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            <button
              @click="toggleRightSidebar"
              class="w-10 h-10 rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 flex items-center justify-center transition-colors"
              :title="t('export.title')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>

          <!-- Expanded State: Full Content -->
          <div
            v-if="!rightSidebarCollapsed || mobileRightPanel"
            class="space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2"
          >
            <CanvasSettings />
            <ImageControls />
            <TextControls />
            <ExportControls />
          </div>
        </aside>
      </div>
    </main>

    <!-- Donate Section -->
    <section class="border-t border-muted/30 dark:border-slate/30 py-8">
      <div class="container mx-auto px-4 text-center">
        <form action="https://www.paypal.com/donate" method="post" target="_top" class="inline-block">
          <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
          <button type="submit" class="px-4 py-2 sm:px-8 sm:py-3 bg-warm hover:bg-warm-dark text-surface-light font-semibold rounded-lg shadow-lg transition-colors duration-150 flex items-center gap-2 mx-auto text-sm sm:text-base">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H8.032c-.3 0-.54-.266-.475-.558l1.918-12.157-.002-.01.162-1.026a.805.805 0 0 1 .794-.68h2.535c3.238 0 5.774-1.314 6.514-5.12.132-.68.168-1.32.112-1.918a4.695 4.695 0 0 0-.544-1.736C20.183 3.505 21.538 5.978 20.067 8.478z"/>
              <path d="M18.814 1.444c-.3-.354-.664-.64-1.08-.854C16.714.09 15.483 0 13.953 0H7.95a.804.804 0 0 0-.794.68L4.97 16.806c-.07.448.26.85.715.85h5.214l1.31-8.307-.04.257a.805.805 0 0 1 .794-.68h1.656c3.238 0 5.774-1.314 6.514-5.12.13-.68.168-1.32.112-1.918-.056-.448-.172-.863-.344-1.236a4.647 4.647 0 0 0-.087-.208z"/>
            </svg>
            <span>{{ t('editor.donate') }}</span>
          </button>
        </form>
      </div>
    </section>

    <!-- Template Library Modal -->
    <TemplateLibrary v-model:isOpen="showTemplates" />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal v-model="showShortcutsModal" />

    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Auto-Save Restore Dialog -->
    <Teleport to="body">
      <div
        v-if="showRestoreDialog"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-surface-light dark:bg-navy rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-muted/20 dark:border-muted/30">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-slate/10 dark:bg-navy/20 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-slate dark:text-muted-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-xl font-bold text-center mb-2">
            {{ t('autoSave.restoreTitle') }}
          </h3>

          <!-- Description -->
          <p class="text-muted dark:text-muted-light text-center mb-2">
            {{ t('autoSave.restoreDescription') }}
          </p>

          <!-- Save Date -->
          <p v-if="restoreSaveDate" class="text-sm text-muted dark:text-muted-light text-center mb-6">
            {{ t('autoSave.savedAt') }}: {{ restoreSaveDate.toLocaleString() }}
          </p>

          <!-- Buttons -->
          <div class="flex flex-col gap-3">
            <button
              @click="handleRestore"
              class="w-full px-4 py-3 bg-slate hover:bg-slate-dark text-cream rounded-lg font-semibold transition-colors"
            >
              {{ t('autoSave.restore') }}
            </button>
            <button
              @click="handleContinueWithoutRestore"
              class="w-full px-4 py-2 bg-muted/30 hover:bg-muted/50 dark:bg-navy/30 dark:hover:bg-navy/50 rounded-lg font-medium transition-colors"
            >
              {{ t('autoSave.continueWithout') }}
            </button>
            <button
              @click="handleDiscardRestore"
              class="w-full px-4 py-2 text-warm hover:text-warm-dark text-sm transition-colors"
            >
              {{ t('autoSave.discard') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
