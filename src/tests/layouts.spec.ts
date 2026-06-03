import { describe, it, expect } from 'vitest'
import { fitImage, computeLayout } from '@/lib/layouts'
import type { CollageImage } from '@/types'

function makeImg(id: string, width = 200, height = 150): CollageImage {
  return {
    id,
    file: new File([], 'test.jpg'),
    url: `blob:${id}`,
    x: 0,
    y: 0,
    width,
    height,
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
  }
}

function makeImgs(count: number): CollageImage[] {
  return Array.from({ length: count }, (_, i) => makeImg(`img-${i}`))
}

describe('fitImage', () => {
  it('fits image into cell respecting aspect ratio', () => {
    const img = makeImg('a', 400, 200) // 2:1 ratio
    fitImage(img, 0, 0, 300, 300) // square cell
    // In a square cell, width-constrained: newWidth = 290, newHeight = 145
    expect(img.width).toBeCloseTo(290)
    expect(img.height).toBeCloseTo(145)
    expect(img.rotation).toBe(0)
  })

  it('centers image in cell', () => {
    const img = makeImg('a', 100, 100) // 1:1 ratio
    fitImage(img, 0, 0, 200, 400, 0) // tall cell, no padding
    // Height-constrained: newHeight = 400, newWidth = 400 — but cell width is 200
    // Width-constrained: newWidth = 200, newHeight = 200
    expect(img.width).toBeCloseTo(200)
    expect(img.height).toBeCloseTo(200)
    expect(img.y).toBeCloseTo(100) // centered vertically: (400-200)/2
  })

  it('respects padding parameter', () => {
    const img = makeImg('a', 1, 1) // 1:1
    fitImage(img, 0, 0, 100, 100, 10) // 10px padding each side
    expect(img.width).toBeCloseTo(80)
    expect(img.height).toBeCloseTo(80)
  })

  it('positions image relative to cell origin', () => {
    const img = makeImg('a', 1, 1)
    fitImage(img, 50, 100, 200, 200, 0)
    expect(img.x).toBeGreaterThanOrEqual(50)
    expect(img.y).toBeGreaterThanOrEqual(100)
  })
})

describe('computeLayout', () => {
  const W = 800
  const H = 600

  describe('grid-2x2', () => {
    it('places 4 images in a 2x2 grid', () => {
      const imgs = makeImgs(4)
      computeLayout('grid-2x2', imgs, W, H)
      // Top-left image should be in first cell
      expect(imgs[0].x).toBeGreaterThanOrEqual(0)
      expect(imgs[0].x).toBeLessThan(W / 2)
      // Second image should be in right column
      expect(imgs[1].x).toBeGreaterThanOrEqual(W / 2 - 1)
    })

    it('handles fewer than 4 images', () => {
      const imgs = makeImgs(2)
      expect(() => computeLayout('grid-2x2', imgs, W, H)).not.toThrow()
    })
  })

  describe('grid-3x3', () => {
    it('places images using 3 columns', () => {
      const imgs = makeImgs(6)
      computeLayout('grid-3x3', imgs, W, H)
      // 4th image (index 3) should start 2nd row, 1st column
      expect(imgs[3].x).toBeGreaterThanOrEqual(0)
      expect(imgs[3].x).toBeLessThan(W / 3)
    })
  })

  describe('grid-2x3', () => {
    it('uses 2 columns and 3 rows', () => {
      const imgs = makeImgs(6)
      computeLayout('grid-2x3', imgs, W, H)
      // 3rd image should be in second row, first column
      expect(imgs[2].x).toBeGreaterThanOrEqual(0)
      expect(imgs[2].x).toBeLessThan(W / 2)
    })
  })

  describe('magazine', () => {
    it('first image spans left 65%', () => {
      const imgs = makeImgs(3)
      computeLayout('magazine', imgs, W, H)
      expect(imgs[0].x).toBeLessThan(W * 0.65)
    })

    it('remaining images are on the right', () => {
      const imgs = makeImgs(3)
      computeLayout('magazine', imgs, W, H)
      expect(imgs[1].x).toBeGreaterThanOrEqual(W * 0.65 - 1)
      expect(imgs[2].x).toBeGreaterThanOrEqual(W * 0.65 - 1)
    })
  })

  describe('spotlight', () => {
    it('first image takes top 70% of height', () => {
      const imgs = makeImgs(4)
      computeLayout('spotlight', imgs, W, H)
      expect(imgs[0].y).toBeGreaterThanOrEqual(0)
      expect(imgs[0].y).toBeLessThan(H * 0.1) // starts near top
    })
  })

  describe('hero', () => {
    it('first image starts at y=0', () => {
      const imgs = makeImgs(3)
      computeLayout('hero', imgs, W, H)
      expect(imgs[0].y).toBeGreaterThanOrEqual(0)
      expect(imgs[0].y).toBeLessThan(H * 0.1)
    })

    it('remaining images are positioned in bottom 40%', () => {
      const imgs = makeImgs(3)
      computeLayout('hero', imgs, W, H)
      expect(imgs[1].y).toBeGreaterThanOrEqual(H * 0.6 - 1)
    })
  })

  describe('triptych', () => {
    it('first image is in the center column', () => {
      const imgs = makeImgs(3)
      computeLayout('triptych', imgs, W, H)
      // Center image (index 0) starts at sideWidth = W*0.25
      expect(imgs[0].x).toBeGreaterThanOrEqual(W * 0.25 - 1)
    })

    it('second image is in left column', () => {
      const imgs = makeImgs(3)
      computeLayout('triptych', imgs, W, H)
      expect(imgs[1].x).toBeGreaterThanOrEqual(0)
      expect(imgs[1].x).toBeLessThan(W * 0.25)
    })
  })

  describe('masonry', () => {
    it('places images starting at x=0 for first', () => {
      const imgs = makeImgs(3)
      computeLayout('masonry', imgs, W, H)
      expect(imgs[0].x).toBeGreaterThanOrEqual(0)
    })

    it('distributes images across columns', () => {
      const imgs = makeImgs(6)
      computeLayout('masonry', imgs, W, H)
      const xPositions = imgs.map((img) => img.x)
      const uniqueColumns = new Set(xPositions.map((x) => Math.round(x / (W / 3))))
      expect(uniqueColumns.size).toBeGreaterThan(1)
    })
  })

  describe('edge cases', () => {
    it('does not throw with 0 images', () => {
      expect(() => computeLayout('grid-2x2', [], W, H)).not.toThrow()
    })

    it('does not throw with 1 image for any layout type', () => {
      const layouts = [
        'grid-2x2', 'grid-3x3', 'grid-2x3', 'magazine', 'spotlight',
        'hero', 'sidebar', 'mosaic', 'diagonal', 'panorama', 'focus',
        'triptych', 'masonry',
      ] as const
      for (const layout of layouts) {
        expect(() => computeLayout(layout, makeImgs(1), W, H)).not.toThrow()
      }
    })

    it('handles many images without throwing', () => {
      expect(() => computeLayout('masonry', makeImgs(20), W, H)).not.toThrow()
      expect(() => computeLayout('mosaic', makeImgs(20), W, H)).not.toThrow()
      expect(() => computeLayout('focus', makeImgs(10), W, H)).not.toThrow()
    })
  })
})
