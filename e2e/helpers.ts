import { crc32, deflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'

export type Locale = 'de' | 'en'
export type Theme = 'dark' | 'light'

/** Setzt Sprache und Theme vor dem ersten Skript der Seite (wie die SSI-Navigation). */
export async function prepare(page: Page, locale: Locale, theme: Theme = 'light'): Promise<void> {
  await page.addInitScript(
    ([l, t]) => {
      localStorage.setItem('locale', l)
      localStorage.setItem('theme', t)
    },
    [locale, theme] as const
  )
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

/** Kleine, gültige RGB-PNG-Datei in einer Farbe. */
export function png(width: number, height: number, rgb: [number, number, number] = [200, 60, 60]) {
  const row = Buffer.alloc(1 + width * 3)
  for (let x = 0; x < width; x++) row.set(rgb, 1 + x * 3)
  const raw = Buffer.concat(Array.from({ length: height }, () => row))
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // Bittiefe
  header[9] = 2 // Farbtyp RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export function imageFile(name: string, width = 40, height = 30) {
  return { name, mimeType: 'image/png', buffer: png(width, height) }
}

/** Lädt Bilder über das (versteckte) Datei-Input des Uploaders hoch. */
export async function uploadImages(page: Page, files: ReturnType<typeof imageFile>[]) {
  await page.locator('input[type="file"]:not([webkitdirectory])').setInputFiles(files)
}

/** Sammelt unbehandelte Seitenfehler (Exceptions) für eine abschließende Prüfung. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}
