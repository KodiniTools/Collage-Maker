// @vitest-environment node
/**
 * Gefüllte Gold-Buttons: dunkelgold mit weisser Schrift und Verlauf nach
 * Equalizer-19-Muster, auf allen Seiten (Tokens auf :root in landing-tokens.css).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf8')
const tokens = read('design-system/landing-tokens.css')
const rootBlock = tokens.match(/^:root \{([^}]*)\}/m)?.[1] ?? ''
const value = (name: string) =>
  rootBlock.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim() ?? ''

describe('Button-Verlauf', () => {
  it('Tokens liegen auf :root und gelten damit auch für FAQ, Blog und Artikel', () => {
    expect(value('--collage-action')).toBe('#8f6320')
    expect(value('--collage-on-action')).toBe('#ffffff')
  })

  it.each(['--collage-action-grad', '--collage-action-grad-hover'])(
    '%s: jeder Stopp erreicht mit weisser Schrift 4,5:1',
    (token) => {
      const stops = value(token).match(/#[0-9a-f]{6}/gi) ?? []
      expect(stops).toHaveLength(3)
      for (const stop of stops) expect(contrastRatio('#ffffff', stop)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('UiButton, UiIconButton, Editor-Link und Sprachauswahl nutzen den Verlauf', () => {
    const fill = 'background: var(--collage-action) var(--collage-action-grad);'
    expect(read('components/ui/UiButton.vue')).toContain(fill)
    expect(read('components/ui/UiIconButton.vue')).toContain(fill)
    expect(read('components/collage-header.css')).toContain(fill)
    expect(read('style.css')).toContain('background-image: var(--collage-action-grad) !important;')
  })

  it('Schalter bleiben flach', () => {
    expect(read('pages/editor-controls.css')).toMatch(
      /\.ui-switch__track--on \{\s*background: var\(--collage-action\);/
    )
  })
})
