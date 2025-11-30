<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTemplatesStore } from '@/stores/templates'
import { useCollageStore } from '@/stores/collage'
import TemplateCard from './TemplateCard.vue'
import type { Template } from '@/stores/templates'

const { t } = useI18n()
const templatesStore = useTemplatesStore()
const collageStore = useCollageStore()

const isOpen = defineModel<boolean>('isOpen', { required: true })
const activeTab = ref<'all' | 'predefined' | 'user'>('all')
const templateName = ref('')
const templateDescription = ref('')
const showSaveDialog = ref(false)

// Lade Templates beim ersten Öffnen
let templatesLoaded = false
watch(isOpen, (newValue) => {
  if (newValue && !templatesLoaded) {
    templatesStore.loadPredefinedTemplates()
    templatesStore.loadUserTemplates()
    templatesLoaded = true
  }
}, { immediate: true })

const filteredTemplates = computed(() => {
  const all = templatesStore.getAllTemplates()
  if (activeTab.value === 'predefined') {
    return all.filter(t => t.category === 'predefined')
  }
  if (activeTab.value === 'user') {
    return all.filter(t => t.category === 'user')
  }
  return all
})

function loadTemplate(template: Template) {
  if (confirm(t('templates.confirmLoad'))) {
    collageStore.loadFromTemplate(template)
    isOpen.value = false
  }
}

function deleteTemplate(id: string) {
  if (confirm(t('templates.confirmDelete'))) {
    templatesStore.deleteUserTemplate(id)
  }
}

function openSaveDialog() {
  showSaveDialog.value = true
  templateName.value = `Template ${new Date().toLocaleDateString()}`
  templateDescription.value = ''
}

async function saveCurrentAsTemplate() {
  if (!templateName.value.trim()) {
    alert(t('templates.nameRequired'))
    return
  }

  const template = await collageStore.saveAsTemplate(
    templateName.value.trim(),
    templateDescription.value.trim()
  )

  templatesStore.addUserTemplate(template)
  showSaveDialog.value = false
  templateName.value = ''
  templateDescription.value = ''
  activeTab.value = 'user'
}

function closeModal() {
  isOpen.value = false
  showSaveDialog.value = false
}
</script>

<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Modal Content -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-muted/30 dark:border-slate/30">
            <h2 class="text-2xl font-bold">{{ t('templates.library') }}</h2>
            <button
              @click="closeModal"
              class="p-2 hover:bg-muted/20 dark:hover:bg-slate/30 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tabs + Save Button -->
          <div class="flex items-center justify-between p-6 border-b border-muted/30 dark:border-slate/30">
            <div class="flex gap-2">
              <button
                @click="activeTab = 'all'"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'all'
                    ? 'bg-accent text-slate-dark'
                    : 'bg-muted/10 dark:bg-slate/30 hover:bg-muted/20 dark:hover:bg-slate/50'
                ]"
              >
                {{ t('templates.all') }}
              </button>
              <button
                @click="activeTab = 'predefined'"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'predefined'
                    ? 'bg-accent text-slate-dark'
                    : 'bg-muted/10 dark:bg-slate/30 hover:bg-muted/20 dark:hover:bg-slate/50'
                ]"
              >
                {{ t('templates.predefined') }}
              </button>
              <button
                @click="activeTab = 'user'"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'user'
                    ? 'bg-accent text-slate-dark'
                    : 'bg-muted/10 dark:bg-slate/30 hover:bg-muted/20 dark:hover:bg-slate/50'
                ]"
              >
                {{ t('templates.custom') }} ({{ templatesStore.userTemplates.length }})
              </button>
            </div>

            <button
              @click="openSaveDialog"
              class="px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-medium transition-colors"
            >
              {{ t('templates.saveAsCurrent') }}
            </button>
          </div>

          <!-- Templates Grid -->
          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="filteredTemplates.length === 0" class="text-center py-12 text-muted">
              {{ t('templates.noTemplates') }}
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <TemplateCard
                v-for="template in filteredTemplates"
                :key="template.id"
                :template="template"
                :can-delete="template.category === 'user'"
                @load="loadTemplate"
                @delete="deleteTemplate"
              />
            </div>
          </div>
        </div>

        <!-- Save Dialog -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showSaveDialog"
            class="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
            @click.self="showSaveDialog = false"
          >
            <div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-md p-6">
              <h3 class="text-xl font-bold mb-4">{{ t('templates.saveAsCurrent') }}</h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ t('templates.templateName') }} *
                  </label>
                  <input
                    v-model="templateName"
                    type="text"
                    class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-lg bg-surface-light dark:bg-surface-dark focus:ring-2 focus:ring-accent outline-none"
                    :placeholder="t('templates.namePlaceholder')"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ t('templates.templateDescription') }}
                  </label>
                  <textarea
                    v-model="templateDescription"
                    rows="3"
                    class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-lg bg-surface-light dark:bg-surface-dark focus:ring-2 focus:ring-accent outline-none resize-none"
                    :placeholder="t('templates.descriptionPlaceholder')"
                  ></textarea>
                </div>
              </div>

              <div class="flex gap-3 mt-6">
                <button
                  @click="showSaveDialog = false"
                  class="flex-1 px-4 py-2 border border-muted/50 dark:border-slate rounded-lg hover:bg-muted/10 dark:hover:bg-slate/30 transition-colors"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  @click="saveCurrentAsTemplate"
                  class="flex-1 px-4 py-2 bg-accent hover:bg-accent-dark text-slate-dark rounded-lg font-medium transition-colors"
                >
                  {{ t('common.save') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
