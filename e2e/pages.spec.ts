import { expect, test } from '@playwright/test'
import { collectPageErrors, prepare, type Locale, type Theme } from './helpers'

const PAGES: ReadonlyArray<{ path: string; heading: Record<Locale, string> }> = [
  {
    path: './',
    heading: { de: 'Erstelle beeindruckende Foto-Collagen', en: 'Create Stunning Photo Collages' },
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
