import { describe, it, expect } from 'vitest'
import {
  canonicalUrl,
  ogLocale,
  ogLocaleAlternate,
  buildSeoHead,
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
  })
})
