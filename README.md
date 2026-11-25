# Vue Collage Maker

Moderne Vue 3 Anwendung zum Erstellen von Foto-Collagen direkt im Browser.

## Features

- 🖼️ Bilder hochladen per Drag & Drop oder File Input
- 🎨 Verschiedene Layouts (Freestyle, Grid 2×2, 3×3, 2×3)
- 🎯 Bilder positionieren, skalieren, rotieren per Drag & Drop
- 🌓 Dark/Light Mode mit persistentem State
- 🌍 Zweisprachig (Deutsch/Englisch) mit vue-i18n
- 💾 Export als PNG, WEBp oder JPEG mit einstellbarer Qualität
- 🔒 100% client-seitige Verarbeitung (GDPR-konform)
- 📱 Responsive Design für Desktop, Tablet, Mobile

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Build Tool:** Vite
- **State Management:** Pinia
- **Styling:** Tailwind CSS
- **i18n:** vue-i18n
- **TypeScript:** Strict Mode

## Installation

```bash
# Dependencies installieren
npm install
# oder
pnpm install
```

## Development

```bash
# Dev Server starten
npm run dev

# Läuft auf: http://localhost:5173/collagemaker/
```

## Build

```bash
# Production Build
npm run build

# Preview Production Build
npm run preview
```

## Deployment

Die Anwendung ist für Deployment als Subdirectory konfiguriert (`/collagemaker/`).

### Auf Server deployen

```bash
# Build erstellen
npm run build

# Per SSH deployen
scp -r dist/* root@145.223.81.100:/var/www/kodinitools.com/collagemaker/

# Oder mit rsync
rsync -avz --delete dist/ root@145.223.81.100:/var/www/kodinitools.com/collagemaker/
```

### Nginx Konfiguration

```nginx
location /collagemaker/ {
    alias /var/www/kodinitools.com/collagemaker/;
    try_files $uri $uri/ /collagemaker/index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Englische Version serverseitig (`?lang=en`)

Der Build erzeugt neben `dist/index.html` (Deutsch) auch `dist/index.en.html`:
gleiche Assets, aber `<html lang="en">`, englischer Titel, Description, Canonical
(`…/collagemaker/?lang=en`), Open Graph und Twitter. So sehen Crawler ohne
JavaScript bei `?lang=en` die englische Version. Im Browser ändert sich nichts:
vue-i18n und `useSeo()` setzen Sprache und Tags wie bisher.

nginx liefert die Datei bei `?lang=en` aus. Dafür zwei Ergänzungen, die
bestehende `try_files`-Zeile bleibt unverändert:

```nginx
# http-Kontext (außerhalb von server { }):
# $request_uri statt $arg_lang, weil try_files die Query beim Fallback verwirft.
map $request_uri $collage_index {
    default               index.html;
    "~[?&]lang=en(&|$)"   index.en.html;
}

# innerhalb von location /collagemaker/ { … } (neben dem Asset-Block):
location = /collagemaker/index.html {
    alias /var/www/kodinitools.com/collagemaker/$collage_index;
}
```

Hinweise: Variablen in der `try_files`-Fallback-URI funktionieren mit `alias`
nicht zuverlässig, deshalb die exakte Location. Gilt für alle Routen, die auf
`index.html` zurückfallen (z. B. `/faq?lang=en`); deren statische Tags sind wie
bei Deutsch die der Startseite, im Browser korrigiert `useSeo()` sie.
Prüfen: `nginx -t && systemctl reload nginx`, dann
`curl -s 'https://kodinitools.com/collagemaker/?lang=en' | grep -E '<html|<title|canonical'`.

## Projektstruktur

```
vue-collage-maker/
├── src/
│   ├── components/       # Vue Komponenten
│   │   ├── ImageUploader.vue
│   │   ├── CollageCanvas.vue
│   │   ├── LayoutSelector.vue
│   │   ├── ImageList.vue
│   │   └── ExportControls.vue
│   ├── stores/           # Pinia Stores
│   │   ├── settings.ts   # Theme & Locale
│   │   └── collage.ts    # Collage State
│   ├── i18n/             # i18n: index.ts (Setup), de.ts (Referenz), en.ts, nav.ts (SSI-Navigation)
│   ├── types/            # TypeScript Types
│   │   └── index.ts
│   ├── App.vue           # Root Component
│   ├── main.ts           # Entry Point
│   └── style.css         # Global Styles
├── public/               # Static Assets
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Usage

1. **Bilder hochladen:** Drag & Drop oder File Input
2. **Layout wählen:** Freestyle oder Grid-Layouts
3. **Bilder anordnen:** Per Drag & Drop auf dem Canvas
4. **Exportieren:** Als PNG oder JPEG mit einstellbarer Qualität

## Erweiterungsmöglichkeiten

- [ ] Canvas Filters (Blur, Brightness, Contrast, Sepia)
- [ ] Text-Overlay mit verschiedenen Fonts
- [ ] Sticker und Shapes
- [ ] Undo/Redo Funktionalität
- [ ] Template-Bibliothek
- [ ] Zoom & Pan für große Collagen
- [ ] Batch-Export

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Lizenz
MIT Lizenz

## Autor
Dinko Ramić , Kodini Tools, kodinitools.com
