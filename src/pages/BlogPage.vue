<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'

  const { t, locale } = useI18n()

  const isDE = computed(() => locale.value === 'de')

  interface Section {
    id: string
    title: string
    content: string[]
  }

  const sections = computed<Section[]>(() =>
    isDE.value
      ? [
          {
            id: 'upload',
            title: '1. Erste Schritte: Bilder hochladen',
            content: [
              'Der schnellste Weg, Bilder in den Collage-Maker zu laden, ist per <strong>Drag & Drop</strong>. Einfach ein oder mehrere Bilder direkt in den Arbeitsbereich ziehen – sie stehen sofort zur Bearbeitung bereit.',
              'Alternativ öffnet der Upload-Button in der linken Seitenleiste einen Dateiauswahl-Dialog. Unterstützte Formate: <strong>PNG</strong>, <strong>JPG/JPEG</strong> und <strong>WebP</strong>.',
              'Große Bilder werden automatisch komprimiert (max. 50 MB pro Datei). Alle hochgeladenen Bilder erscheinen in der Bildergalerie links – von dort per Klick zur Leinwand hinzufügen oder mit Strg+Klick mehrere gleichzeitig auswählen.',
            ],
          },
          {
            id: 'layouts',
            title: '2. Die 14 Collage-Layouts',
            content: [
              '<strong>Freestyle</strong> – Volle kreative Freiheit: Bilder frei positionieren, drehen, skalieren.',
              '<strong>Grid 2×2 / 3×3 / 2×3</strong> – Klassische Raster für Vergleiche, Instagram-Posts und Produktpräsentationen.',
              '<strong>Magazine</strong> – Ein großes Hauptbild links, kleinere Bilder rechts gestapelt. Perfekt für Blog-Header und Feature-Stories.',
              '<strong>Spotlight / Hero / Sidebar / Focus / Panorama</strong> – Layouts, die ein Hauptmotiv betonen und perfekt für Social-Media-Cover, Website-Banner und Porträts sind.',
              '<strong>Mosaic / Diagonal / Triptych / Masonry</strong> – Dynamische, kreative Anordnungen für Pinterest-Stil, Kunstprojekte und Geschichten in drei Akten.',
            ],
          },
          {
            id: 'editing',
            title: '3. Bildbearbeitung & Effekte',
            content: [
              'Jedes Bild kann präzise <strong>positioniert, skaliert und gedreht</strong> werden – per Drag & Drop oder durch Eingabe exakter Pixel-Werte.',
              'Sieben leistungsstarke <strong>Filter</strong>: Helligkeit (0–200%), Kontrast (0–200%), Lichter (±100), Schatten (±100), Sättigung (0–200%), Wärme (±100) und Schärfe (0–100). Alle Werte sind mit einem Klick auf den ↺-Button zurücksetzbar.',
              '<strong>Deckkraft</strong> (0–100%), abgerundete Ecken (0–100 px), individuelle <strong>Bildrahmen</strong> (4 Stile, beliebige Farbe, optionaler Schatten) und <strong>Schlagschatten</strong> pro Bild.',
              '<strong>Stapelverarbeitung</strong>: Mehrere Bilder markieren (Strg+Klick oder Strg+A) und einen Wert ändern – die Änderung gilt für alle ausgewählten Bilder gleichzeitig.',
            ],
          },
          {
            id: 'text',
            title: '4. Text-Funktionen',
            content: [
              'Textelemente mit <strong>Strg+T</strong> hinzufügen – unbegrenzt viele Elemente möglich.',
              '19 Schriftarten: 8 System-Schriftarten (Arial, Georgia, Times, …) und 11 exklusive Designer-Schriften (Alpino, Author, ClashDisplay, Satoshi, …) mit je bis zu 8 Schriftstärken plus Kursiv-Varianten.',
              '<strong>Text-Schatten</strong>, <strong>Text-Kontur</strong> (Stroke, 1–10 px, beliebige Farbe), Buchstabenabstand (±20 px), Drehung und Ebenenverwaltung.',
              'Alle Text-Slider (Schriftgröße, Buchstabenabstand, Schatten, Stroke) besitzen einen ↺-Reset-Button.',
            ],
          },
          {
            id: 'canvas',
            title: '5. Leinwand & Hintergrund',
            content: [
              '<strong>Leinwandgröße</strong> frei wählbar (400–4000 px) oder vordefinierte Formate: Instagram Post (1080×1080), Instagram Story (1080×1920), Facebook Cover (820×312), YouTube Thumbnail (1280×720) und mehr.',
              '<strong>Hintergrundfarbe</strong> per Farbwähler oder Hex-Code. Alternativ ein <strong>Hintergrundbild</strong> mit 4 Anpassungsmodi: Cover, Contain, Stretch, Tile – plus eigene Filter (Helligkeit, Kontrast, Sättigung, Unschärfe) und Deckkraft.',
              '<strong>Hilfslinien-Raster</strong> (ein/aus, Größe anpassbar) und automatische Ausrichtungshilfen. Das Raster erscheint nicht im exportierten Bild.',
            ],
          },
          {
            id: 'export',
            title: '6. Export-Optionen',
            content: [
              'Export in <strong>PNG</strong> (verlustfrei, mit Transparenz), <strong>PNG transparent</strong>, <strong>JPEG</strong>, <strong>WebP</strong> oder <strong>PDF</strong>.',
              'Vor dem Download: <strong>Vorschau-Dialog</strong> zeigt die fertige Collage in voller Auflösung. Danach öffnet ein <strong>Dateiname-Dialog</strong> – eigenen Namen eingeben, Endung wird automatisch ergänzt.',
              'Qualitätsregler für JPEG, WebP und PDF (10–100%). Empfehlung: 85–95% für Social Media, 100% für Druck.',
            ],
          },
          {
            id: 'templates',
            title: '7. Vorlagen-System',
            content: [
              '9 professionell gestaltete <strong>Vorlagen</strong> für Social-Media-Posts, Grußkarten, Produktpräsentationen und mehr.',
              'Eigene Vorlagen erstellen und in der <strong>Vorlagen-Bibliothek</strong> speichern – dauerhaft im Browser verfügbar, mit Vorschaubildern für schnelle Auswahl.',
            ],
          },
          {
            id: 'shortcuts',
            title: '8. Tastaturkürzel',
            content: [
              '<strong>Strg+Z / Y</strong> – Rückgängig / Wiederholen &nbsp;|&nbsp; <strong>Strg+A</strong> – Alles auswählen &nbsp;|&nbsp; <strong>Entf</strong> – Löschen',
              '<strong>Strg+D</strong> – Duplizieren &nbsp;|&nbsp; <strong>Strg+T</strong> – Text hinzufügen &nbsp;|&nbsp; <strong>Strg+Shift+←/→</strong> – 15° drehen',
              '<strong>Shift+?</strong> – Vollständige Liste aller Tastaturkürzel anzeigen',
            ],
          },
          {
            id: 'autosave',
            title: '9. Automatisches Speichern & Datenschutz',
            content: [
              'Der Collage-Maker speichert Ihre Arbeit <strong>automatisch im Browser</strong> (LocalStorage). Bei einem versehentlichen Schließen oder Neuladen wird Ihre Collage wiederhergestellt.',
              '<strong>100% Datenschutz</strong>: Alle Bilder werden ausschliesslich lokal in Ihrem Browser verarbeitet. Es werden keine Daten auf Server hochgeladen – vollständig DSGVO-konform.',
              'Verfügbar in <strong>Deutsch und Englisch</strong>. Der Dark Mode passt sich automatisch an Ihre Systemeinstellungen an und lässt sich jederzeit manuell umschalten.',
            ],
          },
        ]
      : [
          {
            id: 'upload',
            title: '1. Getting Started: Upload Images',
            content: [
              'The fastest way to load images is via <strong>drag & drop</strong> – drag one or multiple images directly into the canvas area.',
              'Alternatively, use the upload button in the left sidebar to open a file picker. Supported formats: <strong>PNG</strong>, <strong>JPG/JPEG</strong> and <strong>WebP</strong> (max 50 MB per file).',
              'Large images are automatically compressed. All uploaded images appear in the gallery on the left – click to add to canvas, or Ctrl+click to select multiple at once.',
            ],
          },
          {
            id: 'layouts',
            title: '2. The 14 Collage Layouts',
            content: [
              '<strong>Freestyle</strong> – Full creative freedom: freely position, rotate and scale images.',
              '<strong>Grid 2×2 / 3×3 / 2×3</strong> – Classic grids for comparisons, Instagram posts and product presentations.',
              '<strong>Magazine</strong> – One large main image on the left, smaller images stacked on the right. Perfect for blog headers and feature stories.',
              '<strong>Spotlight / Hero / Sidebar / Focus / Panorama</strong> – Layouts emphasising a main subject, ideal for social media covers, website banners and portraits.',
              '<strong>Mosaic / Diagonal / Triptych / Masonry</strong> – Dynamic, creative arrangements for Pinterest style, art projects and three-act stories.',
            ],
          },
          {
            id: 'editing',
            title: '3. Image Editing & Effects',
            content: [
              'Every image can be precisely <strong>positioned, scaled and rotated</strong> – via drag & drop or by entering exact pixel values.',
              'Seven powerful <strong>filters</strong>: Brightness (0–200%), Contrast (0–200%), Highlights (±100), Shadows (±100), Saturation (0–200%), Warmth (±100) and Sharpness (0–100). All values can be reset with a single click on the ↺ button.',
              '<strong>Opacity</strong> (0–100%), rounded corners (0–100 px), custom <strong>borders</strong> (4 styles, any colour, optional shadow) and individual <strong>drop shadows</strong> per image.',
              '<strong>Batch editing</strong>: select multiple images (Ctrl+click or Ctrl+A) and change a value – the change applies to all selected images simultaneously.',
            ],
          },
          {
            id: 'text',
            title: '4. Text Features',
            content: [
              'Add text elements with <strong>Ctrl+T</strong> – unlimited elements supported.',
              '19 fonts: 8 system fonts (Arial, Georgia, Times, …) and 11 exclusive designer fonts (Alpino, Author, ClashDisplay, Satoshi, …) with up to 8 weights plus italic variants.',
              '<strong>Text shadow</strong>, <strong>text stroke</strong> (1–10 px, any colour), letter spacing (±20 px), rotation and layer management.',
              'All text sliders (font size, letter spacing, shadow, stroke) include a ↺ reset button.',
            ],
          },
          {
            id: 'canvas',
            title: '5. Canvas & Background',
            content: [
              'Freely adjustable <strong>canvas size</strong> (400–4000 px) or predefined formats: Instagram Post (1080×1080), Instagram Story (1080×1920), Facebook Cover (820×312), YouTube Thumbnail (1280×720) and more.',
              '<strong>Background colour</strong> via colour picker or hex code. Alternatively a <strong>background image</strong> with 4 fitting modes: Cover, Contain, Stretch, Tile – plus dedicated filters (brightness, contrast, saturation, blur) and opacity.',
              '<strong>Guide grid</strong> (on/off, adjustable size) and automatic alignment guides. The grid does not appear in the exported image.',
            ],
          },
          {
            id: 'export',
            title: '6. Export Options',
            content: [
              'Export as <strong>PNG</strong> (lossless, with transparency), <strong>PNG transparent</strong>, <strong>JPEG</strong>, <strong>WebP</strong> or <strong>PDF</strong>.',
              'Before download: a <strong>preview dialog</strong> shows the finished collage at full resolution. Then a <strong>filename dialog</strong> lets you set a custom name – the extension is added automatically.',
              'Quality slider for JPEG, WebP and PDF (10–100%). Recommended: 85–95% for social media, 100% for print.',
            ],
          },
          {
            id: 'templates',
            title: '7. Template System',
            content: [
              '9 professionally designed <strong>templates</strong> for social media posts, greeting cards, product presentations and more.',
              'Create your own templates and save them to the <strong>Template Library</strong> – stored permanently in your browser with preview thumbnails for quick selection.',
            ],
          },
          {
            id: 'shortcuts',
            title: '8. Keyboard Shortcuts',
            content: [
              '<strong>Ctrl+Z / Y</strong> – Undo / Redo &nbsp;|&nbsp; <strong>Ctrl+A</strong> – Select All &nbsp;|&nbsp; <strong>Del</strong> – Delete',
              '<strong>Ctrl+D</strong> – Duplicate &nbsp;|&nbsp; <strong>Ctrl+T</strong> – Add Text &nbsp;|&nbsp; <strong>Ctrl+Shift+←/→</strong> – Rotate 15°',
              '<strong>Shift+?</strong> – Show the full list of all keyboard shortcuts',
            ],
          },
          {
            id: 'autosave',
            title: '9. Auto-Save & Privacy',
            content: [
              'The Collage Maker automatically saves your work <strong>locally in the browser</strong> (LocalStorage). If you accidentally close or reload the page, your collage will be restored.',
              '<strong>100% privacy</strong>: all images are processed exclusively in your browser. No data is uploaded to any server – fully GDPR-compliant.',
              'Available in <strong>German and English</strong>. Dark mode adapts to your system settings and can be toggled manually at any time.',
            ],
          },
        ]
  )

  const hero = computed(() =>
    isDE.value
      ? {
          tag: 'Leitfaden',
          title: 'Der komplette Guide zum Collage-Maker',
          subtitle:
            'Alle Funktionen, Tipps und Tricks – von der ersten Bild-Upload bis zum professionellen Export. Kostenlos, ohne Anmeldung, 100% im Browser.',
          cta: 'Collage erstellen',
          toc: 'Inhalt',
        }
      : {
          tag: 'Guide',
          title: 'The Complete Collage Maker Guide',
          subtitle:
            'All features, tips and tricks – from your first image upload to a professional export. Free, no sign-up required, 100% in the browser.',
          cta: 'Create Collage',
          toc: 'Contents',
        }
  )
</script>

<template>
  <div class="min-h-screen bg-page-gradient">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 -left-40 w-96 h-96 bg-warm/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10">
      <!-- Navigation -->
      <header
        class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md container mx-auto px-4 pt-6"
      >
        <nav class="flex items-center justify-between">
          <RouterLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span class="text-xl font-bold text-slate-dark dark:text-surface-light">{{
              t('app.title')
            }}</span>
          </RouterLink>

          <div class="flex items-center gap-2 sm:gap-6">
            <RouterLink
              to="/blog"
              class="text-sm sm:text-base text-accent font-semibold"
            >
              {{ t('nav.blog') }}
            </RouterLink>
            <RouterLink
              to="/faq"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.faq') }}
            </RouterLink>
            <RouterLink
              to="/"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.home') }}
            </RouterLink>
            <RouterLink
              to="/editor"
              class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-accent hover:bg-accent-light text-slate-dark font-medium rounded-lg transition-colors"
            >
              {{ t('nav.editor') }}
            </RouterLink>
          </div>
        </nav>
      </header>

      <!-- Hero -->
      <section class="container mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center">
        <span
          class="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-accent/10 text-accent"
        >
          {{ hero.tag }}
        </span>
        <h1
          class="text-3xl sm:text-5xl font-bold text-slate-dark dark:text-surface-light mb-4 leading-tight"
        >
          {{ hero.title }}
        </h1>
        <p class="text-muted dark:text-muted-light max-w-2xl mx-auto mb-8 text-base sm:text-lg">
          {{ hero.subtitle }}
        </p>
        <RouterLink
          to="/editor"
          class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-slate-dark font-semibold rounded-xl transition-colors shadow-lg"
        >
          {{ hero.cta }} →
        </RouterLink>
      </section>

      <!-- Table of Contents -->
      <section class="container mx-auto px-4 pb-8 max-w-3xl">
        <div
          class="bg-white/60 dark:bg-navy/40 border border-muted/20 dark:border-white/10 rounded-2xl p-6"
        >
          <h2 class="text-sm font-semibold uppercase tracking-widest text-muted dark:text-muted-light mb-4">
            {{ hero.toc }}
          </h2>
          <ol class="space-y-1">
            <li v-for="section in sections" :key="section.id">
              <a
                :href="`#${section.id}`"
                class="text-slate-dark dark:text-surface-light hover:text-accent dark:hover:text-accent transition-colors text-sm"
                v-html="section.title"
              ></a>
            </li>
          </ol>
        </div>
      </section>

      <!-- Sections -->
      <section class="container mx-auto px-4 pb-20 max-w-3xl space-y-12">
        <article
          v-for="section in sections"
          :id="section.id"
          :key="section.id"
          class="scroll-mt-24"
        >
          <h2
            class="text-xl sm:text-2xl font-bold text-slate-dark dark:text-surface-light mb-4 pb-3 border-b border-muted/20 dark:border-white/10"
            v-html="section.title"
          ></h2>
          <ul class="space-y-3">
            <li
              v-for="(para, i) in section.content"
              :key="i"
              class="flex gap-3 text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span class="mt-1.5 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-accent"></span>
              <span v-html="para"></span>
            </li>
          </ul>
        </article>

        <!-- CTA -->
        <div
          class="rounded-2xl bg-gradient-to-br from-accent/20 to-accent-dark/10 border border-accent/20 p-8 text-center"
        >
          <h2 class="text-2xl font-bold text-slate-dark dark:text-surface-light mb-3">
            {{ isDE ? 'Jetzt loslegen' : 'Start now' }}
          </h2>
          <p class="text-muted dark:text-muted-light mb-6">
            {{
              isDE
                ? 'Kostenlos, ohne Anmeldung – direkt im Browser.'
                : 'Free, no sign-up required – directly in the browser.'
            }}
          </p>
          <RouterLink
            to="/editor"
            class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-slate-dark font-semibold rounded-xl transition-colors shadow-lg"
          >
            {{ isDE ? 'Collage erstellen →' : 'Create Collage →' }}
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
