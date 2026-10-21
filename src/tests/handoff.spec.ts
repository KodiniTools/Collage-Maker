import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import HandoffReceiver from '@/components/HandoffReceiver.vue'
import { checkHandoff, consumeHandoff, type HandoffPayload } from '@/lib/core/handoff'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

const KEY = 'kodinitools-handoff'
const JPEG = 'data:image/jpeg;base64,AAAA'

function store(payload: object) {
  localStorage.setItem(KEY, JSON.stringify(payload))
}

function payload(count = 2, source = 'bildergalerie'): HandoffPayload {
  return {
    source,
    timestamp: Date.now(),
    images: Array.from({ length: count }, (_, i) => ({
      name: `Bild ${i + 1}`,
      dataUrl: JPEG,
      width: 100,
      height: 50,
    })),
  }
}

function mountReceiver(locale: 'de' | 'en' = 'de') {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } })
  return mount(HandoffReceiver, { global: { plugins: [i18n] } })
}

describe('handoff protocol (receiver)', () => {
  beforeEach(() => localStorage.clear())

  it('accepts a fresh payload and consumes it once', () => {
    store(payload())
    expect(checkHandoff()?.images).toHaveLength(2)
    expect(consumeHandoff()).toHaveLength(2)
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(consumeHandoff()).toBeNull()
  })

  it('drops expired payloads and payloads without timestamp', () => {
    store({ ...payload(), timestamp: Date.now() - 31 * 60 * 1000 })
    expect(checkHandoff()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()

    const { timestamp: _unused, ...withoutTimestamp } = payload()
    store(withoutTimestamp)
    expect(checkHandoff()).toBeNull()
  })

  it('only keeps entries with an image data URL', () => {
    store({
      ...payload(1),
      images: [
        { name: 'ok', dataUrl: JPEG, width: 1, height: 1 },
        { name: 'script', dataUrl: 'javascript:alert(1)', width: 1, height: 1 },
        { name: 'svg', dataUrl: 'data:image/svg+xml;base64,AAAA', width: 1, height: 1 },
        { dataUrl: JPEG },
        null,
      ] as unknown as HandoffPayload['images'],
    })
    expect(checkHandoff()?.images.map((img) => img.name)).toEqual(['ok'])

    store({ ...payload(1), images: [{ name: 'x', dataUrl: 'nope', width: 1, height: 1 }] })
    expect(checkHandoff()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('treats broken JSON as no handoff', () => {
    localStorage.setItem(KEY, '{kaputt')
    expect(checkHandoff()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})

describe('HandoffReceiver', () => {
  beforeEach(() => localStorage.clear())

  it('shows nothing without a handoff', () => {
    const wrapper = mountReceiver()
    expect(wrapper.find('.handoff-banner').exists()).toBe(false)
  })

  it('names the Bildergalerie as source and pluralises correctly (DE/EN)', async () => {
    store(payload(1))
    let wrapper = mountReceiver('de')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('1 Bild empfangen')
    expect(wrapper.text()).toContain('von Bildergalerie')

    store(payload(3))
    wrapper = mountReceiver('en')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('3 images received')
    expect(wrapper.text()).toContain('from Bildergalerie')
  })

  it('accept emits the images and removes the handoff', async () => {
    store(payload(2))
    const wrapper = mountReceiver()
    await wrapper.vm.$nextTick()

    const accept = wrapper.findAll('button').find((b) => b.text() === 'Übernehmen')!
    await accept.trigger('click')

    const emitted = wrapper.emitted('accept')
    expect(emitted).toHaveLength(1)
    expect((emitted![0][0] as HandoffPayload['images']).map((img) => img.name)).toEqual([
      'Bild 1',
      'Bild 2',
    ])
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(wrapper.find('.handoff-banner').exists()).toBe(false)
  })

  it('dismiss rejects the images without emitting', async () => {
    store(payload(2))
    const wrapper = mountReceiver()
    await wrapper.vm.$nextTick()

    const dismiss = wrapper.findAll('button').find((b) => b.text() === 'Verwerfen')!
    await dismiss.trigger('click')

    expect(wrapper.emitted('accept')).toBeUndefined()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(wrapper.find('.handoff-banner').exists()).toBe(false)
  })
})
