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
