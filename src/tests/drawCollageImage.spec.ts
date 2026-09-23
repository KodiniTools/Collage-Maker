import { describe, it, expect } from 'vitest'
import { drawCollageImage } from '@/lib/export-engine/drawCollageImage'
import { makeImg } from './helpers/makeImg'
import type { CollageImage } from '@/types'

/** Kontext-Attrappe, die alle Methodenaufrufe und Property-Zuweisungen protokolliert. */
function createRecordingContext() {
  const log: string[] = []
  const target: Record<string, unknown> = {}
  const ctx = new Proxy(target, {
    get(_t, prop: string) {
      if (prop in target) return target[prop]
      return (...args: unknown[]) => {
        log.push(
          `${prop}(${args.map((a) => (typeof a === 'object' ? '[obj]' : String(a))).join(',')})`
        )
      }
    },
    set(_t, prop: string, value) {
      target[prop] = value
      log.push(`${prop}=${String(value)}`)
      return true
    },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log }
}

const htmlImg = { naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement

function record(overrides: Partial<CollageImage>) {
  const { ctx, log } = createRecordingContext()
  drawCollageImage(ctx, makeImg('a', { x: 10, y: 20, ...overrides }), htmlImg)
  return log
}

describe('drawCollageImage', () => {
  it('zeichnet ein einfaches Bild', () => {
    expect(record({})).toMatchSnapshot()
  })

  it('zeichnet runde Ecken mit Schatten und Doppelrahmen', () => {
    expect(
      record({
        borderRadius: 12,
        shadowEnabled: true,
        shadowOffsetX: 3,
        shadowOffsetY: 4,
        shadowBlur: 5,
        shadowColor: '#111',
        borderEnabled: true,
        borderWidth: 6,
        borderStyle: 'double',
        rotation: 30,
        flipHorizontal: true,
        skewX: 10,
        opacity: 0.5,
      })
    ).toMatchSnapshot()
  })

  it('zeichnet eckigen gestrichelten Rahmen mit Rahmenschatten', () => {
    expect(
      record({
        shadowEnabled: true,
        borderEnabled: true,
        borderStyle: 'dashed',
        borderShadowEnabled: true,
        borderShadowBlur: 7,
      })
    ).toMatchSnapshot()
  })
})
