import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCollageStore } from '@/stores/collage'
import { useDragResize } from '@/composables/useDragResize'
import type { GuideLine } from '@/composables/useAlignmentGuides'
import type { CollageText } from '@/types'
import { makeImg } from './helpers/makeImg'

// Anzeige-Zoom 0.5 und Canvas-Versatz (10|20): prüft die Koordinaten-Umrechnung mit.
const FIT = 0.5
const RECT = { left: 10, top: 20 }

/** Wandelt Canvas-Koordinaten in Client-Koordinaten (wie ein echtes Maus-Event). */
function mouse(x: number, y: number, extra: Partial<MouseEvent> = {}): MouseEvent {
  return {
    clientX: x * FIT + RECT.left,
    clientY: y * FIT + RECT.top,
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: () => {},
    ...extra,
  } as unknown as MouseEvent
}

function touch(points: [number, number][]): TouchEvent {
  return {
    touches: points.map(([x, y]) => ({
      clientX: x * FIT + RECT.left,
      clientY: y * FIT + RECT.top,
    })),
    preventDefault: () => {},
  } as unknown as TouchEvent
}

/** Minimaler 2D-Kontext: jedes Zeichen ist 10px breit. */
function fakeCtx(): CanvasRenderingContext2D {
  return {
    save() {},
    restore() {},
    measureText: (s: string) => ({ width: s.length * 10 }),
    font: '',
    letterSpacing: '',
    textAlign: 'left',
  } as unknown as CanvasRenderingContext2D
}

function makeText(overrides: Partial<CollageText> = {}): CollageText {
  return {
    id: 't1',
    text: 'Hallo',
    x: 500,
    y: 500,
    fontSize: 20,
    fontFamily: 'Arial',
    color: '#000',
    rotation: 0,
    zIndex: 5,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    shadowEnabled: false,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '#000',
    strokeEnabled: false,
    strokeColor: '#000',
    strokeWidth: 0,
    letterSpacing: 0,
    ...overrides,
  }
}

function setup(
  opts: {
    snap?: { snapX?: number | null; snapY?: number | null }
    resizeSnap?: Partial<Record<'snapLeft' | 'snapRight' | 'snapTop' | 'snapBottom', number>>
  } = {}
) {
  const canvas = ref({ getBoundingClientRect: () => RECT } as unknown as HTMLCanvasElement)
  const panOffset = ref({ x: 0, y: 0 })
  const spacePressed = ref(false)
  const activeGuides = ref<GuideLine[]>([])
  const onDoubleTap = vi.fn()
  const ctx = fakeCtx()
  const api = useDragResize(
    canvas,
    computed(() => FIT),
    panOffset,
    spacePressed,
    {
      activeGuides,
      detectAlignments: () => ({
        snapX: opts.snap?.snapX ?? null,
        snapY: opts.snap?.snapY ?? null,
        guides: [],
      }),
      detectResizeAlignments: () => ({
        snapLeft: opts.resizeSnap?.snapLeft ?? null,
        snapRight: opts.resizeSnap?.snapRight ?? null,
        snapTop: opts.resizeSnap?.snapTop ?? null,
        snapBottom: opts.resizeSnap?.snapBottom ?? null,
        guides: [],
      }),
    },
    () => ctx,
    onDoubleTap
  )
  return { api, panOffset, spacePressed, onDoubleTap }
}

describe('useDragResize', () => {
  let collage: ReturnType<typeof useCollageStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof URL.revokeObjectURL !== 'function') URL.revokeObjectURL = () => {}
    collage = useCollageStore()
    // Bild a: x 100–400, y 200–350
    collage.images.push(makeImg('a', { x: 100, y: 200, width: 300, height: 150, zIndex: 1 }))
  })

  const img = (id = 'a') => collage.images.find((i) => i.id === id)!

  describe('Verschieben', () => {
    it('wählt ein Bild per Klick aus und verschiebt es', () => {
      const { api } = setup()
      api.handleMouseDown(mouse(150, 250))
      expect(collage.selectedImageId).toBe('a')
      api.handleMouseMove(mouse(170, 260))
      expect(img()).toMatchObject({ x: 120, y: 210 })
      expect(collage.canUndo).toBe(true)
      api.handleMouseUp()
      expect(api.cursorStyle.value).toBe('default')
    })

    it('verschiebt alle ausgewählten Bilder gemeinsam', () => {
      collage.images.push(makeImg('b', { x: 500, y: 500, width: 50, height: 50 }))
      collage.selectImage('a')
      collage.toggleImageSelection('b')
      const { api } = setup()
      api.handleMouseDown(mouse(150, 250))
      api.handleMouseMove(mouse(160, 255))
      expect(img('a')).toMatchObject({ x: 110, y: 205 })
      expect(img('b')).toMatchObject({ x: 510, y: 505 })
    })

    it('Ctrl+Klick ergänzt die Auswahl', () => {
      collage.images.push(makeImg('b', { x: 500, y: 500, width: 50, height: 50 }))
      collage.selectImage('b')
      const { api } = setup()
      api.handleMouseDown(mouse(150, 250, { ctrlKey: true }))
      expect(collage.selectedImageIds).toEqual(['b', 'a'])
    })

    it('rastet beim Verschieben an Hilfslinien ein', () => {
      const { api } = setup({ snap: { snapX: 0 } })
      api.handleMouseDown(mouse(150, 250))
      api.handleMouseMove(mouse(170, 260))
      expect(img()).toMatchObject({ x: 0, y: 210 })
    })

    it('ignoriert Galerie-Vorlagen', () => {
      img().isGalleryTemplate = true
      const { api } = setup()
      api.handleMouseDown(mouse(150, 250))
      expect(collage.selectedImageId).toBeNull()
    })
  })

  describe('Größe ändern', () => {
    it('SE-Griff ohne Seitenverhältnis-Sperre', () => {
      collage.setLockAspectRatio(false)
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(400, 350))
      api.handleMouseMove(mouse(440, 370))
      expect(img()).toMatchObject({ x: 100, y: 200, width: 340, height: 170 })
    })

    it('NW-Griff mit Seitenverhältnis-Sperre', () => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(100, 200))
      api.handleMouseMove(mouse(70, 170))
      expect(img()).toMatchObject({ x: 55, y: 177.5, width: 345, height: 172.5 })
    })

    it('Shift kehrt die Sperre um (E-Griff)', () => {
      collage.setLockAspectRatio(false)
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(400, 275))
      api.handleMouseMove(mouse(460, 275, { shiftKey: true }))
      expect(img()).toMatchObject({ x: 100, y: 185, width: 360, height: 180 })
    })

    it.each([
      ['n', 250, 200, 250, 180, { x: 80, y: 180, width: 340, height: 170 }],
      ['ne', 400, 200, 430, 170, { x: 100, y: 177.5, width: 345, height: 172.5 }],
      ['s', 250, 350, 250, 380, { x: 70, y: 200, width: 360, height: 180 }],
      ['sw', 100, 350, 70, 380, { x: 55, y: 200, width: 345, height: 172.5 }],
      ['w', 100, 275, 40, 275, { x: 40, y: 185, width: 360, height: 180 }],
    ])('%s-Griff mit Sperre', (_h, sx, sy, ex, ey, expected) => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(sx, sy))
      api.handleMouseMove(mouse(ex, ey))
      expect(img()).toMatchObject(expected)
    })

    it('hält die Mindestgröße von 20px ein', () => {
      collage.setLockAspectRatio(false)
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(400, 350))
      api.handleMouseMove(mouse(110, 210))
      expect(img()).toMatchObject({ width: 300, height: 150 })
    })

    it('rastet die rechte Kante an Hilfslinien ein', () => {
      collage.setLockAspectRatio(false)
      collage.selectImage('a')
      const { api } = setup({ resizeSnap: { snapRight: 500 } })
      api.handleMouseDown(mouse(400, 350))
      api.handleMouseMove(mouse(440, 370))
      expect(img()).toMatchObject({ x: 100, width: 400, height: 170 })
    })

    it('trifft Griffe auch bei gedrehtem Bild', () => {
      img().rotation = 90
      collage.selectImage('a')
      const { api } = setup()
      // SE-Ecke (lokal 150|75) um 90° um die Mitte (250|275) gedreht → (175|425)
      api.handleMouseMove(mouse(175, 425))
      expect(api.cursorStyle.value).toBe('se-resize')
    })
  })

  describe('Cursor', () => {
    it('zeigt move im Bild und default außerhalb', () => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseMove(mouse(250, 275))
      expect(api.cursorStyle.value).toBe('move')
      api.handleMouseMove(mouse(700, 700))
      expect(api.cursorStyle.value).toBe('default')
    })

    it('zeigt Griff-Cursor', () => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseMove(mouse(250, 200))
      expect(api.cursorStyle.value).toBe('n-resize')
    })
  })

  describe('Löschen und Verzerren', () => {
    it('Löschbutton entfernt das Bild', () => {
      const { api } = setup()
      // Löschbutton-Mitte: lokal (132|-57) → Canvas (382|218)
      api.handleMouseDown(mouse(382, 218))
      expect(collage.images).toHaveLength(0)
    })

    it('Distort-Ecke verschiebt nur diese Ecke', () => {
      img().distortEnabled = true
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseMove(mouse(100, 200))
      expect(api.cursorStyle.value).toBe('crosshair')
      api.handleMouseDown(mouse(100, 200))
      api.handleMouseMove(mouse(90, 195))
      expect(img().cornerOffsets).toEqual({
        nw: { x: -10, y: -5 },
        ne: { x: 0, y: 0 },
        se: { x: 0, y: 0 },
        sw: { x: 0, y: 0 },
      })
      expect(img()).toMatchObject({ x: 100, y: 200, width: 300, height: 150 })
    })
  })

  describe('Text', () => {
    beforeEach(() => {
      collage.texts.push(makeText())
    })

    it('wählt Text per Klick aus und verschiebt ihn', () => {
      const { api } = setup()
      api.handleMouseDown(mouse(520, 500))
      expect(collage.selectedTextId).toBe('t1')
      api.handleMouseMove(mouse(530, 510))
      expect(collage.texts[0]).toMatchObject({ x: 510, y: 510 })
    })

    it('skaliert Text über den Eck-Griff', () => {
      collage.selectText('t1')
      const { api } = setup()
      // Box: left -5, right 55, top -17, bottom 17 → SE-Ecke (555|517)
      api.handleMouseMove(mouse(555, 517))
      expect(api.cursorStyle.value).toBe('nwse-resize')
      api.handleMouseDown(mouse(555, 517))
      api.handleMouseMove(mouse(610, 534))
      expect(collage.texts[0].fontSize).toBe(40)
    })
  })

  describe('Leerer Bereich und Pan', () => {
    it('Klick ins Leere hebt die Auswahl auf', () => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleMouseDown(mouse(700, 700))
      expect(collage.selectedImageId).toBeNull()
      expect(collage.isBackgroundSelected).toBe(false)
    })

    it('Klick ins Leere wählt ein vorhandenes Hintergrundbild', () => {
      collage.settings.backgroundImage.url = 'blob:bg'
      const { api } = setup()
      api.handleMouseDown(mouse(700, 700))
      expect(collage.isBackgroundSelected).toBe(true)
    })

    it('mittlere Maustaste verschiebt die Ansicht bei Zoom > 1', () => {
      collage.setCanvasZoom(2)
      const { api, panOffset } = setup()
      api.handleMouseDown({ ...mouse(0, 0), button: 1, clientX: 100, clientY: 100 } as MouseEvent)
      api.handleMouseMove({ ...mouse(0, 0), clientX: 130, clientY: 90 } as MouseEvent)
      expect(panOffset.value).toEqual({ x: 30, y: -10 })
      expect(api.cursorStyle.value).toBe('grabbing')
    })
  })

  describe('Touch', () => {
    it('Pinch skaliert das ausgewählte Bild um seine Mitte', () => {
      collage.selectImage('a')
      const { api } = setup()
      api.handleTouchStart(
        touch([
          [200, 300],
          [400, 300],
        ])
      )
      api.handleTouchMove(
        touch([
          [100, 300],
          [500, 300],
        ])
      )
      expect(img()).toMatchObject({ x: -50, y: 125, width: 600, height: 300 })
      api.handleTouchEnd(touch([]))
    })

    it('Pinch ohne Auswahl zoomt die Leinwand', () => {
      const { api } = setup()
      api.handleTouchStart(
        touch([
          [200, 300],
          [400, 300],
        ])
      )
      api.handleTouchMove(
        touch([
          [100, 300],
          [500, 300],
        ])
      )
      expect(collage.canvasZoom).toBe(2)
    })

    it('Ein-Finger-Drag verschiebt das Bild', () => {
      const { api } = setup()
      api.handleTouchStart(touch([[150, 250]]))
      api.handleTouchMove(touch([[170, 260]]))
      expect(img()).toMatchObject({ x: 120, y: 210 })
      api.handleTouchEnd(touch([]))
      expect(api.cursorStyle.value).toBe('default')
    })

    it('Touch-Griffe haben eine größere Trefferfläche', () => {
      collage.setLockAspectRatio(false)
      collage.selectImage('a')
      const { api } = setup()
      // 60px neben der SE-Ecke: nur mit Touch-Radius (40/0.5 = 80) ein Treffer
      api.handleTouchStart(touch([[460, 350]]))
      api.handleTouchMove(touch([[480, 370]]))
      expect(img()).toMatchObject({ width: 320, height: 170 })
    })

    it('Doppeltipp löst onDoubleTap aus', () => {
      const { api, onDoubleTap } = setup()
      api.handleTouchStart(touch([[700, 700]]))
      api.handleTouchEnd(touch([]))
      api.handleTouchStart(touch([[700, 700]]))
      expect(onDoubleTap).toHaveBeenCalledWith(700 * FIT + RECT.left, 700 * FIT + RECT.top)
    })
  })
})
