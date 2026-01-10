# CONTEXT.md - Vue Collage Maker

Diese Datei dokumentiert den technischen Kontext des Projekts für Entwickler und KI-Assistenten.

---

## Tech-Stack

### Frontend Framework & Core
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Vue | 3.4.0 | Frontend-Framework mit Composition API (`<script setup>`) |
| TypeScript | 5.6.0 | Typisierung im Strict Mode |
| Vite | 5.4.0 | Build-Tool und Entwicklungsserver |

### State Management & Routing
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Pinia | 2.1.7 | Zentrales State Management |
| Vue Router | 4.6.4 | Client-seitiges Routing (3 Seiten) |

### Styling & UI
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Tailwind CSS | 3.4.0 | Utility-First CSS Framework |
| PostCSS | 8.4.32 | CSS-Transformationen |
| Autoprefixer | 10.4.16 | Vendor-Präfixe für CSS |

### Internationalisierung
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| vue-i18n | 9.8.0 | Mehrsprachigkeit (Deutsch & Englisch) |

### Testing & Code-Qualität
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Vitest | 1.0.0 | Unit-Testing Framework |
| Vue Test Utils | 2.4.0 | Komponententests |
| ESLint | - | Code-Linting |

### Wichtiger Hinweis
> **Dies ist eine 100% client-seitige Anwendung** - kein Backend-Server, keine Datenbank, keine API-Aufrufe. Alle Verarbeitung erfolgt im Browser.

---

## Ordnerstruktur

```
Collage-Maker/
│
├── src/                              # Hauptquellcode
│   ├── components/                   # 19 Vue-Komponenten
│   │   ├── CanvasSettings.vue       # Leinwand-Dimensionen & Hintergrund
│   │   ├── CollageCanvas.vue        # Haupt-Canvas-Rendering
│   │   ├── ExportControls.vue       # PNG/JPEG/WEBP Export
│   │   ├── GridControls.vue         # Raster-Sichtbarkeit & Größe
│   │   ├── ImageControls.vue        # Bildbearbeitung (Filter, Effekte)
│   │   ├── ImageList.vue            # Galerie-Thumbnail-Liste
│   │   ├── ImageUploader.vue        # Drag & Drop Upload
│   │   ├── KeyboardShortcutsModal.vue # Tastenkürzel-Dialog
│   │   ├── LanguageToggle.vue       # DE/EN Sprachumschalter
│   │   ├── LayoutSelector.vue       # Layout-Vorlagen-Auswahl
│   │   ├── TextControls.vue         # Textbearbeitung
│   │   ├── TextList.vue             # Textelemente-Verwaltung
│   │   ├── ThemeToggle.vue          # Dark/Light Mode
│   │   ├── ThumbnailBar.vue         # Bildvorschau-Leiste
│   │   ├── TemplateCard.vue         # Template-Karte
│   │   ├── TemplateLibrary.vue      # Template-Auswahldialog
│   │   ├── ToastContainer.vue       # Benachrichtigungen
│   │   ├── LandingPage.vue          # Legacy Landing Page
│   │   └── FaqSection.vue           # FAQ-Anzeige
│   │
│   ├── composables/                  # Vue Composition Functions
│   │   ├── useKeyboardShortcuts.ts   # 30+ Tastenkürzel
│   │   └── useAutoSave.ts            # Auto-Save mit Kompression
│   │
│   ├── stores/                       # Pinia State Stores
│   │   ├── collage.ts               # Haupt-Collage-State (1058 Zeilen)
│   │   ├── templates.ts             # Template-Verwaltung
│   │   ├── settings.ts              # Theme & Locale
│   │   ├── history.ts               # Undo/Redo (50 Einträge)
│   │   └── toast.ts                 # Toast-Benachrichtigungen
│   │
│   ├── pages/                        # Seiten-Komponenten (Router Views)
│   │   ├── EditorPage.vue           # Haupt-Editor
│   │   ├── LandingPage.vue          # Startseite
│   │   └── FaqPage.vue              # FAQ-Seite
│   │
│   ├── types/                        # TypeScript-Definitionen
│   │   └── index.ts                 # Alle App-Typen
│   │
│   ├── utils/                        # Hilfsfunktionen
│   │   └── imageCompression.ts      # Bildkompression
│   │
│   ├── locales/                      # Übersetzungen
│   │   ├── de.json                  # Deutsch (520 Zeilen)
│   │   └── en.json                  # Englisch (520 Zeilen)
│   │
│   ├── router/                       # Vue Router
│   │   └── index.ts                 # 3 Routen-Definitionen
│   │
│   ├── App.vue                       # Root-Komponente
│   ├── main.ts                       # Einstiegspunkt
│   ├── i18n.ts                       # i18n-Konfiguration
│   └── style.css                     # Globale Styles
│
├── public/                           # Statische Assets
│   ├── fonts.css                    # Custom Fonts (woff2)
│   ├── fonts.json                   # Font-Metadaten
│   └── templates/
│       └── default-templates.json   # Vordefinierte Templates
│
├── Konfigurationsdateien
│   ├── vite.config.ts               # Vite-Build-Konfiguration
│   ├── tsconfig.json                # TypeScript-Konfiguration
│   ├── tailwind.config.js           # Tailwind-Theme
│   ├── postcss.config.js            # PostCSS-Konfiguration
│   ├── .eslintrc.cjs                # ESLint-Regeln
│   └── package.json                 # Abhängigkeiten & Skripte
│
├── index.html                        # HTML-Einstiegspunkt
├── README.md                         # Projektdokumentation
├── CONTEXT.md                        # Diese Datei
└── LICENSE                           # MIT-Lizenz
```

---

## Datenmodelle (Schema)

Da dies eine reine Client-Anwendung ist, werden alle Daten als TypeScript-Interfaces definiert und im Browser-LocalStorage persistiert.

### CollageImage

Repräsentiert ein Bild auf der Collage-Leinwand.

```typescript
interface CollageImage {
  // Identität & Datei
  id: string                    // UUID
  file: File                    // Originaldatei
  url: string                   // Blob-URL
  isGalleryTemplate?: boolean   // Galerie vs. Canvas

  // Position & Dimensionen
  x: number                     // X-Position (px)
  y: number                     // Y-Position (px)
  width: number                 // Breite (px)
  height: number                // Höhe (px)
  rotation: number              // Rotation (Grad)
  zIndex: number                // Stapelreihenfolge

  // Darstellung
  opacity: number               // 0-1

  // Rahmen
  borderEnabled: boolean
  borderWidth: number
  borderColor: string           // Hex-Farbe
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'
  borderRadius: number          // Eckenradius

  // Rahmen-Schatten
  borderShadowEnabled: boolean
  borderShadowOffsetX: number
  borderShadowOffsetY: number
  borderShadowBlur: number
  borderShadowColor: string

  // Bild-Schatten
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string

  // Bildfilter
  brightness: number            // 0-200 (100 = normal)
  contrast: number              // 0-200 (100 = normal)
  highlights: number            // -100 bis +100
  shadows: number               // -100 bis +100
  saturation: number            // 0-200 (100 = normal)
  warmth: number                // -100 bis +100
  sharpness: number             // -100 bis +100
}
```

### CollageText

Repräsentiert ein Textelement auf der Collage.

```typescript
interface CollageText {
  // Identität
  id: string                    // UUID
  text: string                  // Textinhalt

  // Position
  x: number
  y: number
  rotation: number
  zIndex: number

  // Typografie
  fontSize: number              // Schriftgröße (px)
  fontFamily: string            // Schriftart
  fontWeight: number | 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  letterSpacing: number         // Zeichenabstand
  color: string                 // Textfarbe (Hex)

  // Text-Schatten
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string

  // Text-Kontur
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
}
```

### CollageSettings

Globale Einstellungen für die Collage-Leinwand.

```typescript
interface CollageSettings {
  // Leinwand-Dimensionen
  width: number                 // Breite (px)
  height: number                // Höhe (px)

  // Hintergrund
  backgroundColor: string       // Hex-Farbe

  // Hintergrundbild
  backgroundImage: {
    url: string | null
    fit: 'cover' | 'contain' | 'stretch' | 'tile'
    opacity: number             // 0-1
    brightness: number          // 0-200
    contrast: number            // 0-200
    saturation: number          // 0-200
    blur: number                // 0-100
  }

  // Layout
  layout: LayoutType

  // Raster
  gridEnabled: boolean
  gridSize: number              // Rastergröße (px)
}
```

### LayoutType

Verfügbare Layout-Vorlagen.

```typescript
type LayoutType =
  | 'freestyle'    // Freie Positionierung
  | 'grid-2x2'     // 2x2 Raster
  | 'grid-3x3'     // 3x3 Raster
  | 'grid-2x3'     // 2x3 Raster
  | 'magazine'     // Groß links, klein rechts
  | 'spotlight'    // Groß oben, 3 klein unten
  | 'hero'         // Groß oben, Reihe unten
  | 'sidebar'      // Seitenleiste links
  | 'mosaic'       // Variable Größen
  | 'diagonal'     // Diagonale Anordnung
  | 'panorama'     // Breit oben, Reihe unten
  | 'focus'        // Zentrum-Fokus, Ecken
  | 'triptych'     // Drei Spalten
  | 'masonry'      // Pinterest-Stil
```

### Template

Speicherbare Collage-Vorlagen.

```typescript
interface Template {
  id: string
  name?: string
  nameKey?: string              // i18n-Schlüssel
  description?: string
  descriptionKey?: string       // i18n-Schlüssel
  thumbnail: string             // Data-URL (JPEG)
  category: 'predefined' | 'user'
  createdAt: number             // Zeitstempel

  collageState: {
    settings: CollageSettings
    layout: string
    images: CollageImage[]
    texts: CollageText[]
  }
}
```

### Toast

Benachrichtigungsmeldungen.

```typescript
interface Toast {
  id: string                    // UUID
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number             // Millisekunden
}
```

### HistorySnapshot

Undo/Redo-Verlaufseintrag.

```typescript
interface HistorySnapshot {
  images: Omit<CollageImage, 'file'>[]  // Ohne File-Objekt
  texts: CollageText[]
  settings: CollageSettings
  timestamp: number
}
// MAX_HISTORY_SIZE = 50 Einträge
```

---

## Datenpersistenz

### LocalStorage-Schlüssel

| Schlüssel | Beschreibung |
|-----------|--------------|
| `collage-maker-autosave` | Aktueller Collage-Zustand (komprimiert) |
| `collage-maker-user-templates` | Benutzer-erstellte Templates |
| `theme` | Theme-Einstellung (`light` / `dark`) |
| `locale` | Spracheinstellung (`de` / `en`) |

### Auto-Save-Details

- **Debounce:** 2 Sekunden Verzögerung
- **Bildkompression:** Max 400x400px, JPEG-Qualität 0.6
- **Speicherlimit:** Fallback auf kleinere Bilder bei Quota-Überschreitung
- **Wiederherstellung:** Prompt bei Seitenneuladen
- **Maximalgröße:** ~5MB vor Komprimierungsoptimierung

---

## Hauptfunktionen

### Bildverwaltung
- Drag & Drop Upload mit Dateivalidierung
- Multi-Bild-Unterstützung (Galerie-System)
- Bildduplizierung und Batch-Operationen
- Automatische Bildkompression

### Textfunktionen
- Text hinzufügen/bearbeiten/löschen
- Schriftart-Auswahl
- Schatten- und Kontur-Effekte
- Textausrichtung und Zeichenabstand

### Bearbeitungsfunktionen
- 14 verschiedene Layout-Presets
- Rotation, Skalierung, Positionierung per Drag & Drop
- Deckkraft, Rahmen, Schatten-Effekte
- 7 Bildfilter (Helligkeit, Kontrast, Sättigung, etc.)
- Z-Index/Ebenen-Verwaltung

### Tastenkürzel
- 30+ Shortcuts in 5 Kategorien
- Auswahl, Bearbeitung, Navigation, Leinwand, Allgemein
- Pfeilbewegung (1px und 10px Varianten)

### Export
- PNG, JPEG, WEBP Formate
- Einstellbare Qualität/Kompression
- Volle Auflösung beim Rendern

### Internationalisierung
- Deutsch (de) und Englisch (en)
- 520+ Übersetzungsstrings
- Sprachumschalter in der UI

### Theming
- Dark/Light Mode Toggle
- Custom Tailwind Theme-Farben
- CSS-Klassen-basierter Dark Mode

---

*Zuletzt aktualisiert: Januar 2026*
