/**
 * Regressionsschutz für die Design-Tokens der Oberfläche.
 *
 * Die Palette ist in tailwind.config.js definiert (primary, accent, warm, muted,
 * surface, cream, navy). Diese Tests stellen sicher, dass Komponenten keine
 * Tailwind-Standardgrautöne (slate-50 … slate-900), kein reines Weiß als
 * Dark-Mode-Textfarbe und keine undefinierten Farbklassen (text-text) nutzen und
 * dass die UI-Schrift Supreme in allen verwendeten Gewichten geladen wird.
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
  it('nutzen keine Tailwind-Standardgrautöne (slate-50 … slate-900)', () => {
    // Die eigene Palette definiert slate / slate-light / slate-dark; numerische
    // Stufen sind Tailwind-Defaults außerhalb des Markenfarbraums.
    expect(findInVueFiles(/\bslate-\d{3}\b/)).toEqual([])
  })

  it('nutzen keine undefinierten Farbklassen (text-text, text-text-dark)', () => {
    expect(findInVueFiles(/\btext-text(?:-dark)?\b/)).toEqual([])
  })

  it('nutzen im Dark-Mode surface-light statt reinem Weiß als Textfarbe', () => {
    expect(findInVueFiles(/\bdark:(?:hover:)?text-white\b/)).toEqual([])
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
