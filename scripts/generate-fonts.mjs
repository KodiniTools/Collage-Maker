/**
 * generate-fonts.mjs
 *
 * Erzeugt aus den woff2-Dateien in src/assets/fonts/ automatisch:
 *   1. src/assets/fonts/fonts.css     – @font-face-Deklarationen (eine je Datei)
 *   2. src/assets/fonts/fontList.ts   – Array `availableFonts` aller Schrift-Namen
 *
 * Die woff2-Dateien liegen IM Repo und werden von Vite gebündelt (die
 * @font-face-URLs `./Datei.woff2` werden beim Build zu gehashten Asset-URLs).
 * fonts.css wird in src/main.ts importiert, fontList.ts in den Text-Komponenten.
 * => Keine Server-Ordner, kein Runtime-Fetch, kein Cache-Problem.
 *
 * Ablauf beim Hinzufügen neuer Schriften:
 *   1. woff2-Datei nach src/assets/fonts/ legen (Name: "Familie-Schnitt.woff2")
 *   2. node scripts/generate-fonts.mjs   (bzw. npm run fonts:generate)
 *
 * Der Schrift-Name ergibt sich aus dem Dateinamen: "ClashDisplay-Bold.woff2"
 * -> "ClashDisplay Bold" (Bindestriche/Unterstriche werden zu Leerzeichen).
 */

import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const fontsDir = join(repoRoot, 'src', 'assets', 'fonts')
const outputCssFile = join(fontsDir, 'fonts.css')
const outputTsFile = join(fontsDir, 'fontList.ts')

/** "ClashDisplay-Bold.woff2" -> "ClashDisplay Bold" */
function getFontName(filename) {
  return filename
    .replace(/\.woff2$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()
}

function generateFontFace(filename) {
  const fontName = getFontName(filename)
  return `@font-face {
  font-family: '${fontName}';
  src: url('./${filename}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
`
}

if (!existsSync(fontsDir)) {
  console.error(`✗ Fonts-Verzeichnis nicht gefunden: ${fontsDir}`)
  process.exit(1)
}

const woff2Files = readdirSync(fontsDir)
  .filter((f) => f.toLowerCase().endsWith('.woff2'))
  .sort()

if (woff2Files.length === 0) {
  console.error(`✗ Keine .woff2-Dateien in ${fontsDir} gefunden.`)
  process.exit(1)
}

// fonts.css
const css =
  `/* fonts.css – AUTOMATISCH GENERIERT von scripts/generate-fonts.mjs.\n` +
  ` * Anzahl Schnitte: ${woff2Files.length}. NICHT von Hand bearbeiten. */\n\n` +
  woff2Files.map(generateFontFace).join('')
writeFileSync(outputCssFile, css, 'utf8')

// fontList.ts (prettier-konform: single quotes, kein Semikolon, trailing comma)
const fontNames = [...new Set(woff2Files.map(getFontName))].sort()
const listBody = fontNames
  .map((n) => `  '${n.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`)
  .join('\n')
const ts =
  `/* fontList.ts – AUTOMATISCH GENERIERT von scripts/generate-fonts.mjs.\n` +
  ` * Anzahl Schriften: ${fontNames.length}. NICHT von Hand bearbeiten. */\n\n` +
  `export const availableFonts: string[] = [\n${listBody}\n]\n\n` +
  `export default availableFonts\n`
writeFileSync(outputTsFile, ts, 'utf8')

console.log(`✓ ${woff2Files.length} Schnitt(e), ${fontNames.length} Schrift-Name(n) verarbeitet.`)
console.log(`  CSS → ${outputCssFile}`)
console.log(`  TS  → ${outputTsFile}`)
