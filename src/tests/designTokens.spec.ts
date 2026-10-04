/**
 * Regressionsschutz für die Design-Tokens der Oberfläche.
 *
 * Die Oberfläche läuft auf den gemeinsamen KodiniTools-Tokens (--ds-*, siehe
 * src/design-system/README.md). Tailwind kennt nur noch semantische Farbklassen
 * (surface, line, ink, accent, on-accent, link, Status); die Variablen wechseln
 * mit dem Theme. Diese Tests verhindern die Rückkehr der alten Palette, von
 * dark:-Varianten, Gradients, Blur, Karten-Schatten und Tailwind-Standardgrau
 * und stellen sicher, dass Supreme in allen genutzten Gewichten geladen wird.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC_DIR = join(__dirname, '..')

function collectVueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectVueFiles(full, out)
    } else if (entry.endsWith('.vue')) {
      out.push(full)
    }
  }
  return out
}

/** Liefert alle Zeilen (Datei:Zeile), in denen das Muster vorkommt. */
function findInVueFiles(pattern: RegExp): string[] {
  const hits: string[] = []
  for (const file of collectVueFiles(SRC_DIR)) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        hits.push(`${relative(SRC_DIR, file)}:${index + 1}`)
      }
    })
  }
  return hits
}

describe('Design-Tokens in Vue-Komponenten', () => {
  it('nutzen keine Klassen der alten Palette (primary, slate, cream, navy, warm, muted, accent-dark …)', () => {
    const legacy =
      /\b(?:bg|text|border|ring|from|to|via|fill|stroke|accent|divide|outline|placeholder)-(?:primary|slate|cream|navy|warm|muted|surface-(?:light|dark|darker)|accent-(?:dark|light|ink))(?:\b|\/)/
    expect(findInVueFiles(legacy)).toEqual([])
  })

  it('nutzen keine Tailwind-Standardfarben (slate-500, green-600, white/20 …)', () => {
    const defaults =
      /\b(?:bg|text|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b|\b(?:bg|text|border)-white\/\d+/
    expect(findInVueFiles(defaults)).toEqual([])
  })

  it('nutzen keine dark:-Varianten mehr (die Tokens wechseln mit dem Theme)', () => {
    expect(findInVueFiles(/\bdark:/)).toEqual([])
  })

  it('nutzen keine Gradients, Blur, Blob-Animation oder Karten-Schatten', () => {
    const effects =
      /\b(?:bg-gradient-to-\w+|backdrop-blur(?:-\w+)?|blur-3xl|animate-blob|(?:hover:)?shadow-(?:sm|md|lg|xl|2xl)|hover:scale-\d+|hover:-translate-y-\d+)\b/
    expect(findInVueFiles(effects)).toEqual([])
  })

  it('nutzen nur die drei Radien und die Token-Dauern', () => {
    expect(findInVueFiles(/\brounded-(?:xl|2xl|3xl)\b|\bduration-\d+\b/)).toEqual([])
  })

  it('setzen Fokus über den Fokus-Ring der Tokens statt focus:ring-*', () => {
    expect(findInVueFiles(/\bfocus:ring-/)).toEqual([])
  })

  it('nutzen keine undefinierten Farbklassen (text-text, text-text-dark)', () => {
    expect(findInVueFiles(/\btext-text(?:-dark)?\b/)).toEqual([])
  })
})

describe('UI-Schrift Supreme', () => {
  const styleCss = readFileSync(join(SRC_DIR, 'style.css'), 'utf8')

  it.each([400, 500, 700])('deklariert @font-face für Gewicht %i', (weight) => {
    const faces = styleCss.match(/@font-face\s*{[^}]*}/g) ?? []
    const supremeFaces = faces.filter((face) => /font-family:\s*'Supreme'/.test(face))
    const match = supremeFaces.find((face) => new RegExp(`font-weight:\\s*${weight}\\b`).test(face))
    expect(match, `Kein @font-face für Supreme ${weight}`).toBeDefined()
    expect(match).toMatch(/\.\/assets\/fonts\/Supreme-(Regular|Medium|Bold)\.woff2/)
  })
})

describe('Leinwand-Overlays', () => {
  const overlayFiles = ['composables/useCanvasRenderer.ts', 'composables/useAlignmentGuides.ts']

  it.each(overlayFiles)('%s zeichnet Auswahl und Hilfslinien mit Token-Farben', (file) => {
    const src = readFileSync(join(SRC_DIR, file), 'utf8')
    // Nur Weiß bleibt als fester Wert (X im Löschbutton, Handle-Füllung, Häkchen).
    const hexValues = (src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter(
      (hex) => hex.toLowerCase() !== '#ffffff'
    )
    expect(hexValues).toEqual([])
    expect(src).toMatch(/themeColorsV2\(settings\.theme\)/)
  })
})
