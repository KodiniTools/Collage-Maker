import { describe, it, expect } from 'vitest'
import { relinkGalleryInstances, type SavedImage } from '@/composables/useAutoSave'

function savedImg(
  id: string,
  dataUrl: string,
  overrides: Partial<SavedImage> = {}
): SavedImage {
  // Nur die für die Migration relevanten Felder sind hier von Bedeutung.
  return {
    id,
    dataUrl,
    isGalleryTemplate: false,
    ...overrides,
  } as SavedImage
}

describe('relinkGalleryInstances (restore migration for pre-sourceId saves)', () => {
  it('backfills sourceId on instances that share a template dataUrl', () => {
    const images = [
      savedImg('tpl', 'DATA_A', { isGalleryTemplate: true }),
      savedImg('inst1', 'DATA_A'),
      savedImg('inst2', 'DATA_A'),
    ]

    relinkGalleryInstances(images)

    expect(images[1].sourceId).toBe('tpl')
    expect(images[2].sourceId).toBe('tpl')
    // Das Template selbst bekommt keine sourceId
    expect(images[0].sourceId).toBeUndefined()
  })

  it('does not overwrite an existing sourceId', () => {
    const images = [
      savedImg('tpl', 'DATA_A', { isGalleryTemplate: true }),
      savedImg('inst1', 'DATA_A', { sourceId: 'original' }),
    ]

    relinkGalleryInstances(images)

    expect(images[1].sourceId).toBe('original')
  })

  it('links instances to the correct template across multiple images', () => {
    const images = [
      savedImg('tplA', 'DATA_A', { isGalleryTemplate: true }),
      savedImg('tplB', 'DATA_B', { isGalleryTemplate: true }),
      savedImg('instA', 'DATA_A'),
      savedImg('instB', 'DATA_B'),
    ]

    relinkGalleryInstances(images)

    expect(images[2].sourceId).toBe('tplA')
    expect(images[3].sourceId).toBe('tplB')
  })

  it('leaves orphan instances (no matching template) without a sourceId', () => {
    const images = [savedImg('inst1', 'DATA_X')]

    relinkGalleryInstances(images)

    expect(images[0].sourceId).toBeUndefined()
  })
})
