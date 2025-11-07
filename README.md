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

# Läuft auf: http://localhost:5173/collagen/
```

## Build

```bash
# Production Build
npm run build

# Preview Production Build
npm run preview
```

## Deployment

Die Anwendung ist für Deployment als Subdirectory konfiguriert (`/collagen/`).

### Auf Server deployen

```bash
# Build erstellen
npm run build

# Per SSH deployen
scp -r dist/* root@145.223.81.100:/var/www/kodinitools.com/collagen/

# Oder mit rsync
rsync -avz --delete dist/ root@145.223.81.100:/var/www/kodinitools.com/collagen/
```

### Nginx Konfiguration

```nginx
location /collagen/ {
    alias /var/www/kodinitools.com/collagen/;
    try_files $uri $uri/ /collagen/index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Projektstruktur

```
vue-collage-maker/
├── src/
│   ├── components/       # Vue Komponenten
│   │   ├── ThemeToggle.vue
│   │   ├── LanguageToggle.vue
│   │   ├── ImageUploader.vue
│   │   ├── CollageCanvas.vue
│   │   ├── LayoutSelector.vue
│   │   ├── ImageList.vue
│   │   └── ExportControls.vue
│   ├── stores/           # Pinia Stores
│   │   ├── settings.ts   # Theme & Locale
│   │   └── collage.ts    # Collage State
│   ├── locales/          # i18n Übersetzungen
│   │   ├── de.json
│   │   └── en.json
│   ├── types/            # TypeScript Types
│   │   └── index.ts
│   ├── App.vue           # Root Component
│   ├── main.ts           # Entry Point
│   ├── i18n.ts           # i18n Setup
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
