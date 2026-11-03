import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import ExportFilenameDialog from '@/components/export/ExportFilenameDialog.vue'
import ExportShareDialog from '@/components/export/ExportShareDialog.vue'
import ExportPreviewModal from '@/components/export/ExportPreviewModal.vue'

const global = { plugins: [i18n], stubs: { teleport: true } }
const t = (key: string) => i18n.global.t(key)

function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`Button "${text}" fehlt`)
  return button
}

describe('ExportFilenameDialog', () => {
  function mountDialog(open = true) {
    return mount(ExportFilenameDialog, {
      props: {
        open,
        filename: 'collage',
        resultingFilename: 'collage.png',
        'onUpdate:filename': (v: string) => wrapper.setProps({ filename: v }),
      },
      global,
    })
  }
  let wrapper: ReturnType<typeof mountDialog>

  it('zeigt Feld, Vorschau und meldet Eingabe per v-model', async () => {
    wrapper = mountDialog()
    expect(wrapper.text()).toContain(t('export.filenameDialogTitle'))
    expect(wrapper.text()).toContain('collage.png')
    const input = wrapper.get('input#export-filename')
    await input.setValue('urlaub')
    expect(wrapper.emitted('update:filename')?.at(-1)).toEqual(['urlaub'])
  })

  it('bestätigt per Enter und Button, bricht per Button ab', async () => {
    wrapper = mountDialog()
    await wrapper.get('input#export-filename').trigger('keydown', { key: 'Enter' })
    await buttonByText(wrapper, t('export.filenameConfirm')).trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(2)
    await buttonByText(wrapper, t('export.filenameCancel')).trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('rendert geschlossen nichts', () => {
    wrapper = mountDialog(false)
    expect(wrapper.find('input#export-filename').exists()).toBe(false)
  })
})

describe('ExportShareDialog', () => {
  it('meldet Teilen und Abbrechen', async () => {
    const wrapper = mount(ExportShareDialog, { props: { open: true }, global })
    expect(wrapper.text()).toContain(t('export.shareReadyTitle'))
    await buttonByText(wrapper, t('export.share')).trigger('click')
    await buttonByText(wrapper, t('common.cancel')).trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('ExportPreviewModal', () => {
  function mountModal(open = true) {
    return mount(ExportPreviewModal, {
      props: { open, dataUrl: 'data:image/png;base64,AAAA', width: 700, height: 740 },
      global,
    })
  }

  it('zeigt Bild und Maße', () => {
    const wrapper = mountModal()
    expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,AAAA')
    expect(wrapper.get('img').attributes('alt')).toBe(t('export.previewAlt'))
    expect(wrapper.text()).toContain('700 x 740 px')
  })

  it('schließt über Kreuz, Button und Hintergrund; lädt über Button herunter', async () => {
    const wrapper = mountModal()
    await wrapper.get(`button[aria-label="${t('export.close')}"]`).trigger('click')
    await buttonByText(wrapper, t('export.close')).trigger('click')
    await wrapper.get('.fixed.inset-0').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(3)
    await buttonByText(wrapper, t('export.download')).trigger('click')
    expect(wrapper.emitted('download')).toHaveLength(1)
  })

  it('rendert geschlossen nichts', () => {
    expect(mountModal(false).find('img').exists()).toBe(false)
  })
})
