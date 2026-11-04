import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CHUNK_RELOAD_KEY,
  clearChunkReloadFlag,
  isChunkLoadError,
  reloadOnChunkError,
} from '@/router/chunkReload'

function fakeWindow() {
  return { location: { assign: vi.fn() } as unknown as Location, sessionStorage }
}

describe('chunkReload', () => {
  beforeEach(() => sessionStorage.clear())

  it('erkennt Chunk-Ladefehler der gängigen Browser', () => {
    expect(
      isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: x.js'))
    ).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/a.css'))).toBe(true)
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })

  it('lädt bei Chunk-Fehler einmal die Zielseite neu', () => {
    const win = fakeWindow()
    const error = new TypeError('Failed to fetch dynamically imported module')

    expect(reloadOnChunkError(error, '/collagemaker/editor', win)).toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith('/collagemaker/editor')
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('/collagemaker/editor')

    // Zweiter Fehler für dasselbe Ziel: kein erneutes Neuladen (keine Schleife)
    expect(reloadOnChunkError(error, '/collagemaker/editor', win)).toBe(false)
    expect(win.location.assign).toHaveBeenCalledTimes(1)
  })

  it('ignoriert andere Fehler', () => {
    const win = fakeWindow()
    expect(reloadOnChunkError(new Error('boom'), '/collagemaker/faq', win)).toBe(false)
    expect(win.location.assign).not.toHaveBeenCalled()
  })

  it('nach erfolgreicher Navigation greift der Schutz für einen späteren Deploy wieder', () => {
    const win = fakeWindow()
    const error = new TypeError('Failed to fetch dynamically imported module')
    reloadOnChunkError(error, '/collagemaker/editor', win)
    clearChunkReloadFlag(sessionStorage)

    expect(reloadOnChunkError(error, '/collagemaker/editor', win)).toBe(true)
    expect(win.location.assign).toHaveBeenCalledTimes(2)
  })
})
