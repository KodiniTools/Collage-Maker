import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/i18n'
import { useCollageStore } from '@/stores/collage'
import { DESKTOP_MIN_WIDTH, useEditorLayout } from '@/composables/useEditorLayout'
import { useRestoreDialog } from '@/composables/useRestoreDialog'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import EditorInspector from '@/components/editor/EditorInspector.vue'
import RestoreDialog from '@/components/editor/RestoreDialog.vue'

const t = (key: string) => i18n.global.t(key)
let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

function withSetup<T>(fn: () => T): T {
  let result: T | null = null
  mount(
    defineComponent({
      setup() {
        result = fn()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } }
  )
  return result!
}

describe('useEditorLayout', () => {
  it('startet mit Hochladen und Leinwand; erneuter Klick klappt das Werkzeug ein', () => {
    const layout = withSetup(useEditorLayout)
    expect(layout.activeTool.value).toBe('upload')
    expect(layout.inspectorOpen.value).toBe(true)
    expect(layout.inspectorTab.value).toBe('canvas')

    layout.selectTool('images')
    expect(layout.activeTool.value).toBe('images')
    layout.selectTool('images')
    expect(layout.activeTool.value).toBeNull()
  })

  it('klappt auf kleinen Bildschirmen beide Panels ein', () => {
    const layout = withSetup(useEditorLayout)
    layout.collapseOnSmallScreens(DESKTOP_MIN_WIDTH)
    expect(layout.activeTool.value).toBe('upload')
    layout.collapseOnSmallScreens(DESKTOP_MIN_WIDTH - 1)
    expect(layout.activeTool.value).toBeNull()
    expect(layout.inspectorOpen.value).toBe(false)
  })

  it('Inspektor folgt der Auswahl, bleibt aber im Text-Reiter', async () => {
    const layout = withSetup(useEditorLayout)
    const collage = useCollageStore()
    layout.inspectorOpen.value = false

    collage.selectedImageIds = ['img-1']
    await nextTick()
    expect(layout.inspectorTab.value).toBe('selection')
    expect(layout.inspectorOpen.value).toBe(true)

    collage.selectedImageIds = []
    layout.inspectorTab.value = 'text'
    layout.inspectorOpen.value = false
    collage.selectedTextId = 'text-1'
    await nextTick()
    expect(layout.inspectorTab.value).toBe('text')
    expect(layout.inspectorOpen.value).toBe(true)
  })
})

describe('useRestoreDialog', () => {
  function fakeAutoSave(hasState: boolean) {
    const date = new Date(2026, 10, 4, 5, 6)
    return {
      hasSavedState: vi.fn(() => hasState),
      getSaveDate: vi.fn(() => date),
      restoreState: vi.fn(async () => undefined),
      clearSavedState: vi.fn(),
    }
  }

  it('öffnet nur bei gespeichertem Stand und stellt wieder her', async () => {
    const empty = fakeAutoSave(false)
    const none = useRestoreDialog(empty as never)
    none.checkForSavedState()
    expect(none.showRestoreDialog.value).toBe(false)

    const saved = fakeAutoSave(true)
    const dialog = useRestoreDialog(saved as never)
    dialog.checkForSavedState()
    expect(dialog.showRestoreDialog.value).toBe(true)
    expect(dialog.restoreSaveDate.value).toEqual(saved.getSaveDate())
    await dialog.handleRestore()
    expect(saved.restoreState).toHaveBeenCalledTimes(1)
    expect(dialog.showRestoreDialog.value).toBe(false)
  })

  it('verwirft oder ignoriert den gespeicherten Stand', () => {
    const saved = fakeAutoSave(true)
    const dialog = useRestoreDialog(saved as never)
    dialog.checkForSavedState()
    dialog.handleContinueWithoutRestore()
    expect(dialog.showRestoreDialog.value).toBe(false)
    expect(saved.clearSavedState).not.toHaveBeenCalled()

    dialog.checkForSavedState()
    dialog.handleDiscardRestore()
    expect(saved.clearSavedState).toHaveBeenCalledTimes(1)
  })
})

describe('Editor-Komponenten', () => {
  function buttonByLabel(wrapper: ReturnType<typeof mount>, label: string) {
    return wrapper.get(`button[aria-label="${label}"]`)
  }

  it('EditorHeader meldet Vorlagen- und Tastenkürzel-Aktionen', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    })
    const wrapper = mount(EditorHeader, { global: { plugins: [pinia, i18n, router] } })
    expect(wrapper.get('h1').text()).toBe(t('app.title'))
    await buttonByLabel(wrapper, t('templates.saveAsCurrent')).trigger('click')
    await buttonByLabel(wrapper, t('templates.library')).trigger('click')
    await buttonByLabel(wrapper, t('shortcuts.title')).trigger('click')
    expect(wrapper.emitted('save-template')).toHaveLength(1)
    expect(wrapper.emitted('open-templates')).toHaveLength(1)
    expect(wrapper.emitted('open-shortcuts')).toHaveLength(1)
    expect(
      buttonByLabel(wrapper, `${t('shortcuts.undo')} (Ctrl+Z)`).attributes('disabled')
    ).toBeDefined()
  })

  it('EditorToolbar markiert das aktive Werkzeug und meldet die Auswahl', async () => {
    const wrapper = mount(EditorToolbar, {
      props: { activeTool: 'upload' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.findAll('nav button')).toHaveLength(5)
    expect(buttonByLabel(wrapper, t('upload.title')).attributes('aria-pressed')).toBe('true')
    await buttonByLabel(wrapper, t('images.title')).trigger('click')
    expect(wrapper.emitted('select')).toEqual([['images']])
  })

  it('EditorInspector klappt ein und aus', async () => {
    const wrapper = mount(EditorInspector, {
      props: {
        open: true,
        tab: 'export' as const,
        'onUpdate:open': (v: boolean) => wrapper.setProps({ open: v }),
      },
      global: { plugins: [pinia, i18n], stubs: { ExportControls: true, teleport: true } },
    })
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    await buttonByLabel(wrapper, t('editor.hidePanel')).trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
    await buttonByLabel(wrapper, t('editor.showSettings')).trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('RestoreDialog zeigt das Datum und meldet die drei Aktionen', async () => {
    const date = new Date(2026, 10, 4, 5, 6)
    const wrapper = mount(RestoreDialog, {
      props: { open: true, saveDate: date },
      global: { plugins: [i18n], stubs: { teleport: true } },
    })
    expect(wrapper.text()).toContain(date.toLocaleString())
    for (const [key, event] of [
      ['autoSave.restore', 'restore'],
      ['autoSave.discard', 'discard'],
      ['autoSave.continueWithout', 'continue'],
    ] as const) {
      await wrapper
        .findAll('button')
        .find((b) => b.text() === t(key))!
        .trigger('click')
      expect(wrapper.emitted(event)).toHaveLength(1)
    }
  })
})
