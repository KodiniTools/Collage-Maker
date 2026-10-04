// ==========================================================================
// Blog-Beiträge zum Collage-Maker auf kodinitools.com/blog
//
// Werden auf der Landing-Page (LandingPage.vue, Abschnitt „Blog“, Anker #blog)
// als Karten angezeigt. Ein neuer Beitrag ist ein weiteres Objekt in
// `blogArticles`; die Reihenfolge im Array ist egal, angezeigt wird immer der
// neueste zuerst (getBlogArticlesNewestFirst). Bilder und URLs zeigen auf die
// Kodinitools-Home-Seite, damit die Landing-Page keine eigenen Kopien der
// Vorschaubilder braucht.
// ==========================================================================

/** Text je Sprache; Deutsch ist der Fallback. */
export interface LocalizedText {
  de: string
  en: string
}

export interface BlogArticle {
  /** Eindeutige Kennung (wird als Vue-Key genutzt) */
  id: string
  /** Veröffentlichungsdatum als ISO-Datum (YYYY-MM-DD) */
  date: string
  /** Lesezeit in Minuten */
  minutes: number
  /** Kategorie-Badge */
  tag: LocalizedText
  /** Vollständige URL des Beitrags je Sprache */
  url: LocalizedText
  /** Vollständige URL des Vorschaubilds je Sprache */
  image: LocalizedText
  title: LocalizedText
  description: LocalizedText
}

export const blogArticles: BlogArticle[] = [
  {
    id: 'fotocollage-erstellen',
    date: '2026-06-17',
    minutes: 4,
    tag: { de: 'Bild', en: 'Image' },
    url: {
      de: 'https://kodinitools.com/blog/fotocollage-erstellen/',
      en: 'https://kodinitools.com/en/blog/photo-collage-free-online/',
    },
    image: {
      de: 'https://kodinitools.com/image/collagemaker-blog-de.png',
      en: 'https://kodinitools.com/image/collagemaker-blog-en.png',
    },
    title: {
      de: 'Fotocollage kostenlos erstellen ohne App – direkt im Browser',
      en: 'How to Create a Photo Collage Free Online Without an App',
    },
    description: {
      de: 'Layouts für Instagram, Pinterest und Drucken. Bilder verlassen nie Ihren Browser – DSGVO-konform.',
      en: 'Layouts for Instagram, Pinterest and printing. Images never leave your browser — GDPR compliant.',
    },
  },
]

/**
 * Liefert die Beiträge nach Datum absteigend (neuester zuerst), unabhängig
 * von der Reihenfolge im Array. Das Array selbst bleibt unverändert.
 */
export function getBlogArticlesNewestFirst(): BlogArticle[] {
  return [...blogArticles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
