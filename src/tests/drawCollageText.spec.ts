import { describe, it, expect } from 'vitest'
import { drawCollageText } from '@/lib/export-engine/drawCollageText'
import type { CollageText } from '@/types'

/** Kontext-Attrappe: protokolliert globalAlpha zum Zeitpunkt jedes Zeichenaufrufs. */
function createContext() {
  const draws: Array<{ op: string; alpha: unknown }> = []
  const state: Record<string, unknown> = {}
  const ctx = new Proxy(state, {
    get(_t, prop: string) {
      if (prop in state) return state[prop]
      return () => {
        if (prop === 'fillText' || prop === 'strokeText') {
          draws.push({ op: prop, alpha: state.globalAlpha })
        }
      }
    },
    set(_t, prop: string, value) {
      state[prop] = value
      return true
    },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, draws }
}

const base: CollageText = {
  id: 't',
  text: 'Hallo',
  x: 10,
  y: 20,
  fontSize: 48,
  fontFamily: 'Arial',
  color: '#000000',
  rotation: 0,
  zIndex: 1,
  fontWeight: 400,
  fontStyle: 'normal',
  textAlign: 'center',
  shadowEnabled: false,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  shadowBlur: 4,
  shadowColor: '#000000',
  strokeEnabled: true,
  strokeColor: '#ffffff',
  strokeWidth: 2,
  letterSpacing: 0,
}

describe('drawCollageText', () => {
  it('zeichnet Umrandung und Füllung mit der Text-Deckkraft', () => {
    const { ctx, draws } = createContext()
    drawCollageText(ctx, { ...base, opacity: 0.4 })
    expect(draws).toEqual([
      { op: 'strokeText', alpha: 0.4 },
      { op: 'fillText', alpha: 0.4 },
    ])
  })

  it('zeichnet ältere Texte ohne Deckkraft-Feld voll deckend', () => {
    const { ctx, draws } = createContext()
    drawCollageText(ctx, base)
    expect(draws.every((d) => d.alpha === 1)).toBe(true)
  })
})
