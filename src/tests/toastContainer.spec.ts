import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ToastContainer from '@/components/ToastContainer.vue'
import { useToastStore } from '@/stores/toast'
import { i18n } from '@/i18n'

function mountContainer() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(ToastContainer, {
    global: { plugins: [pinia, i18n], stubs: { teleport: true } },
  })
  return { wrapper, store: useToastStore() }
}

describe('ToastContainer (UiToast)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('zeigt Toasts des Stores als UiToast mit Statusrolle', async () => {
    const { wrapper, store } = mountContainer()
    store.success('Collage exportiert', 0)
    store.error('Export fehlgeschlagen', 0)
    await wrapper.vm.$nextTick()

    const toasts = wrapper.findAll('.ui-toast')
    expect(toasts).toHaveLength(2)
    expect(toasts[0].classes()).toContain('ui-toast--success')
    expect(toasts[0].attributes('role')).toBe('status')
    expect(toasts[1].attributes('role')).toBe('alert')
    expect(toasts[0].text()).toContain('Collage exportiert')
  })

  it('bietet bei abschaltbaren Meldungen „Nicht mehr anzeigen“ als Aktion', async () => {
    const { wrapper, store } = mountContainer()
    store.notify('toast.layoutApplied', 'Layout angewendet', 'info', 0)
    await wrapper.vm.$nextTick()

    const action = wrapper.get('.ui-toast .ui-button')
    expect(action.text()).toBe(i18n.global.t('toast.dontShowAgain'))
    await action.trigger('click')

    expect(store.isDismissed('toast.layoutApplied')).toBe(true)
    expect(wrapper.findAll('.ui-toast')).toHaveLength(0)
  })

  it('führt eine eigene Aktion aus und entfernt den Toast', async () => {
    const { wrapper, store } = mountContainer()
    let undone = false
    store.showToast('Bild gelöscht', 'info', 0, {
      label: 'Rückgängig',
      handler: () => {
        undone = true
      },
    })
    await wrapper.vm.$nextTick()

    const action = wrapper.get('.ui-toast .ui-button')
    expect(action.text()).toBe('Rückgängig')
    await action.trigger('click')

    expect(undone).toBe(true)
    expect(store.toasts).toHaveLength(0)
  })

  it('schließt über den Schließen-Button', async () => {
    const { wrapper, store } = mountContainer()
    store.info('Hinweis', 0)
    await wrapper.vm.$nextTick()

    await wrapper.get('.ui-toast .ui-icon-button').trigger('click')
    expect(store.toasts).toHaveLength(0)
  })
})
