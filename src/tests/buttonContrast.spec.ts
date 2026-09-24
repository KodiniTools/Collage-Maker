import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? vueFiles(path) : name.endsWith('.vue') ? [path] : []
  })
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Klassen-Strings mit Gold-Fläche (bg-accent bzw. hover:bg-accent, ohne /Opazität)
const FILLED = /(?<![\w:-])(?:hover:)?bg-accent(?![\w/-])/
const TEXT = /(?<![\w:-])(?:hover:)?text-[a-z]/

describe('Kontrast der Gold-Buttons', () => {
  // Farbwerte der accent-Palette direkt aus der Tailwind-Konfiguration lesen
  const block = readFileSync('tailwind.config.js', 'utf8').match(/accent: \{([^}]*)\}/)?.[1] ?? ''
  const color = (key: string) => block.match(new RegExp(`${key}: '(#[0-9a-fA-F]{6})'`))?.[1] ?? ''
  const accent = { DEFAULT: color('DEFAULT'), dark: color('dark'), ink: color('ink') }

  it('liest die Palette', () => {
    expect(accent).toEqual({ DEFAULT: '#c9984d', dark: '#a67d35', ink: '#091428' })
  })

  it('accent-ink erfüllt WCAG AA auf accent und accent-dark', () => {
    expect(contrast(accent.ink, accent.DEFAULT)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(accent.ink, accent.dark)).toBeGreaterThanOrEqual(4.5)
  })

  it('Text auf Gold-Flächen nutzt immer text-accent-ink', () => {
    const offenders: string[] = []
    for (const file of vueFiles('src')) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/"[^"\n]*"|'[^'\n]*'/g)) {
        const cls = m[0]
        if (!FILLED.test(cls) || !TEXT.test(cls)) continue
        // Jede Textfarbe, die auf der Gold-Fläche landet, muss accent-ink sein
        const onGold = cls
          .split(/\s+/)
          .filter((c) => /^(hover:)?text-(slate|white|surface|cream|muted|primary|navy)/.test(c))
        if (onGold.length > 0 && !cls.includes('text-accent-ink')) offenders.push(`${file}: ${cls}`)
        if (/(?<![\w:-])text-slate-dark/.test(cls) && !/border-accent/.test(cls)) {
          offenders.push(`${file}: ${cls}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
