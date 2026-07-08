<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import ImageUploader from '@/components/ImageUploader.vue'
  import LayoutSelector from '@/components/LayoutSelector.vue'
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
  import { useClipboardPaste } from '@/composables/useClipboardPaste'
  import HandoffReceiver from '@/components/HandoffReceiver.vue'
  import { handoffImageToFile, type HandoffImage } from '@/lib/core/handoff'
  import { useCollageStore } from '@/stores/collage'
  import { useAutoSave } from '@/composables/useAutoSave'

  const { t } = useI18n()
  const showTemplates = ref(false)
  const showRestoreDialog = ref(false)
  const restoreSaveDate = ref<Date | null>(null)
  const collage = useCollageStore()

  // ── Neues Layout: Icon-Leiste + kontextbezogenes Werkzeug-Panel (links)
  //    und ein auswahlabhängiger Inspektor (rechts). Alle Panels liegen im
  //    Fluss (flex) – sie verkleinern die Leinwand, überdecken sie nie.
  type ToolTab = 'upload' | 'layouts' | 'images' | null
  type InspectorTab = 'selection' | 'text' | 'canvas' | 'export'

  const activeTool = ref<ToolTab>('upload')
  const inspectorOpen = ref(true)
  const inspectorTab = ref<InspectorTab>('canvas')

  // Werkzeuge der Icon-Leiste (Reihenfolge = Anzeige). Icons als SVG-Pfad.
  const tools: { id: Exclude<ToolTab, null>; label: string; icon: string }[] = [
    {
      id: 'upload',
      label: 'upload.title',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'layouts',
      label: 'layout.title',
      icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    },
    {
      id: 'images',
      label: 'images.title',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
  ]

  // Reiter des Inspektors (Text jetzt hier statt in der linken Leiste)
  const inspectorTabs: { id: InspectorTab; label: string }[] = [
    { id: 'selection', label: 'editor.tabSelection' },
    { id: 'text', label: 'text.title' },
    { id: 'canvas', label: 'editor.tabCanvas' },
    { id: 'export', label: 'editor.tabExport' },
  ]

  // Icon-Leiste: aktives Werkzeug erneut anklicken klappt das Panel ein
  function selectTool(tool: Exclude<ToolTab, null>) {
    activeTool.value = activeTool.value === tool ? null : tool
  }

  // Inspektor folgt der Auswahl: Bild/Text markiert → Reiter "Auswahl"
  watch(
    () => [collage.selectedImageId, collage.selectedTextId] as const,
    ([imgId, textId]) => {
      if (imgId || textId) {
        // Ist der Nutzer bereits im Text-Reiter und wählt einen Text aus,
        // dort bleiben – die Bearbeitung wird inline unter der Liste angezeigt.
        if (textId && inspectorTab.value === 'text') {
          inspectorOpen.value = true
          return
        }
        inspectorTab.value = 'selection'
        inspectorOpen.value = true
      }
    }
  )

  const { showShortcutsModal, setupKeyboardListeners, cleanupKeyboardListeners } =
    useKeyboardShortcuts()
  const { setupClipboardListener, cleanupClipboardListener } = useClipboardPaste()
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

  async function handleHandoffAccept(images: HandoffImage[]) {
    const files: File[] = []
    for (const img of images) {
      const file = await handoffImageToFile(img)
      files.push(file)
    }
    if (files.length) {
      collage.addImages(files)
    }
  }

  onMounted(() => {
    setupKeyboardListeners()
    setupClipboardListener()
    autoSave.setupAutoSave()

    // Auf kleinen Bildschirmen: Panels eingeklappt starten, damit die
    // Leinwand oben sofort sichtbar ist (Panels schieben Inhalt nur nach unten).
    if (window.innerWidth < 1024) {
      activeTool.value = null
      inspectorOpen.value = false
    }

    // Prüfe ob gespeicherte Daten vorhanden sind
    if (autoSave.hasSavedState()) {
      restoreSaveDate.value = autoSave.getSaveDate()
      showRestoreDialog.value = true
    }
  })

  onUnmounted(() => {
    cleanupKeyboardListeners()
    cleanupClipboardListener()
  })
</script>

<template>
  <div
    class="flex flex-col min-h-screen bg-page-gradient text-slate-dark dark:text-muted-light transition-colors"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-muted/30 dark:border-slate/30"
    >
      <div class="container mx-auto px-2 py-2 sm:px-4 sm:py-4 flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Back to Landing Button -->
          <RouterLink
            to="/"
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
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
          <div>
            <h1 class="text-lg sm:text-2xl font-bold">{{ t('app.title') }}</h1>
            <p class="text-xs sm:text-sm text-muted dark:text-muted hidden sm:block">
              {{ t('app.subtitle') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 sm:gap-3">
          <!-- Undo/Redo Buttons -->
          <div class="flex items-center gap-1 mr-1 sm:mr-2">
            <button
              :disabled="!collage.canUndo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-navy/20"
              :title="`${t('shortcuts.undo')} (Ctrl+Z)`"
              @click="collage.undo"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
            </button>
            <button
              :disabled="!collage.canRedo"
              class="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/20 dark:hover:bg-navy/20"
              :title="`${t('shortcuts.redo')} (Ctrl+Y)`"
              @click="collage.redo"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
                />
              </svg>
            </button>
          </div>

          <button
            class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-medium transition-colors flex items-center gap-2"
            @click="showTemplates = true"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            <span class="hidden sm:inline">{{ t('templates.library') }}</span>
          </button>
          <button
            class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors"
            :title="t('shortcuts.title')"
            :aria-label="t('shortcuts.title')"
            @click="showShortcutsModal = true"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Handoff Banner -->
    <HandoffReceiver @accept="handleHandoffAccept" />

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-2 py-3 sm:px-4 sm:py-6">
      <div class="flex flex-col lg:flex-row gap-3 lg:gap-4">
        <!-- Icon-Leiste: wechselt das Werkzeug-Panel. Aktives Werkzeug erneut
             anklicken klappt das Panel ein. Immer sichtbar, immer im Fluss. -->
        <nav
          class="flex lg:flex-col gap-1.5 p-1.5 flex-shrink-0 lg:self-start overflow-x-auto bg-surface-light dark:bg-surface-dark rounded-xl border border-muted/30 dark:border-slate/30"
          :aria-label="t('editor.tools')"
        >
          <button
            v-for="tool in tools"
            :key="tool.id"
            class="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors"
            :class="
              activeTool === tool.id
                ? 'bg-accent/20 text-slate-dark dark:text-accent'
                : 'text-muted hover:bg-muted/15 dark:hover:bg-navy/40'
            "
            :title="t(tool.label)"
            :aria-label="t(tool.label)"
            :aria-pressed="activeTool === tool.id"
            @click="selectTool(tool.id)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                :d="tool.icon"
              />
            </svg>
          </button>
        </nav>

        <!-- Kontext-Panel: zeigt nur das aktive Werkzeug. Liegt im Fluss und
             verkleinert die Leinwand, statt sie zu überdecken. -->
        <aside
          v-if="activeTool"
          class="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:self-start bg-surface-light dark:bg-surface-dark rounded-xl border border-muted/30 dark:border-slate/30 p-4 lg:max-h-[calc(100vh-8rem)] overflow-y-auto"
        >
          <ImageUploader v-if="activeTool === 'upload'" />
          <LayoutSelector v-else-if="activeTool === 'layouts'" />
          <ImageList v-else-if="activeTool === 'images'" />
        </aside>

        <!-- Canvas - Expands to fill available space -->
        <section class="flex-1 min-w-0">
          <ThumbnailBar />
          <CollageCanvas />
        </section>

        <!-- Inspektor: folgt der Auswahl (Bild / Text / Leinwand / Export).
             Liegt im Fluss und überdeckt die Leinwand nie. -->
        <aside
          class="w-full flex-shrink-0 lg:self-start transition-all duration-300"
          :class="inspectorOpen ? 'lg:w-80 xl:w-96' : 'lg:w-12'"
        >
          <template v-if="inspectorOpen">
            <!-- Reiter + Einklappen -->
            <div class="flex items-center gap-1 mb-3">
              <div
                class="flex-1 flex gap-1 p-1 bg-muted/15 dark:bg-navy/40 rounded-xl overflow-hidden"
              >
                <button
                  v-for="tab in inspectorTabs"
                  :key="tab.id"
                  class="flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors truncate"
                  :class="
                    inspectorTab === tab.id
                      ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-slate-dark dark:text-white'
                      : 'text-muted hover:text-slate-dark dark:hover:text-white'
                  "
                  :aria-pressed="inspectorTab === tab.id"
                  @click="inspectorTab = tab.id"
                >
                  {{ t(tab.label) }}
                </button>
              </div>
              <button
                class="p-2 rounded-lg hover:bg-muted/20 dark:hover:bg-navy/20 transition-colors flex-shrink-0"
                :title="t('editor.hidePanel')"
                :aria-label="t('editor.hidePanel')"
                @click="inspectorOpen = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <!-- Inhalt je nach Reiter -->
            <div class="space-y-6 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
              <template v-if="inspectorTab === 'selection'">
                <TextControls v-if="collage.selectedTextId" />
                <ImageControls v-else />
              </template>
              <template v-else-if="inspectorTab === 'text'">
                <div
                  class="bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
                >
                  <TextList />
                </div>
                <TextControls v-if="collage.selectedTextId" />
              </template>
              <CanvasSettings v-else-if="inspectorTab === 'canvas'" />
              <div
                v-else
                class="bg-surface-light dark:bg-surface-dark rounded-lg border border-muted/30 dark:border-slate/30 p-4"
              >
                <ExportControls />
              </div>
            </div>
          </template>

          <!-- Eingeklappt: Wieder-Öffnen -->
          <template v-else>
            <button
              class="hidden lg:flex w-10 h-10 mx-auto rounded-lg bg-muted/20 dark:bg-navy/20 hover:bg-muted/40 dark:hover:bg-navy/40 items-center justify-center transition-colors"
              :title="t('editor.showSettings')"
              :aria-label="t('editor.showSettings')"
              @click="inspectorOpen = true"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              class="lg:hidden w-full px-4 py-2.5 rounded-lg bg-muted/15 dark:bg-navy/40 hover:bg-muted/25 dark:hover:bg-navy/60 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              @click="inspectorOpen = true"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {{ t('editor.showSettings') }}
            </button>
          </template>
        </aside>
      </div>
    </main>

    <!-- Donate Section -->
    <section class="border-t border-muted/30 dark:border-slate/30 py-8">
      <div class="container mx-auto px-4 text-center">
        <form
          action="https://www.paypal.com/donate"
          method="post"
          target="_top"
          class="inline-block"
        >
          <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
          <button
            type="submit"
            class="px-4 py-2 sm:px-8 sm:py-3 bg-warm hover:bg-warm-dark text-surface-light font-semibold rounded-lg shadow-lg transition-colors duration-150 flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H8.032c-.3 0-.54-.266-.475-.558l1.918-12.157-.002-.01.162-1.026a.805.805 0 0 1 .794-.68h2.535c3.238 0 5.774-1.314 6.514-5.12.132-.68.168-1.32.112-1.918a4.695 4.695 0 0 0-.544-1.736C20.183 3.505 21.538 5.978 20.067 8.478z"
              />
              <path
                d="M18.814 1.444c-.3-.354-.664-.64-1.08-.854C16.714.09 15.483 0 13.953 0H7.95a.804.804 0 0 0-.794.68L4.97 16.806c-.07.448.26.85.715.85h5.214l1.31-8.307-.04.257a.805.805 0 0 1 .794-.68h1.656c3.238 0 5.774-1.314 6.514-5.12.13-.68.168-1.32.112-1.918-.056-.448-.172-.863-.344-1.236a4.647 4.647 0 0 0-.087-.208z"
              />
            </svg>
            <span>{{ t('editor.donate') }}</span>
          </button>
        </form>
      </div>
    </section>

    <!-- Template Library Modal -->
    <TemplateLibrary v-model:is-open="showTemplates" />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal v-model="showShortcutsModal" />

    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Auto-Save Restore Dialog -->
    <Teleport to="#modal-portal">
      <div
        v-if="showRestoreDialog"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div
          class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-muted/20 dark:border-white/10"
        >
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div
              class="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">
            {{ t('autoSave.restoreTitle') }}
          </h3>

          <!-- Description -->
          <p class="text-slate-600 dark:text-slate-300 text-center mb-2">
            {{ t('autoSave.restoreDescription') }}
          </p>

          <!-- Save Date -->
          <p
            v-if="restoreSaveDate"
            class="text-sm text-slate-500 dark:text-slate-400 text-center mb-6"
          >
            {{ t('autoSave.savedAt') }}: {{ restoreSaveDate.toLocaleString() }}
          </p>

          <!-- Buttons -->
          <div class="flex flex-col gap-3">
            <button
              class="w-full px-4 py-3 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-semibold transition-colors"
              @click="handleRestore"
            >
              {{ t('autoSave.restore') }}
            </button>
            <button
              class="w-full px-4 py-2 bg-muted/20 hover:bg-muted/30 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              @click="handleContinueWithoutRestore"
            >
              {{ t('autoSave.continueWithout') }}
            </button>
            <button
              class="w-full px-4 py-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors"
              @click="handleDiscardRestore"
            >
              {{ t('autoSave.discard') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
