/**
 * Erzeugt aus der gebauten (deutschen) index.html eine Sprachvariante,
 * z. B. dist/index.en.html für Aufrufe mit ?lang=en.
 *
 * Hintergrund: Crawler ohne JavaScript sehen nur das ausgelieferte HTML. Der
 * Server (nginx) liefert bei ?lang=en diese Variante aus; im Browser übernimmt
 * danach wie bisher useSeo() die Tags. Reine String-Funktion ohne DOM- oder
 * Node-Zugriff, damit sie in Vitest und im Vite-Build-Plugin nutzbar ist.
 *
 * Jede Ersetzung muss genau einmal greifen. Fehlt ein Tag oder ist er doppelt,
 * wird geworfen, damit der Build scheitert statt still deutsches HTML unter
 * ?lang=en auszuliefern.
 */
import { buildSeoHead } from './seo'

export interface LocalizedHtmlInput {
  /** Sprachcode für <html lang> und canonical/og:locale, z. B. 'en'. */
  locale: string
  title: string
  description: string
  /** Router-relativer Pfad der Seite, deren Tags gesetzt werden (Default: Startseite). */
  path?: string
}

/** Escaping für Attributwerte und Textinhalt in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceOnce(html: string, pattern: RegExp, replacement: string, label: string): string {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const matches = html.match(new RegExp(pattern.source, flags))
  const count = matches?.length ?? 0
  if (count !== 1) {
    throw new Error(`localizeIndexHtml: "${label}" ${count}-mal gefunden, erwartet genau 1`)
  }
  // Funktion als Ersatz, damit "$" in Texten nicht als Rückverweis gilt.
  return html.replace(pattern, (_m, before: string, after: string) => {
    return `${before}${replacement}${after}`
  })
}

/** Ersetzt den content-Wert von <meta name|property="key" content="...">. */
function replaceMetaContent(
  html: string,
  attr: 'name' | 'property',
  key: string,
  value: string
): string {
  const pattern = new RegExp(`(<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content=")[^"]*(")`)
  return replaceOnce(html, pattern, escapeHtml(value), `meta ${attr}=${key}`)
}

/**
 * Setzt <html lang>, <title>, description, canonical, Open Graph und Twitter auf
 * die übergebene Sprache. hreflang-Links bleiben unverändert (sind sprachneutral).
 */
export function localizeIndexHtml(html: string, input: LocalizedHtmlInput): string {
  const head = buildSeoHead({
    title: input.title,
    description: input.description,
    path: input.path ?? '/',
    locale: input.locale,
  })

  let out = html
  out = replaceOnce(out, /(<html\s+lang=")[^"]*(")/, escapeHtml(input.locale), 'html lang')
  out = replaceOnce(out, /(<title>)[\s\S]*?(<\/title>)/, escapeHtml(head.title), 'title')
  out = replaceMetaContent(out, 'name', 'description', head.description)
  out = replaceOnce(
    out,
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    escapeHtml(head.canonical),
    'link canonical'
  )

  out = replaceMetaContent(out, 'property', 'og:title', head.title)
  out = replaceMetaContent(out, 'property', 'og:description', head.description)
  out = replaceMetaContent(out, 'property', 'og:url', head.url)
  out = replaceMetaContent(out, 'property', 'og:locale', head.ogLocale)
  out = replaceMetaContent(out, 'property', 'og:locale:alternate', head.ogLocaleAlternate)

  out = replaceMetaContent(out, 'name', 'twitter:title', head.title)
  out = replaceMetaContent(out, 'name', 'twitter:description', head.description)

  return out
}
