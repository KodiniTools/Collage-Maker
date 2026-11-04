<script setup lang="ts">
  /**
   * Inspektor rechts: folgt der Auswahl (Bild / Text / Leinwand / Export).
   * Liegt im Fluss und überdeckt die Leinwand nie.
   */
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import CanvasSettings from '@/components/CanvasSettings.vue'
  import ImageControls from '@/components/ImageControls.vue'
  import TextList from '@/components/TextList.vue'
  import TextControls from '@/components/TextControls.vue'
  import ExportControls from '@/components/ExportControls.vue'
  import { UiButton, UiIconButton, UiSegmentedControl } from '@/components/ui'
  import type { InspectorTab } from '@/composables/useEditorLayout'
  import { useCollageStore } from '@/stores/collage'

  const open = defineModel<boolean>('open', { required: true })
  const tab = defineModel<InspectorTab>('tab', { required: true })

  const { t } = useI18n()
  const collage = useCollageStore()

  // Reiter des Inspektors (Text jetzt hier statt in der linken Leiste)
  const inspectorTabs: { id: InspectorTab; label: string }[] = [
    { id: 'selection', label: 'editor.tabSelection' },
    { id: 'text', label: 'text.title' },
    { id: 'canvas', label: 'editor.tabCanvas' },
    { id: 'export', label: 'editor.tabExport' },
  ]

  // UiSegmentedControl arbeitet mit string; der Proxy hält den Union-Typ im State.
  const inspectorOptions = computed(() =>
    inspectorTabs.map((item) => ({ value: item.id, label: t(item.label) }))
  )
  const inspectorTabModel = computed({
    get: () => tab.value as string,
    set: (value) => {
      tab.value = value as InspectorTab
    },
  })
</script>

<template>
  <aside
    class="w-full flex-shrink-0 lg:self-start transition-all duration-slow"
    :class="open ? 'lg:w-80 xl:w-96' : 'lg:w-12'"
  >
    <template v-if="open">
      <!-- Reiter + Einklappen -->
      <div class="flex items-center gap-1 mb-3">
        <UiSegmentedControl
          v-model="inspectorTabModel"
          class="inspector-tabs"
          :options="inspectorOptions"
          :label="t('editor.settings')"
          size="sm"
        />
        <UiIconButton :label="t('editor.hidePanel')" @click="open = false">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </UiIconButton>
      </div>

      <!-- Inhalt je nach Reiter -->
      <div class="space-y-6 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
        <template v-if="tab === 'selection'">
          <TextControls v-if="collage.selectedTextId" />
          <ImageControls v-else />
        </template>
        <template v-else-if="tab === 'text'">
          <TextList />
          <TextControls v-if="collage.selectedTextId" />
        </template>
        <CanvasSettings v-else-if="tab === 'canvas'" />
        <ExportControls v-else />
      </div>
    </template>

    <!-- Eingeklappt: Wieder-Öffnen -->
    <template v-else>
      <div class="hidden lg:flex justify-center">
        <UiIconButton :label="t('editor.showSettings')" variant="secondary" @click="open = true">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </UiIconButton>
      </div>
      <div class="lg:hidden">
        <UiButton variant="secondary" block @click="open = true">
          <template #icon>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
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
          </template>
          {{ t('editor.showSettings') }}
        </UiButton>
      </div>
    </template>
  </aside>
</template>

<style scoped>
  /* Reiter füllen die Breite des Inspektors, jede Option gleich breit. */
  .inspector-tabs {
    flex: 1 1 0;
    min-width: 0;
  }

  .inspector-tabs :deep(.ui-segmented__option) {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 var(--ds-space-2);
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
