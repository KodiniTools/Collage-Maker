import { expect, test } from '@playwright/test'
import { collectPageErrors, prepare, type Locale, type Theme } from './helpers'

const PAGES: ReadonlyArray<{ path: string; heading: Record<Locale, string> }> = [
  {
    path: './',
    heading: {
      de: 'Fotocollage erstellen – kostenlos online',
      en: 'Photo Collage Maker – Free Online',
    },
  },
  { path: './editor', heading: { de: 'Bilder-Collage-Macher', en: 'Image Collage Maker' } },
  { path: './faq', heading: { de: 'Häufig gestellte Fragen', en: 'Frequently Asked Questions' } },
  {
    path: './blog',
    heading: {
      de: 'Der komplette Guide zum Collage-Maker',
      en: 'The Complete Collage Maker Guide',
    },
  },
  { path: './artikel', heading: { de: 'Aus dem Blog', en: 'From the Blog' } },
]

for (const { path, heading } of PAGES) {
  for (const locale of ['de', 'en'] as const) {
    for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
      test(`${path} · ${locale} · ${theme}`, async ({ page }) => {
        const errors = collectPageErrors(page)
        await prepare(page, locale, theme)
        await page.goto(path)

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading[locale])
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        expect(errors).toEqual([])
      })
    }
  }
}

test('?lang=en hat Vorrang vor der gespeicherten Sprache', async ({ page }) => {
  await prepare(page, 'de')
  await page.goto('./faq?lang=en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Frequently Asked Questions')
})

test('Startseite → Editor: Seite wird nachgeladen', async ({ page }) => {
  const errors = collectPageErrors(page)
  await prepare(page, 'de')
  await page.goto('./')
  await page.getByRole('link', { name: 'Jetzt Collage erstellen' }).first().click()

  await expect(page).toHaveURL(/\/collagemaker\/editor$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bilder-Collage-Macher')
  expect(errors).toEqual([])
})

test('fehlender Seiten-Chunk (nach Deploy) lädt die Zielseite einmal neu', async ({ page }) => {
  await prepare(page, 'de')
  let blocked = 0
  // Erster Abruf des Editor-Chunks schlägt fehl, wie bei einem gelöschten alten Chunk.
  await page.route(/EditorPage/, (route) => {
    if (blocked++ === 0) return route.abort()
    return route.continue()
  })
  await page.goto('./')
  await page.getByRole('link', { name: 'Jetzt Collage erstellen' }).first().click()

  await expect(page).toHaveURL(/\/collagemaker\/editor$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bilder-Collage-Macher')
  expect(blocked).toBeGreaterThanOrEqual(2)
})

for (const locale of ['de', 'en'] as const) {
  test(`Startseite · ${locale} · 390 px: sechs Bilder geladen, kein horizontales Scrollen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await prepare(page, locale)
    await page.goto('./')

    const images = page.locator('.collage-hero-tiles img')
    await expect(images).toHaveCount(6)
    await expect
      .poll(() =>
        images.evaluateAll((list) =>
          list.every((img) => (img as HTMLImageElement).naturalWidth > 0)
        )
      )
      .toBe(true)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBe(0)
  })
}

const NAV_CURRENT: ReadonlyArray<{ path: string; current: Record<Locale, string> }> = [
  { path: './', current: { de: 'Startseite', en: 'Home' } },
  { path: './blog', current: { de: 'Anleitung', en: 'Guide' } },
  { path: './artikel', current: { de: 'Blog', en: 'Blog' } },
  { path: './faq', current: { de: 'FAQ', en: 'FAQ' } },
  { path: './editor', current: { de: 'Editor', en: 'Editor' } },
]

for (const { path, current } of NAV_CURRENT) {
  for (const locale of ['de', 'en'] as const) {
    test(`Navigation ${path} · ${locale}: aktuelle Seite hervorgehoben, 390 px ohne Überlauf`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await prepare(page, locale)
      await page.goto(path)

      const nav = page.getByRole('navigation', {
        name: locale === 'de' ? 'Collage-Maker-Navigation' : 'Collage Maker navigation',
      })
      await expect(nav.getByRole('link')).toHaveCount(5)
      await expect(nav.locator('[aria-current="page"]')).toHaveText(current[locale])

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBe(0)
    })
  }
}

test('Theme-Schalter im Header wechselt das Theme und bleibt nach Neuladen erhalten', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('locale')) localStorage.setItem('locale', 'de')
  })
  await page.goto('./faq')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.getByRole('button', { name: 'Dunkles Design' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Helles Design' })).toBeVisible()
})

const TITLE_COLORS: Record<Theme, { gold: string; blue: string }> = {
  light: { gold: 'rgb(119, 81, 21)', blue: 'rgb(0, 88, 160)' },
  dark: { gold: 'rgb(230, 188, 118)', blue: 'rgb(72, 160, 216)' },
}

for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
  test(`Startseite · ${theme}: Titel in Gold und Logo-Blau`, async ({ page }) => {
    await prepare(page, 'de', theme)
    await page.goto('./')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1.locator('.collage-hero-title-lead')).toHaveCSS(
      'color',
      TITLE_COLORS[theme].gold
    )
    await expect(h1.locator('.collage-hero-title-accent')).toHaveCSS(
      'color',
      TITLE_COLORS[theme].blue
    )
  })
}
