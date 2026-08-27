#!/usr/bin/env node
/*
 * generate-fonts.mjs
 *
 * Scannt einen Schriftarten-Ordner (Default: der Server-Ordner
 *   /var/www/kodinitools.com/public/fonts
 * ) und erzeugt daraus automatisch:
 *
 *   - fonts.css   – @font-face-Regeln für ALLE gefundenen Schriften
 *   - fonts.json  – Manifest der Familien/Varianten für die Font-Auswahl
 *                   im Text-Bereich der App
 *
 * Dadurch muss beim Hinzufügen einer neuen Schrift nur noch die woff2/ttf-
 * Datei in den Ordner gelegt und dieses Skript (bzw. der Deploy) erneut
 * ausgeführt werden – die Schrift steht dem Nutzer danach im Text-Bereich
 * automatisch zur Verfügung.
 *
 * Aufruf:
 *   node scripts/generate-fonts.mjs [--dir <ordner>] [--json-out <datei>]
 *                                   [--css-out <datei>] [--url-base <pfad>]
 *
 * Standardwerte (überschreibbar per Argument oder Umgebungsvariable):
 *   --dir       FONTS_DIR       /var/www/kodinitools.com/public/fonts
 *   --json-out  FONTS_JSON_OUT  <dir>/fonts.json          (URL: /fonts/fonts.json)
 *   --css-out   FONTS_CSS_OUT   <dir>/../fonts.css        (URL: /fonts.css)
 *   --url-base  FONTS_URL_BASE  /fonts                    (URL-Präfix der Dateien)
 */

import { readdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Argumente & Konfiguration
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      args[key] = val
    }
  }
  return args
}

const cli = parseArgs(process.argv.slice(2))

const FONTS_DIR = resolve(
  cli.dir || process.env.FONTS_DIR || '/var/www/kodinitools.com/public/fonts'
)
const URL_BASE = (cli['url-base'] || process.env.FONTS_URL_BASE || '/fonts').replace(/\/+$/, '')
const JSON_OUT = resolve(
  cli['json-out'] || process.env.FONTS_JSON_OUT || join(FONTS_DIR, 'fonts.json')
)
const CSS_OUT = resolve(
  cli['css-out'] || process.env.FONTS_CSS_OUT || join(dirname(FONTS_DIR), 'fonts.css')
)

// Unterstützte Font-Dateiformate (Reihenfolge = Priorität für dieselbe Variante).
const FORMATS = {
  '.woff2': 'woff2',
  '.woff': 'woff',
  '.ttf': 'truetype',
  '.otf': 'opentype',
}

// ---------------------------------------------------------------------------
// Namens-Parsing: Dateiname -> Familie / Gewicht / Stil / Varianten-Label
// ---------------------------------------------------------------------------

// Gewichts-Tokens (längere/spezifischere zuerst prüfen!). Das Label bleibt
// als EIN Wort erhalten (z. B. "SemiBold"), damit die App-Logik in
// TextControls.vue (variantToWeight) es korrekt einem Gewicht zuordnet.
const WEIGHT_TOKENS = [
  { re: /extrablack|ultrablack/i, weight: 900, label: 'ExtraBlack' },
  { re: /black|heavy/i, weight: 900, label: 'Black' },
  { re: /extrabold|ultrabold/i, weight: 800, label: 'ExtraBold' },
  { re: /semibold|demibold/i, weight: 600, label: 'SemiBold' },
  { re: /bold/i, weight: 700, label: 'Bold' },
  { re: /medium/i, weight: 500, label: 'Medium' },
  { re: /extralight|ultralight/i, weight: 200, label: 'ExtraLight' },
  { re: /light/i, weight: 300, label: 'Light' },
  { re: /thin|hairline/i, weight: 100, label: 'Thin' },
  { re: /regular|normal|book/i, weight: 400, label: 'Regular' },
]

// Wandelt "ClashDisplay" -> "Clash Display" (nur an CamelCase-/Ziffern-Grenzen).
function humanizeFamily(raw) {
  return raw
    .replace(/[_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFontFile(fileName) {
  const dot = fileName.lastIndexOf('.')
  const ext = fileName.slice(dot).toLowerCase()
  const base = fileName.slice(0, dot)

  // Variable Font? (z. B. "Supreme-Variable.woff2" oder "Supreme[wght].woff2")
  const isVariable = /variable|\[.*\]/i.test(base)

  // Familie / Style-Teil trennen: alles vor dem letzten "-" ist die Familie.
  let familyToken = base
  let styleToken = ''
  const dash = base.lastIndexOf('-')
  if (dash > 0) {
    familyToken = base.slice(0, dash)
    styleToken = base.slice(dash + 1)
  }

  // "[wght]" o. Ä. aus dem Familiennamen entfernen.
  familyToken = familyToken.replace(/\[.*?\]/g, '').trim()

  const family = humanizeFamily(familyToken)

  // Italic erkennen und aus dem Style-Token entfernen.
  const italic = /italic|oblique/i.test(styleToken)
  const weightPart = styleToken.replace(/italic|oblique/gi, '').trim()

  // Gewicht + Basis-Label bestimmen.
  let weight = 400
  let label = 'Regular'
  const cleaned = weightPart.replace(/\s+/g, '')
  if (cleaned) {
    const match = WEIGHT_TOKENS.find((t) => t.re.test(cleaned))
    if (match) {
      weight = match.weight
      label = match.label
    } else {
      // Unbekanntes Token (z. B. eigener Schnitt-Name) unverändert übernehmen.
      label = weightPart
    }
  }

  return { family, weight, italic, label, ext, isVariable }
}

// ---------------------------------------------------------------------------
// Ordner einlesen
// ---------------------------------------------------------------------------
if (!existsSync(FONTS_DIR) || !statSync(FONTS_DIR).isDirectory()) {
  console.error(`✗ Font-Ordner nicht gefunden: ${FONTS_DIR}`)
  console.error('  (Pfad via --dir oder FONTS_DIR setzen.)')
  process.exit(1)
}

const entries = readdirSync(FONTS_DIR).filter((f) => {
  const dot = f.lastIndexOf('.')
  if (dot < 0) return false
  return Object.prototype.hasOwnProperty.call(FORMATS, f.slice(dot).toLowerCase())
})

if (entries.length === 0) {
  console.error(
    `✗ Keine Schriftdateien (${Object.keys(FORMATS).join(', ')}) in ${FONTS_DIR} gefunden.`
  )
  process.exit(1)
}

// Nach Familie gruppieren; pro (Gewicht+Stil) die beste verfügbare Datei wählen.
/** @type {Record<string, { family: string, faces: Map<string, any> }>} */
const families = {}

for (const file of entries.sort()) {
  const parsed = parseFontFile(file)
  const key = parsed.family
  if (!families[key]) {
    families[key] = { family: parsed.family, faces: new Map(), hasVariable: false }
  }
  if (parsed.isVariable) families[key].hasVariable = true

  const faceKey = `${parsed.label}|${parsed.weight}|${parsed.italic ? 'i' : 'n'}`
  const existing = families[key].faces.get(faceKey)
  const format = FORMATS[parsed.ext]
  if (!existing) {
    families[key].faces.set(faceKey, {
      label: parsed.label,
      weight: parsed.weight,
      italic: parsed.italic,
      variable: parsed.isVariable,
      sources: [{ file, format }],
    })
  } else {
    existing.sources.push({ file, format })
  }
}

// ---------------------------------------------------------------------------
// Ausgaben erzeugen
// ---------------------------------------------------------------------------
const cssBlocks = []
/** @type {Record<string, { variants: string[], hasItalic: boolean, hasVariable?: boolean }>} */
const manifest = {}

// Reihenfolge der Quellen: woff2 > woff > ttf > otf.
const FORMAT_ORDER = ['woff2', 'woff', 'truetype', 'opentype']
function sortSources(sources) {
  return [...sources].sort(
    (a, b) => FORMAT_ORDER.indexOf(a.format) - FORMAT_ORDER.indexOf(b.format)
  )
}

for (const key of Object.keys(families).sort()) {
  const fam = families[key]
  const faces = [...fam.faces.values()]

  // Basis-Varianten (ohne Italic) für die Auswahl-Dropdown-Liste.
  const baseVariants = [...new Set(faces.map((f) => f.label))]
  // Nach Gewicht sortieren, damit die Liste sinnvoll geordnet ist.
  const labelWeight = (lbl) => {
    const f = faces.find((x) => x.label === lbl)
    return f ? f.weight : 400
  }
  baseVariants.sort((a, b) => labelWeight(a) - labelWeight(b) || a.localeCompare(b))

  const hasItalic = faces.some((f) => f.italic)

  manifest[fam.family] = {
    variants: baseVariants,
    hasItalic,
    ...(fam.hasVariable ? { hasVariable: true } : {}),
  }

  for (const face of faces) {
    const srcList = sortSources(face.sources)
      .map((s) => `url('${URL_BASE}/${s.file}') format('${s.format}')`)
      .join(',\n    ')

    const weightDecl = face.variable ? '100 900' : String(face.weight)

    cssBlocks.push(
      `@font-face {\n` +
        `  font-family: '${fam.family}';\n` +
        `  font-weight: ${weightDecl};\n` +
        `  font-style: ${face.italic ? 'italic' : 'normal'};\n` +
        `  src: ${srcList};\n` +
        `  font-display: swap;\n` +
        `}`
    )
  }
}

const header =
  `/* Custom Fonts for Collage Maker – AUTOMATISCH GENERIERT.\n` +
  ` * Quelle: ${FONTS_DIR}\n` +
  ` * Erzeugt von scripts/generate-fonts.mjs – NICHT von Hand bearbeiten.\n` +
  ` */\n\n`

writeFileSync(CSS_OUT, header + cssBlocks.join('\n\n') + '\n', 'utf8')
writeFileSync(JSON_OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

// ---------------------------------------------------------------------------
// Zusammenfassung
// ---------------------------------------------------------------------------
const familyCount = Object.keys(manifest).length
const faceCount = cssBlocks.length
console.log(`✓ ${familyCount} Schriftfamilie(n), ${faceCount} Schnitt(e) verarbeitet.`)
console.log(`  CSS  → ${CSS_OUT}`)
console.log(`  JSON → ${JSON_OUT}`)
for (const name of Object.keys(manifest).sort()) {
  const m = manifest[name]
  console.log(`    • ${name}: ${m.variants.join(', ')}${m.hasItalic ? ' (+ Italic)' : ''}`)
}
