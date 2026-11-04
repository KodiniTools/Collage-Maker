<script setup lang="ts">
  /**
   * Editor-Seite: setzt Kopfzeile, Werkzeuge, Leinwand und Inspektor zusammen.
   * Zustand der Oberfläche in `useEditorLayout`, Wiederherstellung in
   * `useRestoreDialog`, Teile unter `components/editor/`.
   */
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import ThumbnailBar from '@/components/ThumbnailBar.vue'
  import CollageCanvas from '@/components/CollageCanvas.vue'
  import TemplateLibrary from '@/components/TemplateLibrary.vue'
  import ToastContainer from '@/components/ToastContainer.vue'
  import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue'
  import HandoffReceiver from '@/components/HandoffReceiver.vue'
  import EditorHeader from '@/components/editor/EditorHeader.vue'
  import EditorToolbar from '@/components/editor/EditorToolbar.vue'
  import EditorToolPanel from '@/components/editor/EditorToolPanel.vue'
  import EditorInspector from '@/components/editor/EditorInspector.vue'
  import RestoreDialog from '@/components/editor/RestoreDialog.vue'
  import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
  import { useClipboardPaste } from '@/composables/useClipboardPaste'
  import { useAutoSave } from '@/composables/useAutoSave'
  import { useEditorLayout } from '@/composables/useEditorLayout'
  import { useRestoreDialog } from '@/composables/useRestoreDialog'
  import { handoffImageToFile, type HandoffImage } from '@/lib/core/handoff'
  import { useCollageStore } from '@/stores/collage'

  const collage = useCollageStore()
  const showTemplates = ref(false)
  const templateLibraryRef = ref<InstanceType<typeof TemplateLibrary> | null>(null)

  // Öffnet die Vorlagenbibliothek und springt direkt in den Speichern-Dialog,
  // damit die aktuelle Arbeit ohne Umweg als eigene Vorlage gesichert werden kann.
  function openSaveTemplate() {
    showTemplates.value = true
    nextTick(() => templateLibraryRef.value?.openSaveDialog())
  }

  const { activeTool, inspectorOpen, inspectorTab, selectTool, collapseOnSmallScreens } =
    useEditorLayout()

  const { showShortcutsModal, setupKeyboardListeners, cleanupKeyboardListeners } =
    useKeyboardShortcuts()
  const { setupClipboardListener, cleanupClipboardListener } = useClipboardPaste()
  const autoSave = useAutoSave()
  const {
    showRestoreDialog,
    restoreSaveDate,
    checkForSavedState,
    handleRestore,
    handleDiscardRestore,
    handleContinueWithoutRestore,
  } = useRestoreDialog(autoSave)

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
    collapseOnSmallScreens(window.innerWidth)
    checkForSavedState()
  })

  onUnmounted(() => {
    cleanupKeyboardListeners()
    cleanupClipboardListener()
  })
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-0 text-ink transition-colors">
    <EditorHeader
      @save-template="openSaveTemplate"
      @open-templates="showTemplates = true"
      @open-shortcuts="showShortcutsModal = true"
    />

    <!-- Handoff Banner -->
    <HandoffReceiver @accept="handleHandoffAccept" />

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-2 py-3 sm:px-4 sm:py-6">
      <div class="flex flex-col lg:flex-row gap-3 lg:gap-4">
        <EditorToolbar :active-tool="activeTool" @select="selectTool" />

        <EditorToolPanel :active-tool="activeTool" />

        <!-- Canvas - Expands to fill available space -->
        <section class="flex-1 min-w-0">
          <ThumbnailBar />
          <CollageCanvas />
        </section>

        <EditorInspector v-model:open="inspectorOpen" v-model:tab="inspectorTab" />
      </div>
    </main>

    <!-- Template Library Modal -->
    <TemplateLibrary ref="templateLibraryRef" v-model:is-open="showTemplates" />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal v-model="showShortcutsModal" />

    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Auto-Save Restore Dialog -->
    <RestoreDialog
      :open="showRestoreDialog"
      :save-date="restoreSaveDate"
      @restore="handleRestore"
      @discard="handleDiscardRestore"
      @continue="handleContinueWithoutRestore"
    />
  </div>
</template>
