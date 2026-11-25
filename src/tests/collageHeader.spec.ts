import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'
import CollageHeader from '@/components/CollageHeader.vue'

const PATHS = ['/', '/blog', '/artikel', '/faq', '/editor'] as const
let pinia: Pinia

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
})

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: PATHS.map((p) => ({ path: p, component: { template: '<div />' } })),
  })
  await router.push(path)
  await router.isReady()
  return mount(CollageHeader, { global: { plugins: [pinia, router, i18n] } })
}

describe('CollageHeader (Design-Umbau Etappe 2)', () => {
  it('verlinkt Startseite, Anleitung, Blog, FAQ und Editor in dieser Reihenfolge', async () => {
    const wrapper = await mountAt('/')
    const links = wrapper.findAll('nav a')
    expect(links.map((a) => a.attributes('href'))).toEqual([...PATHS])
    expect(wrapper.find('nav').attributes('aria-label')).toBe(i18n.global.t('nav.label'))
  })

  it.each(PATHS)('markiert auf %s genau die aktuelle Seite mit aria-current', async (path) => {
    const wrapper = await mountAt(path)
    const current = wrapper.findAll('nav a[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]?.attributes('href')).toBe(path)
  })

  it('schaltet das Theme um und benennt die jeweils andere Variante', async () => {
    const wrapper = await mountAt('/')
    const settings = useSettingsStore()
    const toggle = wrapper.find('button.collage-theme-toggle')
    expect(settings.theme).toBe('light')
    expect(toggle.text()).toBe(i18n.global.t('nav.switchToDark'))

    await toggle.trigger('click')
    expect(settings.theme).toBe('dark')
    expect(toggle.text()).toBe(i18n.global.t('nav.switchToLight'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    settings.stopListening()
  })
})
