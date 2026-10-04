import { describe, it, expect } from 'vitest'
import { blogArticles, getBlogArticlesNewestFirst, type BlogArticle } from '@/data/blogArticles'
import { buildBlogCards, formatBlogDate } from '@/lib/blogCards'

const LOCALIZED_FIELDS = ['tag', 'url', 'image', 'title', 'description'] as const

describe('blogArticles (Landing-Page, Abschnitt Blog)', () => {
  it('every post is complete and bilingual', () => {
    expect(blogArticles.length).toBeGreaterThanOrEqual(1)
    const ids = new Set<string>()
    for (const article of blogArticles) {
      expect(ids.has(article.id), `doppelte id ${article.id}`).toBe(false)
      ids.add(article.id)
      expect(article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isInteger(article.minutes) && article.minutes > 0).toBe(true)
      for (const field of LOCALIZED_FIELDS) {
        for (const lang of ['de', 'en'] as const) {
          expect(article[field][lang], `${article.id}.${field}.${lang}`).toBeTruthy()
        }
      }
      expect(article.url.de).toMatch(/^https:\/\/kodinitools\.com\/blog\/[a-z0-9-]+\/$/)
      expect(article.url.en).toMatch(/^https:\/\/kodinitools\.com\/en\/blog\/[a-z0-9-]+\/$/)
      expect(article.image.de).toMatch(/^https:\/\/kodinitools\.com\/image\//)
      expect(article.image.en).toMatch(/^https:\/\/kodinitools\.com\/image\//)
    }
  })

  it('contains the photo collage post from kodinitools.com/blog', () => {
    const post = blogArticles.find((a) => a.id === 'fotocollage-erstellen')
    expect(post?.url.de).toBe('https://kodinitools.com/blog/fotocollage-erstellen/')
    expect(post?.url.en).toBe('https://kodinitools.com/en/blog/photo-collage-free-online/')
  })

  it('getBlogArticlesNewestFirst sorts newest first without mutating the source', () => {
    const before = blogArticles.map((a) => a.id)
    const sorted = getBlogArticlesNewestFirst()
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].date >= sorted[i].date).toBe(true)
    }
    expect(blogArticles.map((a) => a.id)).toEqual(before)
    expect(sorted).not.toBe(blogArticles)
  })
})

describe('blogCards helpers', () => {
  const article: BlogArticle = {
    id: 'x',
    date: '2026-06-17',
    minutes: 4,
    tag: { de: 'Bild', en: 'Image' },
    url: { de: 'u-de', en: 'u-en' },
    image: { de: 'i-de', en: 'i-en' },
    title: { de: 'T de', en: 'T en' },
    description: { de: 'D de', en: 'D en' },
  }

  it('formats dates per language and falls back to German', () => {
    expect(formatBlogDate('2026-06-17', 'de')).toBe('17. Juni 2026')
    expect(formatBlogDate('2026-06-17', 'en')).toBe('June 17, 2026')
    expect(formatBlogDate('2026-10-04', 'xx')).toBe('4. Oktober 2026')
  })

  it('returns invalid dates unchanged instead of throwing', () => {
    expect(formatBlogDate('kein-datum', 'de')).toBe('kein-datum')
    expect(formatBlogDate('2026-13-40', 'de')).toBe('2026-13-40')
    expect(formatBlogDate(undefined, 'de')).toBe('')
  })

  it('builds cards in the active language with a localized meta line', () => {
    expect(buildBlogCards([article], 'en', 'min')).toEqual([
      {
        id: 'x',
        url: 'u-en',
        image: 'i-en',
        tag: 'Image',
        title: 'T en',
        description: 'D en',
        meta: 'June 17, 2026 · 4 min',
      },
    ])
    const [de] = buildBlogCards([article], 'de', 'Min.')
    expect(de.url).toBe('u-de')
    expect(de.meta).toBe('17. Juni 2026 · 4 Min.')
    expect(buildBlogCards([], 'de', 'Min.')).toEqual([])
  })

  it('falls back to German when a translation is missing', () => {
    const partial = { ...article, image: { de: 'i-de' } as BlogArticle['image'] }
    expect(buildBlogCards([partial], 'en', 'min')[0].image).toBe('i-de')
  })

  it('produces complete cards for the real posts in both languages', () => {
    for (const lang of ['de', 'en']) {
      for (const card of buildBlogCards(getBlogArticlesNewestFirst(), lang, 'x')) {
        for (const value of Object.values(card)) expect(value).toBeTruthy()
      }
    }
  })
})
