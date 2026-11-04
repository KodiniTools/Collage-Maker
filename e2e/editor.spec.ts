import { expect, test } from '@playwright/test'
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers'

test.describe('Editor (Smoke)', () => {
  let errors: string[] = []

  test.beforeEach(async ({ page }) => {
    errors = collectPageErrors(page)
    await prepare(page, 'de')
    await page.goto('./editor')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bilder-Collage-Macher')
  })

  test.afterEach(() => {
    expect(errors).toEqual([])
  })

  test('Bilder hochladen legt sie auf die Leinwand', async ({ page }) => {
    await uploadImages(page, [imageFile('a.png'), imageFile('b.png', 30, 40)])

    await expect(page.getByText('Bilder auf Canvas (2)')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Bild 1' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Bild 2' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rückgängig (Ctrl+Z)' })).toBeEnabled()
  })

  test('Bilderliste: Auswahl, Vorschau und Löschen mit Rückfrage', async ({ page }) => {
    await uploadImages(page, [imageFile('a.png'), imageFile('b.png', 30, 40)])
    await page.getByRole('button', { name: 'Bilder', exact: true }).click()

    const item = page.getByRole('button', { name: /: a\.png$/ })
    await expect(item).toBeVisible()
    await item.click()
    await expect(page.getByText('1 Bild(er) ausgewählt')).toBeVisible()

    await item.dblclick()
    const preview = page.locator('#modal-portal').getByRole('heading', { name: 'Bildvorschau' })
    await expect(preview).toBeVisible()
    await page
      .locator('#modal-portal > div')
      .filter({ has: page.getByRole('heading', { name: 'Bildvorschau' }) })
      .getByRole('button', { name: 'Schließen' })
      .click()
    await expect(preview).toBeHidden()

    await item.getByRole('button', { name: 'Entfernen' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByRole('button', { name: /: a\.png$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /: b\.png$/ })).toBeVisible()
  })

  test('Layout wechseln markiert das gewählte Layout', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Werkzeuge' })
      .getByRole('button', { name: 'Layout' })
      .click()
    const layouts = page.getByRole('group', { name: 'Layout' })
    await expect(layouts.getByRole('button', { name: 'Grid 3×3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    await layouts.getByRole('button', { name: 'Grid 2×2' }).click()

    await expect(layouts.getByRole('button', { name: 'Grid 2×2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(layouts.getByRole('button', { name: 'Grid 3×3' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  test('Leinwandbreite über Zahlenfeld und Regler', async ({ page }) => {
    const panel = page.getByRole('region', { name: 'Canvas-Größe' })
    const slider = panel.getByRole('slider', { name: 'Breite' })
    await expect(slider).toHaveValue('700')

    await slider.fill('900')
    await expect(panel.getByText('Breite: 900px')).toBeVisible()

    const spinner = panel.getByRole('spinbutton', { name: /^Breite/ })
    await spinner.fill('800')
    await expect(slider).toHaveValue('800')
  })

  test('Zoom-Regler arbeitet in Prozent (SliderField)', async ({ page }) => {
    const zoom = page.getByRole('slider', { name: 'Zoom' })
    await expect(zoom).toHaveValue('100')
    await page.getByRole('spinbutton', { name: 'Zoom (Wert)' }).fill('150')
    await expect(page.getByText('Zoom: 150%')).toBeVisible()
    await expect(zoom).toHaveValue('150')
    await page.getByRole('button', { name: 'Ansicht zurücksetzen' }).click()
    await expect(page.getByText('Zoom: 100%')).toBeVisible()
  })

  test('Hintergrundfarbe über ColorField (HSL-Regler und Hex-Feld)', async ({ page }) => {
    const swatch = page.getByRole('button', { name: /^Hintergrund #/ })
    await expect(swatch).toHaveAttribute('aria-expanded', 'false')
    await swatch.click()

    const panel = page.getByRole('dialog', { name: 'Hintergrund' })
    await expect(panel.getByRole('slider')).toHaveCount(3)
    const hex = panel.locator('input.color-field__hex')
    await hex.fill('#ff8800')
    await hex.press('Enter')
    await expect(page.getByPlaceholder('#ffffff')).toHaveValue('#ff8800')

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(swatch).toHaveAccessibleName('Hintergrund #ff8800')
  })

  test('Schalter (UiSwitch) für Raster, Seitenverhältnis und Originalauflösung', async ({
    page,
  }) => {
    const grid = page.getByRole('switch', { name: 'Raster anzeigen' })
    await expect(grid).toHaveAttribute('aria-checked', 'false')
    await grid.click()
    await expect(grid).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText(/^Rastergröße/)).toBeVisible()

    const keepAspect = page.getByRole('switch', { name: 'Seitenverhältnis beibehalten' })
    await keepAspect.click()
    await expect(keepAspect).toHaveAttribute('aria-checked', 'true')

    const keepOriginal = page.getByRole('switch', { name: 'Originalauflösung beibehalten' })
    await expect(keepOriginal).toHaveAttribute('aria-checked', 'false')
    await page.getByText('Originalauflösung beibehalten').click()
    await expect(keepOriginal).toHaveAttribute('aria-checked', 'true')
  })

  test('Text: hinzufügen, Inhalt ändern, Schatten schalten und löschen', async ({ page }) => {
    await page.getByRole('radio', { name: 'Text' }).click()
    await page.getByRole('button', { name: 'Text hinzufügen' }).click()

    const content = page.getByLabel('Textinhalt')
    await expect(content).toBeVisible()
    await content.fill('Hallo Collage')
    await expect(content).toHaveValue('Hallo Collage')

    const shadow = page.getByRole('switch', { name: 'Textschatten' })
    await expect(shadow).toHaveAttribute('aria-checked', 'false')
    await shadow.click()
    await expect(shadow).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText(/^Schatten X/)).toBeVisible()

    await page.getByRole('button', { name: 'Text löschen' }).click()
    await expect(page.getByText('Keine Texte hinzugefügt')).toBeVisible()
  })

  test('Export: Vorschau öffnet und Herunterladen liefert eine PNG-Datei', async ({ page }) => {
    await uploadImages(page, [imageFile('a.png')])
    await expect(page.getByText('Bilder auf Canvas (1)')).toBeVisible()

    await page.getByRole('radio', { name: 'Export' }).click()
    const exportPanel = page.getByRole('region', { name: 'Exportieren' })
    await expect(exportPanel.getByRole('combobox', { name: 'Format' })).toHaveValue(/png/i)

    await exportPanel.getByRole('button', { name: 'Vorschau' }).click()
    const previewTitle = page.getByRole('heading', { name: 'Vorschau der Collage' })
    await expect(previewTitle).toBeVisible()
    await expect(page.getByRole('img', { name: 'Vorschau der fertigen Collage' })).toBeVisible()
    // Die breite Vorschau ist (noch) kein UiDialog: per Überschrift eingrenzen.
    const preview = page.locator('#modal-portal > div').filter({ has: previewTitle })
    await preview.getByRole('button', { name: 'Schließen' }).first().click()
    await expect(previewTitle).toBeHidden()

    await exportPanel.getByRole('button', { name: 'Herunterladen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Dateiname festlegen' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Dateiname').fill('meine-collage')

    const downloadPromise = page.waitForEvent('download')
    await dialog.getByRole('button', { name: 'Speichern' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('meine-collage.png')
    await expect(dialog).toBeHidden()
  })

  test('Tastenkürzel-Dialog öffnet und schließt mit Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Tastaturkurzbefehle' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
