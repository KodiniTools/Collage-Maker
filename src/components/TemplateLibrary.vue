<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTemplatesStore } from '@/stores/templates'
  import { useCollageStore } from '@/stores/collage'
  import { useToastStore } from '@/stores/toast'
  import { TEMPLATE_FALLBACK_IMAGE_PX, TEMPLATE_FALLBACK_JPEG_QUALITY } from '@/config/constants'
  import TemplateCard from './TemplateCard.vue'
  import type { Template } from '@/stores/templates'
  import {
    UiButton,
    UiDialog,
    UiEmptyState,
    UiIconButton,
    UiSegmentedControl,
    UiTextField,
  } from '@/components/ui'

  type TemplateTab = 'all' | 'predefined' | 'user'

  const { t } = useI18n()
  const templatesStore = useTemplatesStore()
  const collageStore = useCollageStore()
  const toast = useToastStore()

  const isOpen = defineModel<boolean>('isOpen', { required: true })
  const activeTab = ref<TemplateTab>('all')
  const templateName = ref('')
  const templateDescription = ref('')
  const nameError = ref('')
  const showSaveDialog = ref(false)
  const templateToDelete = ref<string | null>(null)

  // UiSegmentedControl arbeitet mit string; der Proxy hält den Union-Typ im State.
  const tabModel = computed({
    get: () => activeTab.value as string,
    set: (value) => {
      activeTab.value = value as TemplateTab
    },
  })
  const tabOptions = computed(() => [
    { value: 'all', label: t('templates.all') },
    { value: 'predefined', label: t('templates.predefined') },
    { value: 'user', label: `${t('templates.custom')} (${templatesStore.userTemplates.length})` },
  ])

  // Lade Templates beim ersten Öffnen
  let templatesLoaded = false
  watch(
    isOpen,
    (newValue) => {
      if (newValue && !templatesLoaded) {
        templatesStore.loadPredefinedTemplates()
        templatesStore.loadUserTemplates()
        templatesLoaded = true
      }
    },
    { immediate: true }
  )

  // Fehlermeldung verschwindet, sobald wieder getippt wird.
  watch(templateName, () => {
    nameError.value = ''
  })

  const filteredTemplates = computed(() => {
    const all = templatesStore.getAllTemplates()
    if (activeTab.value === 'predefined') {
      return all.filter((t) => t.category === 'predefined')
    }
    if (activeTab.value === 'user') {
      return all.filter((t) => t.category === 'user')
    }
    return all
  })

  function loadTemplate(template: Template) {
    // Vorlage anwenden, ohne die aktuelle Arbeit zu verwerfen: Presets behalten
    // die hochgeladenen Bilder, und jede Anwendung ist per Toast/Strg+Z
    // rückgängig zu machen. Deshalb kein blockierender Warndialog mehr.
    collageStore.loadFromTemplate(template)
    collageStore.showUndoToast('toast.templateApplied')
    isOpen.value = false
  }

  function requestDeleteTemplate(id: string) {
    templateToDelete.value = id
  }

  function confirmDeleteTemplate() {
    if (templateToDelete.value) templatesStore.deleteUserTemplate(templateToDelete.value)
    templateToDelete.value = null
  }

  function openSaveDialog() {
    showSaveDialog.value = true
    templateName.value = `Template ${new Date().toLocaleDateString()}`
    templateDescription.value = ''
    nameError.value = ''
  }

  async function saveCurrentAsTemplate() {
    if (!templateName.value.trim()) {
      nameError.value = t('templates.nameRequired')
      return
    }

    const name = templateName.value.trim()
    const description = templateDescription.value.trim()

    try {
      // 1. Versuch: Standard-Bildqualität
      let template = await collageStore.saveAsTemplate(name, description)
      let saved = templatesStore.addUserTemplate(template)

      // 2. Fallback: kleinere/geringer komprimierte Bilder, falls die
      //    Speicher-Quota beim ersten Versuch überschritten wurde.
      if (!saved) {
        template = await collageStore.saveAsTemplate(name, description, {
          maxImagePx: TEMPLATE_FALLBACK_IMAGE_PX,
          quality: TEMPLATE_FALLBACK_JPEG_QUALITY,
        })
        saved = templatesStore.addUserTemplate(template)
      }

      if (!saved) {
        // Auch der Fallback passt nicht in den Speicher -> sichtbarer Fehler.
        toast.error(t('templates.saveError'))
        return
      }

      toast.notify('templates.saveSuccess', t('templates.saveSuccess'))
      showSaveDialog.value = false
      templateName.value = ''
      templateDescription.value = ''
      activeTab.value = 'user'
    } catch (error) {
      console.error('Vorlage speichern fehlgeschlagen:', error)
      toast.error(t('templates.saveError'))
    }
  }

  function closeModal() {
    isOpen.value = false
    showSaveDialog.value = false
  }

  // Ermöglicht dem Editor, die Bibliothek direkt im Speichern-Modus zu öffnen.
  defineExpose({ openSaveDialog })
</script>

<template>
  <!-- Modal Overlay: breit (Kartenraster), deshalb kein UiDialog -->
  <Teleport to="#modal-portal">
    <Transition
      enter-active-class="transition-opacity"
      leave-active-class="transition-opacity"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-backdrop flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Explizite Textfarbe: Das Modal wird per <Teleport> aus dem themed
             Editor-Wrapper herausgelöst und erbt dessen Standardfarbe nicht mehr. -->
        <div
          class="bg-surface-1 text-ink rounded-lg border border-line shadow-overlay w-full max-w-6xl max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between gap-3 p-3 sm:p-5 border-b border-line">
            <h2 class="text-lg sm:text-xl font-semibold text-ink">
              {{ t('templates.library') }}
            </h2>
            <UiIconButton :label="t('common.close')" @click="closeModal">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiIconButton>
          </div>

          <!-- Tabs + Save Button -->
          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-5 border-b border-line"
          >
            <UiSegmentedControl
              v-model="tabModel"
              :options="tabOptions"
              :label="t('templates.library')"
            />
            <UiButton variant="primary" @click="openSaveDialog">
              {{ t('templates.saveAsCurrent') }}
            </UiButton>
          </div>

          <!-- Templates Grid -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-5">
            <UiEmptyState
              v-if="filteredTemplates.length === 0"
              :title="t('templates.noTemplates')"
            />

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <TemplateCard
                v-for="template in filteredTemplates"
                :key="template.id"
                :template="template"
                :can-delete="template.category === 'user'"
                @load="loadTemplate"
                @delete="requestDeleteTemplate"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Save Dialog -->
  <UiDialog
    teleport-to="#modal-portal"
    :open="showSaveDialog"
    :title="t('templates.saveAsCurrent')"
    :close-label="t('common.close')"
    @close="showSaveDialog = false"
  >
    <div class="space-y-4">
      <UiTextField
        v-model="templateName"
        :label="t('templates.templateName')"
        :placeholder="t('templates.namePlaceholder')"
        :error="nameError"
        required
        @keydown.enter="saveCurrentAsTemplate"
      />
      <div>
        <label for="template-description" class="block text-sm font-medium mb-2 text-ink">
          {{ t('templates.templateDescription') }}
        </label>
        <textarea
          id="template-description"
          v-model="templateDescription"
          rows="3"
          class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-ink text-sm resize-none focus-visible:outline-none focus-visible:shadow-focus"
          :placeholder="t('templates.descriptionPlaceholder')"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <UiButton variant="secondary" @click="showSaveDialog = false">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton variant="primary" @click="saveCurrentAsTemplate">
        {{ t('common.save') }}
      </UiButton>
    </template>
  </UiDialog>

  <!-- Delete Confirmation -->
  <UiDialog
    teleport-to="#modal-portal"
    :open="templateToDelete !== null"
    :title="t('templates.deleteTemplate')"
    :description="t('templates.confirmDelete')"
    :close-label="t('common.close')"
    @close="templateToDelete = null"
  >
    <template #footer>
      <UiButton variant="secondary" @click="templateToDelete = null">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton variant="danger" @click="confirmDeleteTemplate">
        {{ t('templates.deleteTemplate') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
