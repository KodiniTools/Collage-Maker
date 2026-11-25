import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/i18n'
import LandingPage from '@/pages/LandingPage.vue'

async function mountLanding() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: LandingPage },
      { path: '/:rest(.*)', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return mount(LandingPage, { global: { plugins: [router, i18n] } })
}

describe('LandingPage (Design-Umbau Etappe 1)', () => {
  it('zeigt die Collage mit sechs WebP-Bildern und einem Alternativtext', async () => {
    const wrapper = await mountLanding()
    const images = wrapper.findAll('.collage-hero-tiles img')
    expect(images).toHaveLength(6)
    for (const img of images) expect(img.attributes('src')).toMatch(/\.webp$/)
    expect(wrapper.find('.collage-hero-art').attributes('role')).toBe('img')
    expect(wrapper.find('.collage-hero-art').attributes('aria-label')).toBeTruthy()
  })

  it('setzt das Demovideo unter die Einstiegskarten', async () => {
    const wrapper = await mountLanding()
    const html = wrapper.html()
    const cards = html.indexOf('collage-feature-cards')
    const demo = html.indexOf('collage-demo')
    expect(cards).toBeGreaterThan(-1)
    expect(demo).toBeGreaterThan(cards)
    expect(wrapper.find('.collage-hero video').exists()).toBe(false)
    expect(wrapper.find('.collage-demo video').attributes('src')).toBe('/videos/collage-maker.webm')
  })

  it('führt mit dem Hauptbutton in den Editor', async () => {
    const wrapper = await mountLanding()
    expect(wrapper.find('.collage-hero a.ui-button--primary').attributes('href')).toBe('/editor')
  })
})
