import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { i18n } from '@/i18n'
import { useCollageStore } from '@/stores/collage'
import { useTextControls, type TextControlsApi } from '@/composables/useTextControls'
import TextControls from '@/components/TextControls.vue'

const t = (key: string) => i18n.global.t(key)
let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

function setupApi(): TextControlsApi {
  let api: TextControlsApi | null = null
  mount(
    defineComponent({
      setup() {
        api = useTextControls()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } }
  )
  return api!
}

function withText() {
  const collage = useCollageStore()
  collage.addText('Hallo')
  return collage
}

describe('useTextControls', () => {
  it('ändert nichts ohne gewählten Text', () => {
    const collage = useCollageStore()
    const api = setupApi()
    const undo = vi.spyOn(collage, 'saveStateForUndo')
    api.toggleShadow()
    api.updateFontSize(80)
    api.deleteText()
    expect(undo).not.toHaveBeenCalled()
    expect(collage.texts).toHaveLength(0)
  })

  it('aktualisiert Inhalt, Größe, Laufweite und Farben der gewählten Ebene', () => {
    const collage = withText()
    const api = setupApi()
    api.updateTextContent('Neu')
    api.updateFontSize(80)
    api.updateLetterSpacing(3)
    api.updateColor('#ff0000')
    api.updateShadowColor('#00ff00')
    api.updateStrokeColor('#0000ff')
    api.updateStrokeWidth(5)
    expect(collage.selectedText).toMatchObject({
      text: 'Neu',
      fontSize: 80,
      letterSpacing: 3,
      color: '#ff0000',
      shadowColor: '#00ff00',
      strokeColor: '#0000ff',
      strokeWidth: 5,
    })
  })

  it('schaltet Fett, Schatten, Kontur und Ausrichtung mit sofortigem Undo', () => {
    const collage = withText()
    const api = setupApi()
    const undo = vi.spyOn(collage, 'saveStateForUndo')

    expect(api.isBold.value).toBe(false)
    api.toggleFontWeight()
    expect(collage.selectedText?.fontWeight).toBe(700)
    expect(api.isBold.value).toBe(true)

    api.toggleShadow()
    api.toggleStroke()
    expect(collage.selectedText?.shadowEnabled).toBe(true)
    expect(collage.selectedText?.strokeEnabled).toBe(true)

    expect(api.alignModel.value).toBe('center')
    api.alignModel.value = 'right'
    expect(collage.selectedText?.textAlign).toBe('right')
    expect(undo).toHaveBeenCalledTimes(4)
  })

  it('übernimmt die Schrift der gewählten Ebene und setzt neue Schriften', async () => {
    const collage = withText()
    collage.updateText(collage.selectedText!.id, { fontFamily: 'Georgia' })
    const api = setupApi()
    expect(api.selectedFontFamily.value).toBe('Georgia')
    await api.updateFontFamily('Impact')
    expect(collage.selectedText?.fontFamily).toBe('Impact')
    expect(api.systemFonts).toContain('Arial')
  })

  it('löscht die gewählte Ebene', () => {
    const collage = withText()
    const api = setupApi()
    api.deleteText()
    expect(collage.texts).toHaveLength(0)
  })
})

describe('TextControls (Komponente)', () => {
  function mountControls() {
    return mount(TextControls, {
      global: { plugins: [pinia, i18n], stubs: { teleport: true } },
    })
  }

  it('zeigt den Leerzustand ohne Auswahl', () => {
    expect(mountControls().text()).toContain(t('text.noSelection'))
  })

  it('rendert alle Abschnitte und blendet Schatten-Regler per Schalter ein', async () => {
    withText()
    const wrapper = mountControls()
    expect(wrapper.get<HTMLTextAreaElement>('#text-content').element.value).toBe('Hallo')
    expect(wrapper.get<HTMLSelectElement>('#text-font').element.value).toBe('Arial')
    expect(wrapper.find('#text-color').exists()).toBe(true)
    expect(wrapper.text()).not.toContain(t('text.shadowBlur'))

    const shadowSwitch = wrapper.get(`[role="switch"][aria-label="${t('text.shadow')}"]`)
    await shadowSwitch.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain(t('text.shadowBlur'))
    expect(wrapper.find('#text-shadow-color').exists()).toBe(true)

    await wrapper.get('#text-content').setValue('Geändert')
    expect(useCollageStore().selectedText?.text).toBe('Geändert')

    await wrapper
      .findAll('button')
      .find((b) => b.text() === t('text.delete'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(t('text.noSelection'))
  })
})
