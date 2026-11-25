import { expect, test, type Page } from '@playwright/test'
import { prepare } from './helpers'

/**
 * Nachbau der globalen KodiniTools-Navigation (SSI-Partial), wie sie der Server
 * an Stelle des Include-Kommentars einsetzt. Lokal und auf CI fehlt das Partial,
 * deshalb wird es hier in das ausgelieferte HTML eingesetzt. Wie das echte
 * Partial markiert das Skript die Sprache aus localStorage, bevor die App startet.
 */
const NAV = `
<nav class="global-nav sticky" aria-label="Hauptnavigation">
  <div class="global-nav-lang-switcher" role="group" aria-label="Sprache wählen">
    <button class="global-nav-lang-btn" data-lang="de" type="button">DE</button>
    <button class="global-nav-lang-btn" data-lang="en" type="button">EN</button>
  </div>
</nav>
<script>
  ;(function () {
    var lang = localStorage.getItem('locale') || 'de'
    document.querySelectorAll('.global-nav-lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang)
    })
  })()
</script>`

async function withGlobalNav(page: Page) {
  await page.route(/\/collagemaker\/[^.]*$/, async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback()
    const response = await route.fetch()
    const html = (await response.text()).replace(
      '<!--#include virtual="/partials/nav.html" -->',
      NAV
    )
    await route.fulfill({ response, body: html })
  })
}

const GOLD = 'rgb(143, 99, 32)'
const WHITE = 'rgb(255, 255, 255)'

for (const theme of ['light', 'dark'] as const) {
  for (const path of ['./', './editor'] as const) {
    test(`Globale Navigation ${path} · ${theme}: aktive Sprache dunkelgold`, async ({ page }) => {
      await withGlobalNav(page)
      await prepare(page, 'de', theme)
      await page.goto(path)
      // Der nachgebaute Umschalter liegt oben links, wo die Maus startet (Hover).
      await page.mouse.move(600, 600)

      const switcher = page.getByRole('group', { name: 'Sprache wählen' })
      const de = switcher.getByRole('button', { name: 'DE' })
      const en = switcher.getByRole('button', { name: 'EN' })
      await expect(de).toHaveClass(/active/)
      await expect(de).toHaveCSS('background-color', GOLD)
      await expect(de).toHaveCSS('color', WHITE)
      await expect(en).not.toHaveClass(/active/)
      await expect(en).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    })
  }
}

test('Globale Navigation: ?lang=en markiert EN, obwohl DE gespeichert ist', async ({ page }) => {
  await withGlobalNav(page)
  await prepare(page, 'de')
  await page.goto('./?lang=en')
  await page.mouse.move(600, 600)

  const switcher = page.getByRole('group', { name: 'Sprache wählen' })
  await expect(switcher.getByRole('button', { name: 'EN' })).toHaveClass(/active/)
  await expect(switcher.getByRole('button', { name: 'EN' })).toHaveCSS('background-color', GOLD)
  await expect(switcher.getByRole('button', { name: 'DE' })).not.toHaveClass(/active/)
})
