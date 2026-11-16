import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { escapeHtml, localizeIndexHtml } from '@/config/seoHtml'
import en from '@/i18n/en'

const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf8')

const english = () =>
  localizeIndexHtml(indexHtml, {
    locale: 'en',
    title: en.seo.landing.title,
    description: en.seo.landing.description,
  })

function metaContent(html: string, attr: 'name' | 'property', key: string): string | undefined {
  const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`)
  return html.match(re)?.[1]
}

describe('localizeIndexHtml (index.en.html)', () => {
  it('setzt html lang, Titel, Description und Canonical auf Englisch', () => {
    const html = english()
    expect(html).toContain('<html lang="en">')
    expect(html).toContain(`<title>${escapeHtml(en.seo.landing.title)}</title>`)
    expect(metaContent(html, 'name', 'description')).toBe(escapeHtml(en.seo.landing.description))
    expect(html).toContain(
      '<link rel="canonical" href="https://kodinitools.com/collagemaker/?lang=en" />'
    )
  })

  it('setzt Open Graph und Twitter wie useSeo() zur Laufzeit', () => {
    const html = english()
    const title = escapeHtml(en.seo.landing.title)
    const description = escapeHtml(en.seo.landing.description)
    expect(metaContent(html, 'property', 'og:title')).toBe(title)
    expect(metaContent(html, 'property', 'og:description')).toBe(description)
    expect(metaContent(html, 'property', 'og:url')).toBe(
      'https://kodinitools.com/collagemaker/?lang=en'
    )
    expect(metaContent(html, 'property', 'og:locale')).toBe('en_US')
    expect(metaContent(html, 'property', 'og:locale:alternate')).toBe('de_DE')
    expect(metaContent(html, 'name', 'twitter:title')).toBe(title)
    expect(metaContent(html, 'name', 'twitter:description')).toBe(description)
  })

  it('lässt hreflang, Skripte, SSI-Includes und App-Mount unverändert', () => {
    const html = english()
    for (const line of [
      '<link rel="alternate" hreflang="de" href="https://kodinitools.com/collagemaker/" />',
      '<link rel="alternate" hreflang="en" href="https://kodinitools.com/collagemaker/?lang=en" />',
      '<link rel="alternate" hreflang="x-default" href="https://kodinitools.com/collagemaker/" />',
      '<!--#include virtual="/partials/nav.html" -->',
      '<div id="app"></div>',
      '<script type="module" src="/src/main.ts"></script>',
    ]) {
      expect(html).toContain(line)
    }
    // Nur Head-Tags ändern sich: Zeilenzahl bleibt gleich.
    expect(html.split('\n').length).toBe(indexHtml.split('\n').length)
  })

  it('verändert die deutsche Quelle nicht', () => {
    const before = indexHtml
    english()
    expect(indexHtml).toBe(before)
  })

  it('escaped Sonderzeichen und behandelt $ nicht als Rückverweis', () => {
    const html = localizeIndexHtml(indexHtml, {
      locale: 'en',
      title: 'A & B <c> "d" $1',
      description: 'x $& y',
    })
    expect(html).toContain('<title>A &amp; B &lt;c&gt; &quot;d&quot; $1</title>')
    expect(metaContent(html, 'name', 'description')).toBe('x $&amp; y')
  })

  it('wirft, wenn ein erwarteter Tag fehlt (Build soll scheitern)', () => {
    const broken = indexHtml.replace(/<link\s+rel="canonical"[^>]*>/, '')
    expect(() => localizeIndexHtml(broken, { locale: 'en', title: 't', description: 'd' })).toThrow(
      /link canonical/
    )
  })

  it('wirft, wenn ein Tag doppelt vorkommt', () => {
    const doubled = indexHtml.replace('</head>', '<title>x</title></head>')
    expect(() =>
      localizeIndexHtml(doubled, { locale: 'en', title: 't', description: 'd' })
    ).toThrow(/title/)
  })
})
