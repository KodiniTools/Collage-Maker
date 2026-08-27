import { describe, it, expect } from 'vitest'
import {
  humanizeFamily,
  parseFontFileName,
  buildManifestFromFiles,
  extractFontFilesFromListing,
} from '@/utils/fonts'

describe('humanizeFamily', () => {
  it('splits CamelCase into words', () => {
    expect(humanizeFamily('ClashDisplay')).toBe('Clash Display')
    expect(humanizeFamily('Supreme')).toBe('Supreme')
    expect(humanizeFamily('PP_Neue')).toBe('PP Neue')
  })
})

describe('parseFontFileName', () => {
  it('parses family + weight', () => {
    expect(parseFontFileName('Supreme-Bold.woff2')).toMatchObject({
      family: 'Supreme',
      weight: 700,
      italic: false,
      label: 'Bold',
      format: 'woff2',
    })
  })

  it('defaults to Regular 400 when no weight token', () => {
    expect(parseFontFileName('Supreme.woff2')).toMatchObject({
      family: 'Supreme',
      weight: 400,
      label: 'Regular',
    })
  })

  it('detects italic and strips it from the weight', () => {
    expect(parseFontFileName('Supreme-BoldItalic.woff2')).toMatchObject({
      family: 'Supreme',
      weight: 700,
      italic: true,
      label: 'Bold',
    })
    expect(parseFontFileName('Supreme-Italic.woff2')).toMatchObject({
      weight: 400,
      italic: true,
      label: 'Regular',
    })
  })

  it('maps common weight tokens', () => {
    expect(parseFontFileName('X-Thin.woff2')?.weight).toBe(100)
    expect(parseFontFileName('X-ExtraLight.woff2')?.weight).toBe(200)
    expect(parseFontFileName('X-Light.woff2')?.weight).toBe(300)
    expect(parseFontFileName('X-Medium.woff2')?.weight).toBe(500)
    expect(parseFontFileName('X-SemiBold.woff2')?.weight).toBe(600)
    expect(parseFontFileName('X-ExtraBold.woff2')?.weight).toBe(800)
    expect(parseFontFileName('X-Black.woff2')?.weight).toBe(900)
  })

  it('recognises different formats', () => {
    expect(parseFontFileName('X.ttf')?.format).toBe('truetype')
    expect(parseFontFileName('X.otf')?.format).toBe('opentype')
    expect(parseFontFileName('X.woff')?.format).toBe('woff')
  })

  it('ignores non-font files', () => {
    expect(parseFontFileName('readme.txt')).toBeNull()
    expect(parseFontFileName('noext')).toBeNull()
  })

  it('flags variable fonts', () => {
    expect(parseFontFileName('Inter-Variable.woff2')?.variable).toBe(true)
  })
})

describe('buildManifestFromFiles', () => {
  it('groups faces by family with variants + italic flag', () => {
    const manifest = buildManifestFromFiles(
      [
        'Supreme-Regular.woff2',
        'Supreme-Bold.woff2',
        'Supreme-Italic.woff2',
        'ClashDisplay-SemiBold.woff2',
      ],
      '/fonts/'
    )

    expect(Object.keys(manifest).sort()).toEqual(['Clash Display', 'Supreme'])
    expect(manifest['Supreme'].variants).toEqual(['Regular', 'Bold'])
    expect(manifest['Supreme'].hasItalic).toBe(true)
    expect(manifest['Supreme'].faces).toHaveLength(3)
    const urls = manifest['Supreme'].faces?.map((f) => f.src[0].url)
    expect(urls).toContain('/fonts/Supreme-Regular.woff2')
    expect(urls).toContain('/fonts/Supreme-Bold.woff2')
    expect(manifest['Clash Display'].variants).toEqual(['SemiBold'])
  })

  it('handles a trailing slash in the url base', () => {
    const m = buildManifestFromFiles(['Supreme-Bold.woff2'], '/fonts')
    expect(m['Supreme'].faces?.[0].src[0].url).toBe('/fonts/Supreme-Bold.woff2')
  })
})

describe('extractFontFilesFromListing', () => {
  it('parses a JSON autoindex listing', () => {
    const body = JSON.stringify([
      { name: 'Supreme-Bold.woff2', type: 'file' },
      { name: 'readme.txt', type: 'file' },
      { name: 'sub', type: 'directory' },
    ])
    expect(extractFontFilesFromListing(body)).toEqual(['Supreme-Bold.woff2'])
  })

  it('parses an HTML autoindex listing', () => {
    const body = `
      <html><body>
      <a href="Supreme-Regular.woff2">Supreme-Regular.woff2</a>
      <a href="ClashDisplay-Bold.otf">ClashDisplay-Bold.otf</a>
      <a href="../">Parent</a>
      </body></html>`
    expect(extractFontFilesFromListing(body).sort()).toEqual([
      'ClashDisplay-Bold.otf',
      'Supreme-Regular.woff2',
    ])
  })

  it('returns nothing for a listing without fonts', () => {
    expect(extractFontFilesFromListing('<html><a href="index.html">x</a></html>')).toEqual([])
  })
})
