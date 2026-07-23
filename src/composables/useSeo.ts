import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildSeoHead, type SeoHead, type SeoKey } from '@/config/seo'

/**
 * Hält die <head>-SEO-Tags (Titel, Description, Canonical, Open Graph, Twitter)
 * synchron zur aktuellen Route und Sprache.
 *
 * Die statische index.html enthält bereits sinnvolle Standardwerte (DE,
 * Startseite) für Crawler/Social-Scraper, die kein JavaScript ausführen. Diese
 * Composable aktualisiert die Tags anschließend bei Client-Navigation und beim
 * Sprachwechsel – ohne zusätzliche Abhängigkeit (kein vue-meta/unhead nötig).
 *
 * Einmal in App.vue aufrufen.
 */
export function useSeo() {
  const route = useRoute()
  const { t, locale } = useI18n()

  function setMeta(selectorAttr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${selectorAttr}="${key}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(selectorAttr, key)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  function setLink(rel: string, href: string) {
    let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!el) {
      el = document.createElement('link')
      el.setAttribute('rel', rel)
      document.head.appendChild(el)
    }
    el.setAttribute('href', href)
  }

  function apply(head: SeoHead, lang: string) {
    document.title = head.title
    document.documentElement.lang = lang

    setMeta('name', 'description', head.description)
    setLink('canonical', head.canonical)

    // Open Graph
    setMeta('property', 'og:title', head.title)
    setMeta('property', 'og:description', head.description)
    setMeta('property', 'og:url', head.url)
    setMeta('property', 'og:image', head.image)
    setMeta('property', 'og:site_name', head.siteName)
    setMeta('property', 'og:locale', head.ogLocale)
    setMeta('property', 'og:locale:alternate', head.ogLocaleAlternate)

    // Twitter
    setMeta('name', 'twitter:title', head.title)
    setMeta('name', 'twitter:description', head.description)
    setMeta('name', 'twitter:image', head.image)
  }

  function update() {
    if (typeof document === 'undefined') return

    const key = (route.meta.seo as SeoKey | undefined) ?? 'landing'
    const currentLocale = String(locale.value)

    const head = buildSeoHead({
      title: t(`seo.${key}.title`),
      description: t(`seo.${key}.description`),
      path: route.path,
      locale: currentLocale,
    })

    apply(head, currentLocale)
  }

  // Auf Routen- und Sprachwechsel reagieren; einmal sofort ausführen.
  watch(() => [route.fullPath, locale.value], update, { immediate: true })
}
