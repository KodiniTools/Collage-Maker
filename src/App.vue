<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageToggle from '@/components/LanguageToggle.vue'
import LandingPage from '@/components/LandingPage.vue'
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

const { t } = useI18n()
const showTemplates = ref(false)
const showLanding = ref(true)
const collage = useCollageStore()

const { showShortcutsModal, setupKeyboardListeners, cleanupKeyboardListeners } = useKeyboardShortcuts()

function startMaker() {
  showLanding.value = false
}

function goToLanding() {
  showLanding.value = true
}

onMounted(() => {
  setupKeyboardListeners()
})

onUnmounted(() => {
  cleanupKeyboardListeners()
})
</script>

<template>
  <!-- Landing Page -->
  <div v-if="showLanding" class="min-h-screen">
    <!-- Theme/Language toggles on landing page -->
    <div class="fixed top-4 right-4 z-50 flex items-center gap-2 bg-surface-light/90 dark:bg-slate-dark/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-muted/20 dark:border-muted/30">
      <LanguageToggle />
      <ThemeToggle />
    </div>
    <LandingPage @start="startMaker" />
  </div>

  <!-- Main App -->
  <div v-else class="flex flex-col min-h-screen bg-surface-light dark:bg-surface-dark text-slate-dark dark:text-muted-light transition-colors">
    <!-- Header -->
    <header class="border-b border-muted/30 dark:border-slate/30">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- Back to Landing Button -->
          <button
            @click="goToLanding"
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-slate/20 transition-colors"
            :title="t('app.backToHome')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold">{{ t('app.title') }}</h1>
            <p class="text-sm text-muted dark:text-muted">{{ t('app.subtitle') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Undo/Redo Buttons -->
          <div class="flex items-center gap-1 mr-2">
            <button
              @click="collage.undo"
              :disabled="!collage.canUndo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-slate/20"
              :title="`${t('shortcuts.undo')} (Ctrl+Z)`"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
            <button
              @click="collage.redo"
              :disabled="!collage.canRedo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-slate/20"
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
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-slate/20 transition-colors"
            :title="t('shortcuts.title')"
            :aria-label="t('shortcuts.title')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar - scrollable -->
        <aside class="lg:col-span-3 space-y-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
          <ImageUploader />
          <LayoutSelector />
          <GridControls />
          <ImageList />
          <TextList />
        </aside>

        <!-- Canvas - scrollable for large canvases up to 4000px -->
        <section class="lg:col-span-6">
          <ThumbnailBar />
          <CollageCanvas />
        </section>

        <!-- Controls - scrollable sidebar -->
        <aside class="lg:col-span-3 space-y-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
          <CanvasSettings />
          <ImageControls />
          <TextControls />
          <ExportControls />
        </aside>
      </div>
    </main>

    <!-- Donate Section -->
    <section class="border-t border-muted/30 dark:border-slate/30 py-8">
      <div class="container mx-auto px-4 text-center">
        <form action="https://www.paypal.com/donate" method="post" target="_top" class="inline-block">
          <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
          <button type="submit" class="px-8 py-3 bg-warm hover:bg-warm-dark text-surface-light font-semibold rounded-lg shadow-lg transition-colors duration-150 flex items-center gap-2 mx-auto">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H8.032c-.3 0-.54-.266-.475-.558l1.918-12.157-.002-.01.162-1.026a.805.805 0 0 1 .794-.68h2.535c3.238 0 5.774-1.314 6.514-5.12.132-.68.168-1.32.112-1.918a4.695 4.695 0 0 0-.544-1.736C20.183 3.505 21.538 5.978 20.067 8.478z"/>
              <path d="M18.814 1.444c-.3-.354-.664-.64-1.08-.854C16.714.09 15.483 0 13.953 0H7.95a.804.804 0 0 0-.794.68L4.97 16.806c-.07.448.26.85.715.85h5.214l1.31-8.307-.04.257a.805.805 0 0 1 .794-.68h1.656c3.238 0 5.774-1.314 6.514-5.12.13-.68.168-1.32.112-1.918-.056-.448-.172-.863-.344-1.236a4.647 4.647 0 0 0-.087-.208z"/>
            </svg>
            <span>spenden mit paypal</span>
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
  </div>
</template>
