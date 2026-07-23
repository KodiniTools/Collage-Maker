/**
 * Zentrale SEO-Konstanten und reine Hilfsfunktionen.
 *
 * Die Werte spiegeln die Produktions-URL der Anwendung unter
 * https://kodinitools.com/collagemaker/ wider. Die Funktionen hier sind
 * bewusst frei von DOM-Zugriffen, damit sie unabhängig getestet werden können;
 * das eigentliche Setzen der <head>-Tags übernimmt useSeo().
 */

export const SITE_URL = 'https://kodinitools.com'
export const APP_BASE = '/collagemaker'
export const SITE_NAME = 'KodiniTools'

// Social-Vorschaubild (größtes vorhandenes quadratisches Brand-Icon).
export const OG_IMAGE = `${SITE_URL}/public/mstile-310x310.png`

// Von der Vue-Router-Meta genutzte Schlüssel -> i18n-Pfad `seo.<key>`.
export type SeoKey = 'landing' | 'editor' | 'faq' | 'blog'

const OG_LOCALES: Record<string, string> = {
  de: 'de_DE',
  en: 'en_US',
}

/** og:locale-Wert für die aktuelle Sprache (Fallback: Deutsch). */
export function ogLocale(locale: string): string {
  return OG_LOCALES[locale] ?? OG_LOCALES.de
}

/** og:locale:alternate – die jeweils andere angebotene Sprache. */
export function ogLocaleAlternate(locale: string): string {
  return locale === 'en' ? OG_LOCALES.de : OG_LOCALES.en
}

/**
 * Absolute, kanonische URL für einen (Router-relativen) Pfad.
 * Query-String und Fragment werden entfernt, ein Trailing-Slash normalisiert.
 */
export function canonicalUrl(path: string): string {
  const clean = (path || '/').split('?')[0].split('#')[0]
  if (clean === '' || clean === '/') {
    return `${SITE_URL}${APP_BASE}/`
  }
  return `${SITE_URL}${APP_BASE}${clean.replace(/\/+$/, '')}`
}

export interface SeoInput {
  title: string
  description: string
  path: string
  locale: string
}

export interface SeoHead {
  title: string
  description: string
  url: string
  canonical: string
  image: string
  siteName: string
  ogLocale: string
  ogLocaleAlternate: string
}

/** Baut aus übersetzten Texten + Pfad + Sprache das vollständige Head-Modell. */
export function buildSeoHead(input: SeoInput): SeoHead {
  const url = canonicalUrl(input.path)
  return {
    title: input.title,
    description: input.description,
    url,
    canonical: url,
    image: OG_IMAGE,
    siteName: SITE_NAME,
    ogLocale: ogLocale(input.locale),
    ogLocaleAlternate: ogLocaleAlternate(input.locale),
  }
}
