import { describe, it, expect } from 'vitest'
import de from '@/i18n/de'
import en from '@/i18n/en'
import { ssiNavTranslations } from '@/i18n/nav'
import { i18n } from '@/i18n'

type Tree = string | Tree[] | { [key: string]: Tree }

/** Flacht verschachtelte Texte zu `pfad → text` ab (Arrays mit Index im Pfad). */
function flatten(node: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof node === 'string') {
    out.set(prefix, node)
    return out
  }
  const entries = Array.isArray(node)
    ? node.map((value, index) => [String(index), value] as const)
    : Object.entries(node)
  for (const [key, value] of entries) {
    for (const [path, text] of flatten(value, prefix ? `${prefix}.${key}` : key)) {
      out.set(path, text)
    }
  }
  return out
}

/** Benannte Platzhalter wie `{count}`, sortiert. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
}

const deFlat = flatten(de as unknown as Tree)
const enFlat = flatten(en as unknown as Tree)

describe('i18n-Parität', () => {
  it('DE und EN haben exakt dieselben Schlüssel (inkl. FAQ-Listen)', () => {
    const missingInEn = [...deFlat.keys()].filter((key) => !enFlat.has(key))
    const extraInEn = [...enFlat.keys()].filter((key) => !deFlat.has(key))
    expect(missingInEn).toEqual([])
    expect(extraInEn).toEqual([])
    expect(deFlat.size).toBeGreaterThan(500)
  })

  it('kein Text ist leer', () => {
    const empty = [...deFlat, ...enFlat].filter(([, text]) => text.trim() === '')
    expect(empty).toEqual([])
  })

  it('Platzhalter stimmen je Schlüssel überein', () => {
    const mismatched = [...deFlat]
      .filter(([key, text]) => {
        const other = enFlat.get(key)
        return other !== undefined && placeholders(text).join() !== placeholders(other).join()
      })
      .map(([key]) => key)
    expect(mismatched).toEqual([])
  })

  it('SSI-Navigation: DE und EN haben dieselben Schlüssel', () => {
    expect(Object.keys(ssiNavTranslations.en).sort()).toEqual(
      Object.keys(ssiNavTranslations.de).sort()
    )
  })

  it('vue-i18n nutzt die TS-Texte, Fallback bleibt EN', () => {
    expect(i18n.global.availableLocales.sort()).toEqual(['de', 'en'])
    expect(i18n.global.fallbackLocale.value).toBe('en')
    expect(i18n.global.getLocaleMessage('de')).toEqual(de)
    expect(i18n.global.getLocaleMessage('en')).toEqual(en)
  })
})
