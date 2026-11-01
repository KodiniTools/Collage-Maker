import { describe, it, expect } from 'vitest'
import {
  canonicalUrl,
  ogLocale,
  ogLocaleAlternate,
  buildSeoHead,
  resolveInitialLocale,
  OG_IMAGE,
  SITE_NAME,
} from '@/config/seo'

describe('SEO helpers', () => {
  it('builds the canonical URL for the landing route', () => {
    expect(canonicalUrl('/')).toBe('https://kodinitools.com/collagemaker/')
    expect(canonicalUrl('')).toBe('https://kodinitools.com/collagemaker/')
  })

  it('builds canonical URLs for sub-routes', () => {
    expect(canonicalUrl('/editor')).toBe('https://kodinitools.com/collagemaker/editor')
    expect(canonicalUrl('/faq')).toBe('https://kodinitools.com/collagemaker/faq')
    expect(canonicalUrl('/artikel')).toBe('https://kodinitools.com/collagemaker/artikel')
  })

  it('strips query, hash and trailing slashes from the canonical URL', () => {
    expect(canonicalUrl('/editor?handoff=kodinitools')).toBe(
      'https://kodinitools.com/collagemaker/editor'
    )
    expect(canonicalUrl('/faq#top')).toBe('https://kodinitools.com/collagemaker/faq')
    expect(canonicalUrl('/blog/')).toBe('https://kodinitools.com/collagemaker/blog')
  })

  it('maps og:locale and its alternate correctly', () => {
    expect(ogLocale('de')).toBe('de_DE')
    expect(ogLocale('en')).toBe('en_US')
    expect(ogLocale('xx')).toBe('de_DE') // Fallback
    expect(ogLocaleAlternate('de')).toBe('en_US')
    expect(ogLocaleAlternate('en')).toBe('de_DE')
  })

  it('assembles a complete head model', () => {
    const head = buildSeoHead({
      title: 'Titel',
      description: 'Beschreibung',
      path: '/editor',
      locale: 'de',
    })

    expect(head.title).toBe('Titel')
    expect(head.description).toBe('Beschreibung')
    expect(head.canonical).toBe('https://kodinitools.com/collagemaker/editor')
    expect(head.url).toBe(head.canonical)
    expect(head.image).toBe(OG_IMAGE)
    expect(head.siteName).toBe(SITE_NAME)
    expect(head.ogLocale).toBe('de_DE')
    expect(head.ogLocaleAlternate).toBe('en_US')
    expect(head.alternates).toEqual([
      { hreflang: 'de', href: 'https://kodinitools.com/collagemaker/editor' },
      { hreflang: 'en', href: 'https://kodinitools.com/collagemaker/editor?lang=en' },
      { hreflang: 'x-default', href: 'https://kodinitools.com/collagemaker/editor' },
    ])
  })

  it('englische Fassung: Canonical mit ?lang=en', () => {
    expect(canonicalUrl('/', 'en')).toBe('https://kodinitools.com/collagemaker/?lang=en')
    expect(canonicalUrl('/faq?lang=en', 'en')).toBe(
      'https://kodinitools.com/collagemaker/faq?lang=en'
    )
    const head = buildSeoHead({ title: 'T', description: 'D', path: '/faq', locale: 'en' })
    expect(head.canonical).toBe('https://kodinitools.com/collagemaker/faq?lang=en')
    expect(head.url).toBe(head.canonical)
  })

  it('resolveInitialLocale: ?lang vor Speicher, sonst Deutsch', () => {
    expect(resolveInitialLocale('?lang=en', 'de')).toBe('en')
    expect(resolveInitialLocale('?x=1&lang=de', 'en')).toBe('de')
    expect(resolveInitialLocale('?lang=fr', 'en')).toBe('en')
    expect(resolveInitialLocale('', null)).toBe('de')
    expect(resolveInitialLocale('', 'xx')).toBe('de')
  })
})
