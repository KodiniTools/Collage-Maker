/**
 * Font-Utilities für den Text-Bereich.
 *
 * Ziel: ALLE benutzerdefinierten Schriften aus dem Server-Ordner
 *   /var/www/kodinitools.com/public/fonts   (ausgeliefert unter /fonts/)
 * zuverlässig bereitstellen – auch wenn kein vorab generiertes Manifest
 * existiert.
 *
 * Zwei Wege, an die Font-Liste zu kommen:
 *   1. Manifest fonts.json (von scripts/generate-fonts.mjs erzeugt) – enthält
 *      Familien, Varianten und `faces` (Datei-URL, Gewicht, Stil).
 *   2. Fallback: Verzeichnis /fonts/ direkt auslesen (NGINX-Autoindex als
 *      JSON oder HTML) und die Familien aus den Dateinamen ableiten.
 *
 * In beiden Fällen kann die App die @font-face-Regeln aus den `faces` selbst
 * injizieren (injectFontFaces) und ist damit nicht darauf angewiesen, dass
 * eine separate fonts.css geladen bzw. aktuell ist.
 */

export interface FontFaceDef {
  weight: number | string
  style: 'normal' | 'italic'
  src: { url: string; format: string }[]
}

export interface FontFamily {
  name?: string
  variants: string[]
  hasItalic?: boolean
  hasVariable?: boolean
  faces?: FontFaceDef[]
}

export type FontManifest = Record<string, FontFamily>

const FORMAT_BY_EXT: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

// Gewichts-Tokens (spezifischere zuerst). Label bleibt EIN Wort (z. B.
// "SemiBold"), damit variantToWeight() in TextControls es korrekt zuordnet.
const WEIGHT_TOKENS: [RegExp, number, string][] = [
  [/extrablack|ultrablack/i, 900, 'ExtraBlack'],
  [/black|heavy/i, 900, 'Black'],
  [/extrabold|ultrabold/i, 800, 'ExtraBold'],
  [/semibold|demibold/i, 600, 'SemiBold'],
  [/bold/i, 700, 'Bold'],
  [/medium/i, 500, 'Medium'],
  [/extralight|ultralight/i, 200, 'ExtraLight'],
  [/light/i, 300, 'Light'],
  [/thin|hairline/i, 100, 'Thin'],
  [/regular|normal|book/i, 400, 'Regular'],
]

/** "ClashDisplay" -> "Clash Display" (nur an CamelCase-/Ziffern-Grenzen). */
export function humanizeFamily(raw: string): string {
  return raw
    .replace(/[_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ParsedFontFile {
  family: string
  weight: number
  italic: boolean
  variable: boolean
  label: string
  format: string
}

/** Zerlegt einen Dateinamen (z. B. "Supreme-BoldItalic.woff2") in Metadaten. */
export function parseFontFileName(fileName: string): ParsedFontFile | null {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return null
  const ext = fileName.slice(dot + 1).toLowerCase()
  const format = FORMAT_BY_EXT[ext]
  if (!format) return null

  const base = fileName.slice(0, dot)
  const variable = /variable|\[.*\]/i.test(base)

  let familyToken = base
  let styleToken = ''
  const dash = base.lastIndexOf('-')
  if (dash > 0) {
    familyToken = base.slice(0, dash)
    styleToken = base.slice(dash + 1)
  }
  familyToken = familyToken.replace(/\[.*?\]/g, '').trim()
  const family = humanizeFamily(familyToken)

  const italic = /italic|oblique/i.test(styleToken)
  const weightRaw = styleToken.replace(/italic|oblique/gi, '').trim()
  const weightKey = weightRaw.replace(/\s+/g, '')

  let weight = 400
  let label = 'Regular'
  if (weightKey) {
    const hit = WEIGHT_TOKENS.find(([re]) => re.test(weightKey))
    if (hit) {
      weight = hit[1]
      label = hit[2]
    } else {
      label = weightRaw
    }
  }

  return { family, weight, italic, variable, label, format }
}

/** Baut aus einer Dateinamen-Liste ein Font-Manifest (inkl. faces). */
export function buildManifestFromFiles(files: string[], urlBase: string): FontManifest {
  const base = urlBase.replace(/\/+$/, '')
  const out: FontManifest = {}

  for (const file of [...files].sort()) {
    const p = parseFontFileName(file)
    if (!p) continue
    if (!out[p.family]) out[p.family] = { variants: [], hasItalic: false, faces: [] }
    const fam = out[p.family]
    if (!fam.variants.includes(p.label)) fam.variants.push(p.label)
    if (p.italic) fam.hasItalic = true
    if (p.variable) fam.hasVariable = true
    fam.faces!.push({
      weight: p.variable ? '100 900' : p.weight,
      style: p.italic ? 'italic' : 'normal',
      src: [{ url: `${base}/${file}`, format: p.format }],
    })
  }

  // Varianten nach Gewicht sortieren (Regular < Medium < Bold ...).
  const weightOf = (label: string) => parseFontFileName(`X-${label}.woff2`)?.weight ?? 400
  for (const fam of Object.values(out)) {
    fam.variants.sort((a, b) => weightOf(a) - weightOf(b) || a.localeCompare(b))
  }

  return out
}

/** Extrahiert Font-Dateinamen aus einem Verzeichnis-Listing (JSON oder HTML). */
export function extractFontFilesFromListing(body: string): string[] {
  const files = new Set<string>()

  // 1) NGINX-Autoindex als JSON: [{ "name": "Foo.woff2", ... }, ...]
  try {
    const json = JSON.parse(body)
    if (Array.isArray(json)) {
      for (const entry of json) {
        const name = entry && typeof entry === 'object' ? (entry as { name?: string }).name : null
        if (name && /\.(woff2|woff|ttf|otf)$/i.test(name)) files.add(name)
      }
      return [...files]
    }
  } catch {
    // kein JSON – als HTML behandeln
  }

  // 2) HTML-Autoindex: href="Foo.woff2"
  const re = /href="([^"?#]+\.(?:woff2|woff|ttf|otf))"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const name = decodeURIComponent(m[1].split('/').pop() || '')
    if (name) files.add(name)
  }
  return [...files]
}

/** Lädt ein JSON-Manifest; gibt null bei Fehler/HTML/leer zurück. */
export async function fetchFontManifest(url: string): Promise<FontManifest | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
      return data as FontManifest
    }
  } catch {
    // ignorieren – nächste Quelle
  }
  return null
}

/** Versucht, Fonts direkt aus einem servierten Verzeichnis zu entdecken. */
export async function discoverFontsFromDirectory(dir: string): Promise<FontManifest | null> {
  try {
    const res = await fetch(dir)
    if (!res.ok) return null
    const body = await res.text()
    const files = extractFontFilesFromListing(body)
    if (files.length === 0) return null
    const manifest = buildManifestFromFiles(files, dir)
    return Object.keys(manifest).length > 0 ? manifest : null
  } catch {
    return null
  }
}

/**
 * Injiziert @font-face-Regeln für alle Familien mit `faces` per FontFace-API.
 * Idempotent: bereits injizierte Schnitte werden übersprungen.
 */
const injectedFaces = new Set<string>()
export function injectFontFaces(manifest: FontManifest): void {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return

  for (const [family, def] of Object.entries(manifest)) {
    for (const face of def.faces ?? []) {
      if (!face.src?.length) continue
      const key = `${family}|${face.weight}|${face.style}`
      if (injectedFaces.has(key)) continue
      injectedFaces.add(key)

      const src = face.src.map((s) => `url("${s.url}") format("${s.format}")`).join(', ')
      try {
        const ff = new FontFace(family, src, {
          weight: String(face.weight),
          style: face.style,
          display: 'swap',
        })
        ff.load()
          .then((loaded) => document.fonts.add(loaded))
          .catch(() => {
            /* einzelner Schnitt nicht ladbar – ignorieren */
          })
      } catch {
        /* ungültiger Descriptor – ignorieren */
      }
    }
  }
}

/**
 * Lädt das Font-Manifest aus den bevorzugten Quellen und injiziert die
 * @font-face-Regeln. Reihenfolge:
 *   1. /fonts/fonts.json           (generiertes Manifest im Server-Ordner)
 *   2. <base>/fonts.json           (gebündelter Fallback, z. B. Dev)
 *   3. /fonts/  Verzeichnis-Listing (falls Autoindex aktiv)
 */
export async function loadCustomFonts(basePath: string): Promise<FontManifest> {
  const manifest =
    (await fetchFontManifest('/fonts/fonts.json')) ||
    (await fetchFontManifest(basePath.replace(/\/+$/, '/') + 'fonts.json')) ||
    (await discoverFontsFromDirectory('/fonts/'))

  if (manifest && Object.keys(manifest).length > 0) {
    injectFontFaces(manifest)
    return manifest
  }
  return {}
}
