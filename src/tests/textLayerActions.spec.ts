import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import type { CollageText, CollageImage } from '@/types'

function makeText(id: string, overrides: Partial<CollageText> = {}): CollageText {
  return {
    id,
    text: 'Hallo',
    x: 100,
    y: 100,
    fontSize: 48,
    fontFamily: 'Arial',
    color: '#000000',
    rotation: 0,
    zIndex: 0,
    fontWeight: 400,
    fontStyle: 'normal',
    textAlign: 'center',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000000',
    strokeEnabled: false,
    strokeColor: '#ffffff',
    strokeWidth: 2,
    letterSpacing: 0,
    ...overrides,
  }
}

function makeImg(id: string, overrides: Partial<CollageImage> = {}): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 0,
    opacity: 1,
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    borderShadowEnabled: false,
    borderShadowOffsetX: 0,
    borderShadowOffsetY: 0,
    borderShadowBlur: 0,
    borderShadowColor: '#000',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000',
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0,
    flipHorizontal: false,
    flipVertical: false,
    skewX: 0,
    skewY: 0,
    ...overrides,
  }
}

describe('text quick-action layer/rotate helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('rotateText adds degrees and wraps at 360', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t1', { rotation: 300 }))
    collage.rotateText('t1', 90)
    expect(collage.texts[0].rotation).toBe(30)
  })

  it('bringTextToFront lifts text above the highest image/text zIndex', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { zIndex: 5 }))
    collage.texts.push(makeText('t1', { zIndex: 1 }))
    collage.bringTextToFront('t1')
    expect(collage.texts[0].zIndex).toBe(6)
  })

  it('sendTextToBack drops text below the lowest image/text zIndex', () => {
    const collage = useCollageStore()
    collage.images.push(makeImg('a', { zIndex: 0 }))
    collage.texts.push(makeText('t1', { zIndex: 2 }))
    collage.sendTextToBack('t1')
    expect(collage.texts[0].zIndex).toBe(-1)
  })

  it('layer helpers record an undo snapshot', () => {
    const collage = useCollageStore()
    collage.texts.push(makeText('t1', { zIndex: 1 }))
    expect(collage.canUndo).toBe(false)
    collage.bringTextToFront('t1')
    expect(collage.canUndo).toBe(true)
  })
})
