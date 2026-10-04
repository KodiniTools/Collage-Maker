/**
 * Blog-Karten der Landing-Page: reine Funktionen ohne Vue, damit sie mit
 * Vitest prüfbar sind. Die Beiträge selbst stehen in src/data/blogArticles.ts.
 */

import type { BlogArticle, LocalizedText } from '@/data/blogArticles'

export interface BlogCard {
  id: string
  url: string
  image: string
  tag: string
  title: string
  description: string
  /** Datum und Lesezeit, z. B. „17. Juni 2026 · 4 Min.“ */
  meta: string
}

const DATE_LOCALES: Record<string, string> = { de: 'de-DE', en: 'en-US' }
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * ISO-Datum (YYYY-MM-DD) sprachabhängig formatieren:
 * de → „17. Juni 2026“, en → „June 17, 2026“.
 * Unbekannte Sprachen fallen auf Deutsch zurück, ungültige Werte werden
 * unverändert zurückgegeben.
 */
export function formatBlogDate(isoDate: string | undefined, lang = 'de'): string {
  const value = String(isoDate ?? '')
  if (!ISO_DATE.test(value)) return value
  // UTC, damit das Datum nicht von der Zeitzone des Geräts verschoben wird
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(DATE_LOCALES[lang] ?? DATE_LOCALES.de, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Text in der aktiven Sprache; fehlt die Übersetzung, Deutsch. */
function pick(field: Partial<LocalizedText> | undefined, lang: string): string {
  if (!field) return ''
  return field[lang as keyof LocalizedText] ?? field.de ?? ''
}

/**
 * Beiträge in Kartendaten der aktiven Sprache umwandeln.
 *
 * @param articles      Beiträge (bereits sortiert, siehe getBlogArticlesNewestFirst)
 * @param lang          'de' | 'en'
 * @param minutesLabel  Einheit der Lesezeit, z. B. „Min.“ oder „min“
 */
export function buildBlogCards(
  articles: BlogArticle[],
  lang: string,
  minutesLabel: string
): BlogCard[] {
  return articles.map((article) => ({
    id: article.id,
    url: pick(article.url, lang),
    image: pick(article.image, lang),
    tag: pick(article.tag, lang),
    title: pick(article.title, lang),
    description: pick(article.description, lang),
    meta: `${formatBlogDate(article.date, lang)} · ${article.minutes} ${minutesLabel}`,
  }))
}
