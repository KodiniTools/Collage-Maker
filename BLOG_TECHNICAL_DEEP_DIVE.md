# Vue Collage Maker: Ein technischer Deep Dive

> **Zielgruppe**: Entwickler, die Vue.js 3, Canvas API und moderne Browser-Technologien verstehen und diese Anwendung tiefgreifend kennenlernen möchten.

---

## Inhaltsverzeichnis

1. [Einführung und Architekturübersicht](#1-einführung-und-architekturübersicht)
2. [Vue.js 3 Composition API in der Praxis](#2-vuejs-3-composition-api-in-der-praxis)
3. [HTML5 Canvas API: Rendering Engine](#3-html5-canvas-api-rendering-engine)
4. [Pinia State Management Pattern](#4-pinia-state-management-pattern)
5. [TypeScript-Typsystem und Interfaces](#5-typescript-typsystem-und-interfaces)
6. [File API und Bildverarbeitung](#6-file-api-und-bildverarbeitung)
7. [LocalStorage und Session-Persistenz](#7-localstorage-und-session-persistenz)
8. [Vue Router und SPA-Navigation](#8-vue-router-und-spa-navigation)
9. [Internationalisierung mit vue-i18n](#9-internationalisierung-mit-vue-i18n)
10. [Build-System und Performance-Optimierung](#10-build-system-und-performance-optimierung)
11. [Fortgeschrittene Canvas-Techniken](#11-fortgeschrittene-canvas-techniken)
12. [Composables: Wiederverwendbare Logik](#12-composables-wiederverwendbare-logik)
13. [Event-Handling und Drag-and-Drop](#13-event-handling-und-drag-and-drop)
14. [Responsive Design und Dark Mode](#14-responsive-design-und-dark-mode)
15. [Sicherheit und Datenschutz](#15-sicherheit-und-datenschutz)
16. [Fazit und Best Practices](#16-fazit-und-best-practices)

---

## 1. Einführung und Architekturübersicht

### Was ist der Vue Collage Maker?

Der Vue Collage Maker ist eine vollständig clientseitige Webanwendung zur Erstellung von Fotocollagen. Die Anwendung demonstriert den Einsatz moderner Web-Technologien:

- **Vue.js 3** mit Composition API
- **HTML5 Canvas API** für Bildmanipulation
- **Pinia** für State Management
- **TypeScript** für Typsicherheit
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling

### Architekturprinzipien

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue.js 3 Application                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Pages      │  │  Components │  │  Composables│              │
│  │  ---------- │  │  ---------- │  │  ---------- │              │
│  │  Landing    │  │  Canvas     │  │  Keyboard   │              │
│  │  Editor     │  │  Controls   │  │  AutoSave   │              │
│  │  FAQ        │  │  Upload     │  │             │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Pinia Stores                            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │ collage │ │ history │ │settings │ │templates│         │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Browser APIs                                  │  │
│  │  Canvas API │ File API │ localStorage │ URL API           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Projektstruktur

```
src/
├── components/          # 19 Vue 3 Komponenten
│   ├── CollageCanvas.vue      # Haupt-Canvas (1370 Zeilen)
│   ├── ImageUploader.vue      # Datei-Upload
│   ├── ImageControls.vue      # Bildbearbeitung
│   ├── TextControls.vue       # Textbearbeitung
│   ├── LayoutSelector.vue     # 13 Layout-Vorlagen
│   ├── ExportControls.vue     # PNG/JPEG/WebP Export
│   └── ...
├── stores/              # 5 Pinia Stores
│   ├── collage.ts            # Hauptzustand (1057 Zeilen)
│   ├── history.ts            # Undo/Redo
│   ├── settings.ts           # Theme/Locale
│   ├── templates.ts          # Vorlagen
│   └── toast.ts              # Benachrichtigungen
├── composables/         # Wiederverwendbare Logik
│   ├── useKeyboardShortcuts.ts
│   └── useAutoSave.ts
├── pages/               # Seiten-Komponenten
│   ├── LandingPage.vue
│   ├── EditorPage.vue
│   └── FaqPage.vue
├── types/               # TypeScript Definitionen
│   └── index.ts
├── utils/               # Hilfsfunktionen
│   └── imageCompression.ts
├── locales/             # Übersetzungen
│   ├── de.json
│   └── en.json
├── router/              # Vue Router
│   └── index.ts
├── App.vue              # Root-Komponente
├── main.ts              # Entry Point
└── i18n.ts              # i18n Konfiguration
```

---

## 2. Vue.js 3 Composition API in der Praxis

### Die Evolution von Options API zu Composition API

Vue 3 führte die Composition API ein, die eine bessere Code-Organisation und Wiederverwendbarkeit ermöglicht. Der Collage Maker nutzt diese Möglichkeiten extensiv.

### Beispiel: EditorPage.vue

```typescript
// src/pages/EditorPage.vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useAutoSave } from '@/composables/useAutoSave'

// Stores einbinden
const collageStore = useCollageStore()

// Composables aktivieren
const { setupKeyboardShortcuts, cleanupKeyboardShortcuts, shortcuts } = useKeyboardShortcuts()
const { checkForSavedState, restoreState, discardSavedState } = useAutoSave()

// Lokaler reaktiver Zustand
const showRestoreDialog = ref(false)
const showShortcutsModal = ref(false)

// Lifecycle Hooks
onMounted(() => {
  setupKeyboardShortcuts()

  // Prüfen ob gespeicherter Zustand existiert
  if (checkForSavedState()) {
    showRestoreDialog.value = true
  }
})

onBeforeUnmount(() => {
  cleanupKeyboardShortcuts()
})

// Reaktive Watcher
watch(
  () => collageStore.canvasZoom,
  (newZoom) => {
    // Zoom-Änderungen verarbeiten
  }
)
</script>
```

### Die Kraft von `<script setup>`

Das `<script setup>` Syntax ist syntaktischer Zucker für:

```typescript
// Ohne <script setup>
export default {
  setup() {
    const count = ref(0)
    return { count }
  }
}

// Mit <script setup> - automatisches Expose
<script setup>
const count = ref(0)
// Automatisch im Template verfügbar
</script>
```

**Vorteile:**
- Weniger Boilerplate-Code
- Bessere TypeScript-Integration
- Automatisches Expose von Variablen
- Compile-Time Optimierungen

### Reaktivität mit `ref` und `reactive`

```typescript
// src/stores/collage.ts
import { ref, reactive, computed } from 'vue'

// ref für primitive Werte
const selectedImageIds = ref<string[]>([])
const canvasZoom = ref(1)
const lockAspectRatio = ref(true)

// reactive für Objekte
const settings = reactive<CollageSettings>({
  width: 700,
  height: 740,
  backgroundColor: '#ffffff',
  layout: 'freestyle',
  gridEnabled: false,
  gridSize: 20
})

// computed für abgeleitete Werte
const selectedImages = computed(() =>
  images.value.filter(img => selectedImageIds.value.includes(img.id))
)
```

### Props und Emits mit TypeScript

```typescript
// Typisierte Props
interface Props {
  image: CollageImage
  isSelected: boolean
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1
})

// Typisierte Emits
interface Emits {
  (e: 'select', id: string): void
  (e: 'update', image: Partial<CollageImage>): void
  (e: 'delete', id: string): void
}

const emit = defineEmits<Emits>()

// Verwendung
emit('update', { x: 100, y: 200 })
```

---

## 3. HTML5 Canvas API: Rendering Engine

### Grundlagen der Canvas API

Die Canvas API ist das Herzstück des Collage Makers. Sie ermöglicht pixelgenaues Rendering direkt im Browser.

```typescript
// src/components/CollageCanvas.vue
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
  }
})
```

### Der Rendering-Zyklus

```typescript
const renderCanvas = () => {
  if (!ctx.value || !canvas.value) return

  const context = ctx.value

  // 1. Canvas-Größe setzen
  canvas.value.width = collageStore.settings.width
  canvas.value.height = collageStore.settings.height

  // 2. Hintergrund zeichnen
  context.fillStyle = collageStore.settings.backgroundColor
  context.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // 3. Hintergrundbild (falls vorhanden)
  if (collageStore.settings.backgroundImage?.url) {
    drawBackgroundImage(context)
  }

  // 4. Grid zeichnen (falls aktiviert)
  if (collageStore.settings.gridEnabled) {
    drawGrid(context)
  }

  // 5. Bilder zeichnen (sortiert nach zIndex)
  const sortedImages = [...collageStore.canvasImages]
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const image of sortedImages) {
    drawImage(context, image)
  }

  // 6. Texte zeichnen (sortiert nach zIndex)
  const sortedTexts = [...collageStore.texts]
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const text of sortedTexts) {
    drawText(context, text)
  }

  // 7. Selektionsrahmen und Handles
  drawSelectionIndicators(context)

  // 8. Smart Guides (beim Drag)
  if (isDragging.value) {
    drawSmartGuides(context)
  }
}
```

### Bild-Rendering mit Transformationen

```typescript
const drawImage = (ctx: CanvasRenderingContext2D, image: CollageImage) => {
  const img = imageCache.get(image.url)
  if (!img) return

  // Zustand speichern
  ctx.save()

  // Zum Bildmittelpunkt verschieben
  const centerX = image.x + image.width / 2
  const centerY = image.y + image.height / 2
  ctx.translate(centerX, centerY)

  // Rotation anwenden
  ctx.rotate((image.rotation * Math.PI) / 180)

  // Opacity setzen
  ctx.globalAlpha = image.opacity

  // CSS-Filter anwenden
  ctx.filter = buildFilterString(image)

  // Bild zeichnen (zentriert)
  ctx.drawImage(
    img,
    -image.width / 2,
    -image.height / 2,
    image.width,
    image.height
  )

  // Zustand wiederherstellen
  ctx.restore()
}

const buildFilterString = (image: CollageImage): string => {
  const filters: string[] = []

  if (image.brightness !== 100) {
    filters.push(`brightness(${image.brightness}%)`)
  }
  if (image.contrast !== 100) {
    filters.push(`contrast(${image.contrast}%)`)
  }
  if (image.saturation !== 100) {
    filters.push(`saturate(${image.saturation}%)`)
  }

  return filters.length > 0 ? filters.join(' ') : 'none'
}
```

### Abgerundete Ecken mit Clipping Path

```typescript
const drawImageWithBorderRadius = (
  ctx: CanvasRenderingContext2D,
  image: CollageImage
) => {
  ctx.save()

  // Clipping-Pfad für abgerundete Ecken erstellen
  ctx.beginPath()
  const x = -image.width / 2
  const y = -image.height / 2
  const w = image.width
  const h = image.height
  const r = image.borderRadius

  // Abgerundetes Rechteck zeichnen
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.clip()

  // Bild innerhalb des Clipping-Bereichs zeichnen
  ctx.drawImage(img, x, y, w, h)

  ctx.restore()
}
```

### Pixel-Level Bildbearbeitung

Für fortgeschrittene Filter wie Highlights, Shadows und Warmth werden Pixel direkt manipuliert:

```typescript
const applyPixelFilters = (
  ctx: CanvasRenderingContext2D,
  image: CollageImage,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  // Pixeldaten abrufen
  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  // Durch jeden Pixel iterieren (4 Werte: R, G, B, A)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Alpha: data[i + 3]

    // Helligkeit berechnen (Luminanz)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b

    // Highlights anpassen (helle Bereiche aufhellen)
    if (image.highlights !== 0) {
      const highlightFactor = Math.pow(luminance / 255, 2)
      const adjustment = image.highlights * highlightFactor * 2.55
      data[i] = clamp(r + adjustment)
      data[i + 1] = clamp(g + adjustment)
      data[i + 2] = clamp(b + adjustment)
    }

    // Shadows anpassen (dunkle Bereiche aufhellen)
    if (image.shadows !== 0) {
      const shadowFactor = Math.pow(1 - luminance / 255, 2)
      const adjustment = image.shadows * shadowFactor * 2.55
      data[i] = clamp(data[i] + adjustment)
      data[i + 1] = clamp(data[i + 1] + adjustment)
      data[i + 2] = clamp(data[i + 2] + adjustment)
    }

    // Warmth (Farbtemperatur)
    if (image.warmth !== 0) {
      // Positiv = wärmer (mehr Rot/Gelb)
      // Negativ = kälter (mehr Blau)
      data[i] = clamp(data[i] + image.warmth * 0.5)     // Rot
      data[i + 1] = clamp(data[i + 1] + image.warmth * 0.25) // Grün
      data[i + 2] = clamp(data[i + 2] - image.warmth * 0.5)  // Blau
    }
  }

  // Modifizierte Pixeldaten zurückschreiben
  ctx.putImageData(imageData, x, y)
}

const clamp = (value: number): number => Math.max(0, Math.min(255, value))
```

### Text-Rendering auf Canvas

```typescript
const drawText = (ctx: CanvasRenderingContext2D, text: CollageText) => {
  ctx.save()

  // Position und Rotation
  ctx.translate(text.x, text.y)
  ctx.rotate((text.rotation * Math.PI) / 180)

  // Font-Eigenschaften setzen
  const fontWeight = text.fontWeight === 'bold' ? 'bold' : text.fontWeight
  ctx.font = `${text.fontStyle} ${fontWeight} ${text.fontSize}px "${text.fontFamily}"`
  ctx.textAlign = text.textAlign
  ctx.textBaseline = 'top'

  // Letter Spacing (experimentelles Feature)
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = `${text.letterSpacing}px`
  }

  // Schatten setzen (falls aktiviert)
  if (text.shadowEnabled) {
    ctx.shadowOffsetX = text.shadowOffsetX
    ctx.shadowOffsetY = text.shadowOffsetY
    ctx.shadowBlur = text.shadowBlur
    ctx.shadowColor = text.shadowColor
  }

  // Mehrzeiliger Text
  const lines = text.text.split('\n')
  const lineHeight = text.fontSize * 1.2

  lines.forEach((line, index) => {
    const y = index * lineHeight

    // Stroke (Outline) zeichnen
    if (text.strokeEnabled) {
      ctx.strokeStyle = text.strokeColor
      ctx.lineWidth = text.strokeWidth
      ctx.strokeText(line, 0, y)
    }

    // Fill zeichnen
    ctx.fillStyle = text.color
    ctx.fillText(line, 0, y)
  })

  ctx.restore()
}
```

---

## 4. Pinia State Management Pattern

### Warum Pinia?

Pinia ist der offizielle State-Management-Store für Vue 3. Er bietet:

- **DevTools-Integration**: Time-Travel-Debugging
- **TypeScript-Support**: Vollständige Typinferenz
- **Modulare Architektur**: Stores sind unabhängig
- **Composition API**: Natürliche Integration

### Der Collage Store: Herzstück der Anwendung

```typescript
// src/stores/collage.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useHistoryStore } from './history'

export const useCollageStore = defineStore('collage', () => {
  // State
  const images = ref<CollageImage[]>([])
  const texts = ref<CollageText[]>([])
  const selectedImageIds = ref<string[]>([])
  const selectedTextId = ref<string | null>(null)
  const settings = ref<CollageSettings>({
    width: 700,
    height: 740,
    backgroundColor: '#ffffff',
    layout: 'freestyle',
    gridEnabled: false,
    gridSize: 20,
    backgroundImage: null
  })
  const canvasZoom = ref(1)
  const lockAspectRatio = ref(true)

  // Getters (computed)
  const canvasImages = computed(() =>
    images.value.filter(img => !img.isGalleryTemplate)
  )

  const galleryImages = computed(() =>
    images.value.filter(img => img.isGalleryTemplate)
  )

  const selectedImages = computed(() =>
    canvasImages.value.filter(img =>
      selectedImageIds.value.includes(img.id)
    )
  )

  const hasSelection = computed(() =>
    selectedImageIds.value.length > 0 || selectedTextId.value !== null
  )

  // Actions
  const addImages = async (files: File[]) => {
    const historyStore = useHistoryStore()
    historyStore.saveSnapshot()

    for (const file of files) {
      const url = URL.createObjectURL(file)
      const dimensions = await getImageDimensions(url)

      // Gallery Template erstellen
      const templateId = crypto.randomUUID()
      const template: CollageImage = {
        id: templateId,
        file,
        url,
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        rotation: 0,
        zIndex: images.value.length,
        opacity: 1,
        isGalleryTemplate: true,
        // ... weitere Eigenschaften
      }
      images.value.push(template)

      // Canvas Instance erstellen
      const instanceId = crypto.randomUUID()
      const instance: CollageImage = {
        ...template,
        id: instanceId,
        isGalleryTemplate: false,
        x: calculateInitialPosition().x,
        y: calculateInitialPosition().y
      }
      images.value.push(instance)
    }

    // Layout anwenden falls nicht freestyle
    if (settings.value.layout !== 'freestyle') {
      applyLayout(settings.value.layout)
    }
  }

  const updateImage = (id: string, updates: Partial<CollageImage>) => {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      images.value[index] = { ...images.value[index], ...updates }
    }
  }

  const saveStateForUndo = () => {
    const historyStore = useHistoryStore()
    historyStore.saveSnapshot()
  }

  // Öffentliche API zurückgeben
  return {
    // State
    images,
    texts,
    selectedImageIds,
    selectedTextId,
    settings,
    canvasZoom,
    lockAspectRatio,

    // Getters
    canvasImages,
    galleryImages,
    selectedImages,
    hasSelection,

    // Actions
    addImages,
    updateImage,
    saveStateForUndo,
    // ... 100+ weitere Methoden
  }
})
```

### Das Dual-Instance-System

Ein interessantes Pattern in dieser Anwendung ist das Template/Instance-System für Bilder:

```typescript
// Konzept:
// 1. Jedes hochgeladene Bild wird als "Template" gespeichert
// 2. Auf dem Canvas werden "Instanzen" des Templates angezeigt
// 3. Ein Template kann mehrere Instanzen haben

interface CollageImage {
  id: string
  // ... andere Eigenschaften
  isGalleryTemplate: boolean  // true = Template, false = Instance
}

// Template: Erscheint in der Galerie-Sidebar
// Instance: Erscheint auf dem Canvas

const addImageToCanvas = (templateId: string) => {
  const template = images.value.find(
    img => img.id === templateId && img.isGalleryTemplate
  )

  if (template) {
    const instance: CollageImage = {
      ...template,
      id: crypto.randomUUID(),
      isGalleryTemplate: false,
      x: 50,
      y: 50
    }
    images.value.push(instance)
  }
}
```

### History Store: Undo/Redo implementieren

```typescript
// src/stores/history.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface HistorySnapshot {
  images: CollageImage[]
  texts: CollageText[]
  settings: CollageSettings
  selectedImageIds: string[]
  selectedTextId: string | null
}

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<HistorySnapshot[]>([])
  const redoStack = ref<HistorySnapshot[]>([])
  const isRestoring = ref(false)
  const MAX_HISTORY_SIZE = 50

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const saveSnapshot = () => {
    // Nicht speichern während Wiederherstellung
    if (isRestoring.value) return

    const collageStore = useCollageStore()

    const snapshot: HistorySnapshot = {
      // Deep Clone ohne File-Objekte (nicht serialisierbar)
      images: collageStore.images.map(img => ({
        ...img,
        file: undefined as any
      })),
      texts: JSON.parse(JSON.stringify(collageStore.texts)),
      settings: JSON.parse(JSON.stringify(collageStore.settings)),
      selectedImageIds: [...collageStore.selectedImageIds],
      selectedTextId: collageStore.selectedTextId
    }

    undoStack.value.push(snapshot)

    // Stack-Größe begrenzen
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift()
    }

    // Redo-Stack leeren bei neuer Aktion
    redoStack.value = []
  }

  const undo = () => {
    if (!canUndo.value) return

    isRestoring.value = true
    const collageStore = useCollageStore()

    // Aktuellen Zustand für Redo speichern
    const currentSnapshot = createSnapshot()
    redoStack.value.push(currentSnapshot)

    // Vorherigen Zustand wiederherstellen
    const previousSnapshot = undoStack.value.pop()!
    restoreSnapshot(previousSnapshot)

    isRestoring.value = false
  }

  const redo = () => {
    if (!canRedo.value) return

    isRestoring.value = true
    const collageStore = useCollageStore()

    // Aktuellen Zustand für Undo speichern
    const currentSnapshot = createSnapshot()
    undoStack.value.push(currentSnapshot)

    // Nächsten Zustand wiederherstellen
    const nextSnapshot = redoStack.value.pop()!
    restoreSnapshot(nextSnapshot)

    isRestoring.value = false
  }

  return {
    canUndo,
    canRedo,
    undoCount: computed(() => undoStack.value.length),
    redoCount: computed(() => redoStack.value.length),
    saveSnapshot,
    undo,
    redo,
    clearHistory: () => {
      undoStack.value = []
      redoStack.value = []
    }
  }
})
```

---

## 5. TypeScript-Typsystem und Interfaces

### Zentrale Type Definitions

```typescript
// src/types/index.ts

// Bild-Interface mit allen Eigenschaften
export interface CollageImage {
  // Identifikation
  id: string
  file: File
  url: string
  isGalleryTemplate?: boolean

  // Position & Größe
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  opacity: number

  // Border-Eigenschaften
  borderEnabled: boolean
  borderRadius: number
  borderWidth: number
  borderColor: string
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'

  // Border-Schatten
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

  // Filter
  brightness: number    // 100 = normal
  contrast: number      // 100 = normal
  saturation: number    // 100 = normal
  highlights: number    // -100 bis +100
  shadows: number       // -100 bis +100
  warmth: number        // -100 bis +100
  sharpness: number     // -100 bis +100
}

// Text-Interface
export interface CollageText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  rotation: number
  zIndex: number
  fontWeight: number | 'bold'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'

  // Schatten
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string

  // Stroke (Outline)
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number

  // Spacing
  letterSpacing: number
}

// Canvas-Einstellungen
export interface CollageSettings {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: BackgroundImageSettings | null
  layout: LayoutType
  gridEnabled: boolean
  gridSize: number
}

// Hintergrundbild-Einstellungen
export interface BackgroundImageSettings {
  url: string
  file?: File
  fitMode: 'cover' | 'contain' | 'stretch' | 'tile'
  opacity: number
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

// Layout-Typen als Union Type
export type LayoutType =
  | 'freestyle'
  | 'grid-2x2'
  | 'grid-3x3'
  | 'grid-2x3'
  | 'magazine'
  | 'spotlight'
  | 'hero'
  | 'sidebar'
  | 'mosaic'
  | 'diagonal'
  | 'panorama'
  | 'focus'
  | 'triptych'
  | 'masonry'

// Toast-Benachrichtigung
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

// Resize-Handle Positionen
export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'        | 'e'
  | 'sw' | 's' | 'se'
```

### Utility Types für partielle Updates

```typescript
// Partielle Updates für Bilder
type ImageUpdate = Partial<Omit<CollageImage, 'id' | 'file' | 'url'>>

const updateImage = (id: string, updates: ImageUpdate) => {
  const index = images.value.findIndex(img => img.id === id)
  if (index !== -1) {
    images.value[index] = { ...images.value[index], ...updates }
  }
}

// Verwendung
updateImage('abc123', { x: 100, y: 200, rotation: 45 })
```

### Type Guards

```typescript
// Prüfen ob ein Element ein Bild oder Text ist
const isCollageImage = (element: CollageImage | CollageText): element is CollageImage => {
  return 'file' in element && 'url' in element
}

const isCollageText = (element: CollageImage | CollageText): element is CollageText => {
  return 'text' in element && 'fontFamily' in element
}

// Verwendung
const handleSelection = (element: CollageImage | CollageText) => {
  if (isCollageImage(element)) {
    // TypeScript weiß jetzt: element ist CollageImage
    console.log(element.url)
  } else {
    // TypeScript weiß: element ist CollageText
    console.log(element.text)
  }
}
```

---

## 6. File API und Bildverarbeitung

### Drag-and-Drop Upload

```typescript
// src/components/ImageUploader.vue
<template>
  <div
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    :class="{ 'border-blue-500': isDragging }"
  >
    <input
      type="file"
      multiple
      accept="image/*"
      @change="onFileSelect"
      ref="fileInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { compressImages } from '@/utils/imageCompression'

const collageStore = useCollageStore()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const onDrop = async (event: DragEvent) => {
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  await processFiles(Array.from(files))
}

const onFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  await processFiles(Array.from(input.files))

  // Input zurücksetzen für erneute Auswahl derselben Datei
  input.value = ''
}

const processFiles = async (files: File[]) => {
  // Nur Bilder filtern
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  // Dateigröße validieren (max 50MB)
  const validFiles = imageFiles.filter(file => file.size <= 50 * 1024 * 1024)

  if (validFiles.length === 0) {
    toast.error('Keine gültigen Bilddateien gefunden')
    return
  }

  // Bilder komprimieren
  const compressedFiles = await compressImages(validFiles)

  // Zum Store hinzufügen
  await collageStore.addImages(compressedFiles)
}
</script>
```

### Bildkomprimierung

```typescript
// src/utils/imageCompression.ts
export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  skipThreshold: number // Bytes
}

const defaultOptions: CompressionOptions = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.85,
  skipThreshold: 2 * 1024 * 1024 // 2MB
}

export const compressImages = async (
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<File[]> => {
  const opts = { ...defaultOptions, ...options }

  return Promise.all(
    files.map(file => compressImage(file, opts))
  )
}

const compressImage = async (
  file: File,
  options: CompressionOptions
): Promise<File> => {
  // Kleine Dateien nicht komprimieren
  if (file.size < options.skipThreshold) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Seitenverhältnis berechnen
      let { width, height } = img

      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width
        width = options.maxWidth
      }

      if (height > options.maxHeight) {
        width = (width * options.maxHeight) / height
        height = options.maxHeight
      }

      // Canvas für Komprimierung erstellen
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Zu Blob konvertieren
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            // Komprimierte Version verwenden
            const compressedFile = new File(
              [blob],
              file.name,
              { type: 'image/jpeg', lastModified: Date.now() }
            )
            resolve(compressedFile)
          } else {
            // Original behalten wenn nicht kleiner
            resolve(file)
          }
        },
        'image/jpeg',
        options.quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // Original bei Fehler zurückgeben
    }

    img.src = url
  })
}
```

### Blob URL Management

```typescript
// Blob URLs erstellen und verwalten
const createImageUrl = (file: File): string => {
  return URL.createObjectURL(file)
}

// WICHTIG: URLs freigeben um Speicherlecks zu vermeiden
const revokeImageUrl = (url: string) => {
  URL.revokeObjectURL(url)
}

// Bei Bildlöschung aufräumen
const removeImage = (id: string) => {
  const image = images.value.find(img => img.id === id)

  if (image) {
    // Blob URL freigeben
    URL.revokeObjectURL(image.url)

    // Aus Array entfernen
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      images.value.splice(index, 1)
    }
  }
}

// Cleanup bei Komponentenzerstörung
onBeforeUnmount(() => {
  images.value.forEach(img => {
    URL.revokeObjectURL(img.url)
  })
})
```

---

## 7. LocalStorage und Session-Persistenz

### Auto-Save Implementierung

```typescript
// src/composables/useAutoSave.ts
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useCollageStore } from '@/stores/collage'

const STORAGE_KEY = 'collage-maker-autosave'
const SAVE_DELAY = 2000 // 2 Sekunden Debounce

export const useAutoSave = () => {
  const collageStore = useCollageStore()
  let saveTimeout: number | null = null

  // Zustand speichern
  const saveState = async () => {
    try {
      const state = {
        timestamp: Date.now(),
        settings: collageStore.settings,
        texts: collageStore.texts,
        images: await compressImagesForStorage(
          collageStore.canvasImages
        )
      }

      const serialized = JSON.stringify(state)

      // Größenprüfung (localStorage Limit ~5MB)
      if (serialized.length > 4.5 * 1024 * 1024) {
        // Fallback: Kleinere Thumbnails
        state.images = await compressImagesForStorage(
          collageStore.canvasImages,
          { maxSize: 200, quality: 0.5 }
        )
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      if (error instanceof DOMException &&
          error.name === 'QuotaExceededError') {
        // Speicherquote überschritten
        console.warn('localStorage quota exceeded')
        // Nur Metadaten speichern
        saveMetadataOnly()
      }
    }
  }

  // Bilder für Speicherung komprimieren
  const compressImagesForStorage = async (
    images: CollageImage[],
    options = { maxSize: 400, quality: 0.6 }
  ): Promise<StorageImage[]> => {
    return Promise.all(
      images.map(async (img) => {
        const thumbnail = await createThumbnailDataUrl(
          img.url,
          options.maxSize,
          options.quality
        )

        return {
          ...img,
          thumbnailDataUrl: thumbnail,
          // File-Objekt nicht speichern
          file: undefined,
          url: undefined
        }
      })
    )
  }

  // Thumbnail als Base64 Data URL erstellen
  const createThumbnailDataUrl = (
    url: string,
    maxSize: number,
    quality: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Skalieren
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = url
    })
  }

  // Gespeicherten Zustand prüfen
  const checkForSavedState = (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved !== null
    } catch {
      return false
    }
  }

  // Zustand wiederherstellen
  const restoreState = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return false

      const state = JSON.parse(saved)

      // Settings wiederherstellen
      Object.assign(collageStore.settings, state.settings)

      // Texte wiederherstellen
      collageStore.texts = state.texts

      // Bilder wiederherstellen
      for (const savedImage of state.images) {
        // Data URL zu Blob konvertieren
        const blob = await dataUrlToBlob(savedImage.thumbnailDataUrl)
        const file = new File([blob], 'restored.jpg', { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)

        const image: CollageImage = {
          ...savedImage,
          file,
          url
        }
        collageStore.images.push(image)
      }

      return true
    } catch (error) {
      console.error('Restore failed:', error)
      return false
    }
  }

  // Data URL zu Blob konvertieren
  const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
    return fetch(dataUrl).then(res => res.blob())
  }

  // Gespeicherten Zustand löschen
  const discardSavedState = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Debounced Save einrichten
  const scheduleSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = window.setTimeout(saveState, SAVE_DELAY)
  }

  // Watchers einrichten
  onMounted(() => {
    // Änderungen beobachten
    watch(
      () => [
        collageStore.canvasImages,
        collageStore.texts,
        collageStore.settings
      ],
      scheduleSave,
      { deep: true }
    )

    // Vor Seitenverlassen speichern
    window.addEventListener('beforeunload', saveState)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', saveState)
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
  })

  return {
    checkForSavedState,
    restoreState,
    discardSavedState,
    saveState
  }
}
```

### Settings-Persistenz

```typescript
// src/stores/settings.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // Aus localStorage laden oder Defaults verwenden
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  const locale = ref<'de' | 'en'>(
    (localStorage.getItem('locale') as 'de' | 'en') || 'de'
  )

  // Bei Änderungen persistieren
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)

    // Dark Mode Class auf HTML-Element setzen
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, { immediate: true })

  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
  })

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const setLocale = (newLocale: 'de' | 'en') => {
    locale.value = newLocale
  }

  return {
    theme,
    locale,
    toggleTheme,
    setLocale
  }
})
```

---

## 8. Vue Router und SPA-Navigation

### Router-Konfiguration

```typescript
// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LandingPage from '@/pages/LandingPage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import FaqPage from '@/pages/FaqPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage,
    meta: {
      title: 'Collage Maker - Startseite'
    }
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorPage,
    meta: {
      title: 'Collage Maker - Editor'
    }
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqPage,
    meta: {
      title: 'Collage Maker - FAQ'
    }
  },
  {
    // Catch-all Route für 404
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory('/collagemaker/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Bei Zurück-Navigation Position wiederherstellen
    if (savedPosition) {
      return savedPosition
    }
    // Sonst nach oben scrollen
    return { top: 0 }
  }
})

// Navigation Guard für Titel
router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || 'Collage Maker'
  next()
})

export default router
```

### Router-Verwendung in Komponenten

```typescript
// Navigation in Komponenten
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Programmatische Navigation
const goToEditor = () => {
  router.push({ name: 'editor' })
}

// Mit Query-Parametern
const goToEditorWithTemplate = (templateId: string) => {
  router.push({
    name: 'editor',
    query: { template: templateId }
  })
}

// Aktuelle Route prüfen
const isEditorPage = computed(() => route.name === 'editor')
</script>

<template>
  <!-- Deklarative Navigation -->
  <RouterLink to="/editor" class="btn">
    Zum Editor
  </RouterLink>

  <!-- Aktive Link-Hervorhebung -->
  <RouterLink
    to="/faq"
    active-class="text-blue-600"
    exact-active-class="font-bold"
  >
    FAQ
  </RouterLink>
</template>
```

---

## 9. Internationalisierung mit vue-i18n

### i18n-Konfiguration

```typescript
// src/i18n.ts
import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'

// Gespeicherte Sprache oder Browser-Sprache
const getDefaultLocale = (): 'de' | 'en' => {
  const saved = localStorage.getItem('locale')
  if (saved === 'de' || saved === 'en') {
    return saved
  }

  // Browser-Sprache als Fallback
  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'de' ? 'de' : 'en'
}

export const i18n = createI18n({
  legacy: false, // Composition API Mode
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    de,
    en
  },
  // Fehlende Übersetzungen nicht als Warnung
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

export default i18n
```

### Übersetzungsdateien

```json
// src/locales/de.json
{
  "app": {
    "title": "Collage Maker",
    "description": "Erstelle wunderschöne Fotocollagen"
  },
  "upload": {
    "title": "Bilder hochladen",
    "dropzone": "Bilder hierher ziehen oder klicken",
    "maxSize": "Maximale Dateigröße: {size}MB",
    "formats": "Unterstützte Formate: JPG, PNG, WebP"
  },
  "controls": {
    "width": "Breite",
    "height": "Höhe",
    "rotation": "Drehung",
    "opacity": "Transparenz",
    "position": "Position",
    "lockAspectRatio": "Seitenverhältnis sperren"
  },
  "export": {
    "title": "Exportieren",
    "format": "Format",
    "quality": "Qualität",
    "download": "Herunterladen"
  },
  "toast": {
    "imageAdded": "Bild hinzugefügt | {count} Bilder hinzugefügt",
    "imageSaved": "Collage gespeichert",
    "exportSuccess": "Export erfolgreich",
    "exportError": "Export fehlgeschlagen"
  },
  "shortcuts": {
    "title": "Tastenkombinationen",
    "selection": "Auswahl",
    "selectAll": "Alles auswählen",
    "deselect": "Auswahl aufheben",
    "delete": "Löschen"
  }
}
```

### Verwendung in Komponenten

```typescript
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales } = useI18n()

// Sprache wechseln
const changeLocale = (newLocale: string) => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}
</script>

<template>
  <!-- Einfache Übersetzung -->
  <h1>{{ t('app.title') }}</h1>

  <!-- Mit Parametern -->
  <p>{{ t('upload.maxSize', { size: 50 }) }}</p>

  <!-- Pluralisierung -->
  <span>{{ t('toast.imageAdded', imageCount) }}</span>

  <!-- Sprach-Umschalter -->
  <select v-model="locale" @change="changeLocale(locale)">
    <option value="de">Deutsch</option>
    <option value="en">English</option>
  </select>
</template>
```

### Dynamischer Sprachwechsel

```typescript
// src/components/LanguageToggle.vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const { locale } = useI18n()
const settingsStore = useSettingsStore()

const toggleLanguage = () => {
  const newLocale = locale.value === 'de' ? 'en' : 'de'
  locale.value = newLocale
  settingsStore.setLocale(newLocale)
}
</script>

<template>
  <button @click="toggleLanguage" class="language-toggle">
    <span v-if="locale === 'de'">🇩🇪 DE</span>
    <span v-else>🇬🇧 EN</span>
  </button>
</template>
```

---

## 10. Build-System und Performance-Optimierung

### Vite-Konfiguration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  // Base Path für Deployment in Subdirectory
  base: '/collagemaker/',

  // Path Aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  // Build-Optimierungen
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Chunk-Splitting für besseres Caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor-Chunk für Vue-Ökosystem
          'vue-vendor': ['vue', 'pinia', 'vue-i18n', 'vue-router'],
        },

        // Asset-Dateinamen mit Hash
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },

        // Chunk-Dateinamen
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },

    // Minimale Chunk-Größe
    chunkSizeWarningLimit: 500,

    // Sourcemaps für Production (optional)
    sourcemap: false,

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log entfernen
        drop_debugger: true
      }
    }
  },

  // Dev Server
  server: {
    port: 3000,
    open: true,
    cors: true
  },

  // Preview Server (nach Build)
  preview: {
    port: 4173
  }
})
```

### TypeScript-Konfiguration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler Mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Strict Mode */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Tailwind CSS-Konfiguration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],

  // Class-basierter Dark Mode
  darkMode: 'class',

  theme: {
    extend: {
      // Custom Farben
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },

      // Custom Fonts
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },

      // Custom Animationen
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },

  plugins: []
}
```

### Performance-Metriken und Optimierungen

```typescript
// Lazy Loading für Routen
const routes = [
  {
    path: '/faq',
    component: () => import('@/pages/FaqPage.vue') // Lazy loaded
  }
]

// Image Caching
const imageCache = new Map<string, HTMLImageElement>()

const loadImage = (url: string): Promise<HTMLImageElement> => {
  // Aus Cache wenn vorhanden
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(url, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

// Debouncing für häufige Updates
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => fn(...args), delay)
  }
}

// Verwendung
const debouncedSave = debounce(saveState, 2000)
```

---

## 11. Fortgeschrittene Canvas-Techniken

### Smart Guides: Magnetisches Ausrichten

```typescript
// src/components/CollageCanvas.vue
const SNAP_THRESHOLD = 8 // Pixel

interface Guide {
  position: number
  orientation: 'horizontal' | 'vertical'
}

const calculateSmartGuides = (
  draggingImage: CollageImage,
  allImages: CollageImage[]
): { guides: Guide[]; snappedPosition: { x: number; y: number } } => {
  const guides: Guide[] = []
  let snappedX = draggingImage.x
  let snappedY = draggingImage.y

  // Referenzpunkte des gezogenen Bildes
  const dragLeft = draggingImage.x
  const dragRight = draggingImage.x + draggingImage.width
  const dragCenterX = draggingImage.x + draggingImage.width / 2
  const dragTop = draggingImage.y
  const dragBottom = draggingImage.y + draggingImage.height
  const dragCenterY = draggingImage.y + draggingImage.height / 2

  // Canvas-Referenzpunkte
  const canvasWidth = collageStore.settings.width
  const canvasHeight = collageStore.settings.height
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2

  // Snap-Punkte sammeln
  const verticalSnapPoints: number[] = [
    0, // Linker Rand
    canvasCenterX, // Canvas-Mitte
    canvasWidth // Rechter Rand
  ]

  const horizontalSnapPoints: number[] = [
    0, // Oberer Rand
    canvasCenterY, // Canvas-Mitte
    canvasHeight // Unterer Rand
  ]

  // Snap-Punkte von anderen Bildern
  for (const img of allImages) {
    if (img.id === draggingImage.id) continue

    verticalSnapPoints.push(
      img.x, // Linker Rand
      img.x + img.width / 2, // Mitte
      img.x + img.width // Rechter Rand
    )

    horizontalSnapPoints.push(
      img.y, // Oberer Rand
      img.y + img.height / 2, // Mitte
      img.y + img.height // Unterer Rand
    )
  }

  // Vertikale Ausrichtung prüfen
  for (const snapX of verticalSnapPoints) {
    // Linker Rand snappen
    if (Math.abs(dragLeft - snapX) < SNAP_THRESHOLD) {
      snappedX = snapX
      guides.push({ position: snapX, orientation: 'vertical' })
    }
    // Rechter Rand snappen
    else if (Math.abs(dragRight - snapX) < SNAP_THRESHOLD) {
      snappedX = snapX - draggingImage.width
      guides.push({ position: snapX, orientation: 'vertical' })
    }
    // Mitte snappen
    else if (Math.abs(dragCenterX - snapX) < SNAP_THRESHOLD) {
      snappedX = snapX - draggingImage.width / 2
      guides.push({ position: snapX, orientation: 'vertical' })
    }
  }

  // Horizontale Ausrichtung (analog)
  for (const snapY of horizontalSnapPoints) {
    if (Math.abs(dragTop - snapY) < SNAP_THRESHOLD) {
      snappedY = snapY
      guides.push({ position: snapY, orientation: 'horizontal' })
    }
    else if (Math.abs(dragBottom - snapY) < SNAP_THRESHOLD) {
      snappedY = snapY - draggingImage.height
      guides.push({ position: snapY, orientation: 'horizontal' })
    }
    else if (Math.abs(dragCenterY - snapY) < SNAP_THRESHOLD) {
      snappedY = snapY - draggingImage.height / 2
      guides.push({ position: snapY, orientation: 'horizontal' })
    }
  }

  return {
    guides,
    snappedPosition: { x: snappedX, y: snappedY }
  }
}

// Guides zeichnen
const drawSmartGuides = (ctx: CanvasRenderingContext2D, guides: Guide[]) => {
  ctx.save()

  ctx.strokeStyle = '#f97316' // Orange
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  for (const guide of guides) {
    ctx.beginPath()

    if (guide.orientation === 'vertical') {
      ctx.moveTo(guide.position, 0)
      ctx.lineTo(guide.position, collageStore.settings.height)
    } else {
      ctx.moveTo(0, guide.position)
      ctx.lineTo(collageStore.settings.width, guide.position)
    }

    ctx.stroke()
  }

  ctx.restore()
}
```

### Resize-Handles Implementierung

```typescript
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'

const HANDLE_SIZE = 16

const getHandlePositions = (image: CollageImage): Map<ResizeHandle, { x: number; y: number }> => {
  const { x, y, width, height } = image
  const half = HANDLE_SIZE / 2

  return new Map([
    ['nw', { x: x - half, y: y - half }],
    ['n', { x: x + width / 2 - half, y: y - half }],
    ['ne', { x: x + width - half, y: y - half }],
    ['w', { x: x - half, y: y + height / 2 - half }],
    ['e', { x: x + width - half, y: y + height / 2 - half }],
    ['sw', { x: x - half, y: y + height - half }],
    ['s', { x: x + width / 2 - half, y: y + height - half }],
    ['se', { x: x + width - half, y: y + height - half }]
  ])
}

const drawResizeHandles = (ctx: CanvasRenderingContext2D, image: CollageImage) => {
  const handles = getHandlePositions(image)

  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2

  handles.forEach(({ x, y }) => {
    ctx.fillRect(x, y, HANDLE_SIZE, HANDLE_SIZE)
    ctx.strokeRect(x, y, HANDLE_SIZE, HANDLE_SIZE)
  })

  ctx.restore()
}

const getHandleAtPosition = (
  mouseX: number,
  mouseY: number,
  image: CollageImage
): ResizeHandle | null => {
  const handles = getHandlePositions(image)

  for (const [handle, { x, y }] of handles) {
    if (
      mouseX >= x &&
      mouseX <= x + HANDLE_SIZE &&
      mouseY >= y &&
      mouseY <= y + HANDLE_SIZE
    ) {
      return handle
    }
  }

  return null
}

const getCursorForHandle = (handle: ResizeHandle | null): string => {
  const cursors: Record<ResizeHandle, string> = {
    'nw': 'nwse-resize',
    'n': 'ns-resize',
    'ne': 'nesw-resize',
    'w': 'ew-resize',
    'e': 'ew-resize',
    'sw': 'nesw-resize',
    's': 'ns-resize',
    'se': 'nwse-resize'
  }

  return handle ? cursors[handle] : 'default'
}

// Resize mit Aspect Ratio Lock
const resizeImage = (
  image: CollageImage,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  lockAspectRatio: boolean
) => {
  const aspectRatio = image.width / image.height
  let newWidth = image.width
  let newHeight = image.height
  let newX = image.x
  let newY = image.y

  // Handle-spezifische Logik
  switch (handle) {
    case 'se':
      newWidth = image.width + deltaX
      newHeight = lockAspectRatio
        ? newWidth / aspectRatio
        : image.height + deltaY
      break

    case 'e':
      newWidth = image.width + deltaX
      if (lockAspectRatio) {
        newHeight = newWidth / aspectRatio
      }
      break

    case 's':
      newHeight = image.height + deltaY
      if (lockAspectRatio) {
        newWidth = newHeight * aspectRatio
      }
      break

    case 'nw':
      newWidth = image.width - deltaX
      newHeight = lockAspectRatio
        ? newWidth / aspectRatio
        : image.height - deltaY
      newX = image.x + deltaX
      newY = lockAspectRatio
        ? image.y + (image.height - newHeight)
        : image.y + deltaY
      break

    // ... andere Handles
  }

  // Mindestgröße erzwingen
  const MIN_SIZE = 20
  newWidth = Math.max(MIN_SIZE, newWidth)
  newHeight = Math.max(MIN_SIZE, newHeight)

  return { width: newWidth, height: newHeight, x: newX, y: newY }
}
```

### Export mit hoher Qualität

```typescript
// src/components/ExportControls.vue
const exportCollage = async (
  format: 'png' | 'jpeg' | 'webp',
  quality: number
) => {
  // Temporäres Canvas für Export erstellen
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = collageStore.settings.width
  exportCanvas.height = collageStore.settings.height

  const ctx = exportCanvas.getContext('2d')!

  // Höchste Qualität für Export
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Hintergrund zeichnen
  ctx.fillStyle = collageStore.settings.backgroundColor
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

  // Hintergrundbild
  if (collageStore.settings.backgroundImage?.url) {
    await drawExportBackgroundImage(ctx)
  }

  // Bilder zeichnen (ohne Selections/Guides)
  const sortedImages = [...collageStore.canvasImages]
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const image of sortedImages) {
    await drawExportImage(ctx, image)
  }

  // Texte zeichnen
  const sortedTexts = [...collageStore.texts]
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const text of sortedTexts) {
    drawExportText(ctx, text)
  }

  // Als Blob exportieren
  return new Promise<Blob>((resolve, reject) => {
    const mimeType = `image/${format}`

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Export failed'))
        }
      },
      mimeType,
      format === 'png' ? undefined : quality
    )
  })
}

const downloadCollage = async () => {
  const blob = await exportCollage(selectedFormat.value, quality.value)

  // Download-Link erstellen
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `collage-${Date.now()}.${selectedFormat.value}`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Aufräumen
  URL.revokeObjectURL(url)

  toast.success(t('toast.exportSuccess'))
}
```

---

## 12. Composables: Wiederverwendbare Logik

### Keyboard Shortcuts Composable

```typescript
// src/composables/useKeyboardShortcuts.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useHistoryStore } from '@/stores/history'

export interface Shortcut {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  description: string
  action: () => void
  category: string
}

export const useKeyboardShortcuts = () => {
  const collageStore = useCollageStore()
  const historyStore = useHistoryStore()
  const isHelpModalOpen = ref(false)

  const shortcuts: Shortcut[] = [
    // Auswahl
    {
      key: 'a',
      modifiers: ['ctrl'],
      description: 'Alle auswählen',
      category: 'Auswahl',
      action: () => collageStore.selectAllImages()
    },
    {
      key: 'Escape',
      description: 'Auswahl aufheben',
      category: 'Auswahl',
      action: () => collageStore.clearSelection()
    },

    // Bearbeitung
    {
      key: 'd',
      modifiers: ['ctrl'],
      description: 'Duplizieren',
      category: 'Bearbeitung',
      action: () => collageStore.duplicateSelectedImages()
    },
    {
      key: 'Delete',
      description: 'Löschen',
      category: 'Bearbeitung',
      action: () => collageStore.deleteSelection()
    },
    {
      key: 'r',
      description: 'Um 90° drehen',
      category: 'Bearbeitung',
      action: () => collageStore.rotateSelectedImages(90)
    },
    {
      key: 'r',
      modifiers: ['shift'],
      description: 'Um -90° drehen',
      category: 'Bearbeitung',
      action: () => collageStore.rotateSelectedImages(-90)
    },
    {
      key: ']',
      description: 'In den Vordergrund',
      category: 'Bearbeitung',
      action: () => collageStore.bringSelectedToFront()
    },
    {
      key: '[',
      description: 'In den Hintergrund',
      category: 'Bearbeitung',
      action: () => collageStore.sendSelectedToBack()
    },

    // Navigation
    {
      key: 'ArrowUp',
      description: 'Nach oben bewegen',
      category: 'Navigation',
      action: () => collageStore.moveSelectedImages(0, -1)
    },
    {
      key: 'ArrowDown',
      description: 'Nach unten bewegen',
      category: 'Navigation',
      action: () => collageStore.moveSelectedImages(0, 1)
    },
    {
      key: 'ArrowLeft',
      description: 'Nach links bewegen',
      category: 'Navigation',
      action: () => collageStore.moveSelectedImages(-1, 0)
    },
    {
      key: 'ArrowRight',
      description: 'Nach rechts bewegen',
      category: 'Navigation',
      action: () => collageStore.moveSelectedImages(1, 0)
    },
    {
      key: 'ArrowUp',
      modifiers: ['shift'],
      description: 'Schnell nach oben',
      category: 'Navigation',
      action: () => collageStore.moveSelectedImages(0, -10)
    },

    // Canvas
    {
      key: 'g',
      modifiers: ['ctrl'],
      description: 'Grid umschalten',
      category: 'Canvas',
      action: () => {
        collageStore.settings.gridEnabled = !collageStore.settings.gridEnabled
      }
    },
    {
      key: '0',
      modifiers: ['ctrl'],
      description: 'Zoom zurücksetzen',
      category: 'Canvas',
      action: () => {
        collageStore.canvasZoom = 1
      }
    },
    {
      key: '+',
      modifiers: ['ctrl'],
      description: 'Hineinzoomen',
      category: 'Canvas',
      action: () => {
        collageStore.canvasZoom = Math.min(2, collageStore.canvasZoom + 0.1)
      }
    },
    {
      key: '-',
      modifiers: ['ctrl'],
      description: 'Herauszoomen',
      category: 'Canvas',
      action: () => {
        collageStore.canvasZoom = Math.max(0.25, collageStore.canvasZoom - 0.1)
      }
    },

    // Allgemein
    {
      key: 'z',
      modifiers: ['ctrl'],
      description: 'Rückgängig',
      category: 'Allgemein',
      action: () => historyStore.undo()
    },
    {
      key: 'y',
      modifiers: ['ctrl'],
      description: 'Wiederholen',
      category: 'Allgemein',
      action: () => historyStore.redo()
    },
    {
      key: 'z',
      modifiers: ['ctrl', 'shift'],
      description: 'Wiederholen',
      category: 'Allgemein',
      action: () => historyStore.redo()
    },
    {
      key: 't',
      modifiers: ['ctrl'],
      description: 'Text hinzufügen',
      category: 'Allgemein',
      action: () => collageStore.addText()
    },
    {
      key: '?',
      modifiers: ['shift'],
      description: 'Hilfe anzeigen',
      category: 'Allgemein',
      action: () => {
        isHelpModalOpen.value = true
      }
    }
  ]

  const handleKeyDown = (event: KeyboardEvent) => {
    // Ignorieren wenn in Input-Feld
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).isContentEditable
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()

      const ctrlRequired = shortcut.modifiers?.includes('ctrl') ?? false
      const shiftRequired = shortcut.modifiers?.includes('shift') ?? false
      const altRequired = shortcut.modifiers?.includes('alt') ?? false
      const metaRequired = shortcut.modifiers?.includes('meta') ?? false

      const ctrlMatches = event.ctrlKey === ctrlRequired || event.metaKey === ctrlRequired
      const shiftMatches = event.shiftKey === shiftRequired
      const altMatches = event.altKey === altRequired
      const metaMatches = event.metaKey === metaRequired

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }

  const setupKeyboardShortcuts = () => {
    window.addEventListener('keydown', handleKeyDown)
  }

  const cleanupKeyboardShortcuts = () => {
    window.removeEventListener('keydown', handleKeyDown)
  }

  // Shortcuts nach Kategorie gruppieren
  const groupedShortcuts = computed(() => {
    const groups: Record<string, Shortcut[]> = {}

    for (const shortcut of shortcuts) {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = []
      }
      groups[shortcut.category].push(shortcut)
    }

    return groups
  })

  return {
    shortcuts,
    groupedShortcuts,
    isHelpModalOpen,
    setupKeyboardShortcuts,
    cleanupKeyboardShortcuts
  }
}
```

### Formatierte Shortcut-Anzeige

```typescript
// Helper für Shortcut-Formatierung
const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = []

  if (shortcut.modifiers?.includes('ctrl')) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.modifiers?.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (shortcut.modifiers?.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  // Special Key Namen
  const keyNames: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': '⌫'
  }

  parts.push(keyNames[shortcut.key] || shortcut.key.toUpperCase())

  return parts.join(' + ')
}
```

---

## 13. Event-Handling und Drag-and-Drop

### Canvas Mouse Events

```typescript
// src/components/CollageCanvas.vue
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragImageStartPos = ref({ x: 0, y: 0 })
const activeResizeHandle = ref<ResizeHandle | null>(null)

const onMouseDown = (event: MouseEvent) => {
  const { offsetX, offsetY } = event
  const mouseX = offsetX / collageStore.canvasZoom
  const mouseY = offsetY / collageStore.canvasZoom

  // Prüfen ob auf Resize-Handle geklickt
  for (const imageId of collageStore.selectedImageIds) {
    const image = collageStore.canvasImages.find(img => img.id === imageId)
    if (!image) continue

    const handle = getHandleAtPosition(mouseX, mouseY, image)
    if (handle) {
      isResizing.value = true
      activeResizeHandle.value = handle
      collageStore.saveStateForUndo()
      return
    }
  }

  // Prüfen ob auf Delete-Button geklickt
  const deleteTarget = getDeleteButtonTarget(mouseX, mouseY)
  if (deleteTarget) {
    collageStore.removeImage(deleteTarget)
    return
  }

  // Prüfen ob auf Bild geklickt
  const clickedImage = getImageAtPosition(mouseX, mouseY)

  if (clickedImage) {
    // Mit Shift: Zur Auswahl hinzufügen/entfernen
    if (event.shiftKey) {
      collageStore.toggleImageSelection(clickedImage.id)
    }
    // Ohne Shift: Exklusiv auswählen und Drag starten
    else {
      if (!collageStore.selectedImageIds.includes(clickedImage.id)) {
        collageStore.selectImage(clickedImage.id)
      }

      isDragging.value = true
      dragStartPos.value = { x: mouseX, y: mouseY }
      dragImageStartPos.value = { x: clickedImage.x, y: clickedImage.y }
      collageStore.saveStateForUndo()
    }
  } else {
    // Klick auf leeren Bereich: Auswahl aufheben
    if (!event.shiftKey) {
      collageStore.clearSelection()
    }
  }
}

const onMouseMove = (event: MouseEvent) => {
  const { offsetX, offsetY } = event
  const mouseX = offsetX / collageStore.canvasZoom
  const mouseY = offsetY / collageStore.canvasZoom

  if (isDragging.value) {
    handleDrag(mouseX, mouseY)
  } else if (isResizing.value) {
    handleResize(mouseX, mouseY)
  } else {
    // Cursor aktualisieren
    updateCursor(mouseX, mouseY)
  }
}

const onMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  activeResizeHandle.value = null
  activeGuides.value = []
  renderCanvas()
}

const handleDrag = (mouseX: number, mouseY: number) => {
  const deltaX = mouseX - dragStartPos.value.x
  const deltaY = mouseY - dragStartPos.value.y

  // Smart Guides berechnen
  const primaryImage = collageStore.selectedImages[0]
  if (primaryImage) {
    const newPosition = {
      x: dragImageStartPos.value.x + deltaX,
      y: dragImageStartPos.value.y + deltaY
    }

    const { guides, snappedPosition } = calculateSmartGuides(
      { ...primaryImage, ...newPosition },
      collageStore.canvasImages.filter(
        img => !collageStore.selectedImageIds.includes(img.id)
      )
    )

    activeGuides.value = guides

    // Alle ausgewählten Bilder bewegen
    const snapDeltaX = snappedPosition.x - newPosition.x
    const snapDeltaY = snappedPosition.y - newPosition.y

    for (const image of collageStore.selectedImages) {
      const imageDeltaX = image.x - primaryImage.x
      const imageDeltaY = image.y - primaryImage.y

      collageStore.updateImage(image.id, {
        x: snappedPosition.x + imageDeltaX + snapDeltaX,
        y: snappedPosition.y + imageDeltaY + snapDeltaY
      })
    }
  }

  renderCanvas()
}

const handleResize = (mouseX: number, mouseY: number) => {
  if (!activeResizeHandle.value) return

  const deltaX = mouseX - dragStartPos.value.x
  const deltaY = mouseY - dragStartPos.value.y

  for (const image of collageStore.selectedImages) {
    const newDimensions = resizeImage(
      image,
      activeResizeHandle.value,
      deltaX,
      deltaY,
      collageStore.lockAspectRatio
    )

    collageStore.updateImage(image.id, newDimensions)
  }

  renderCanvas()
}

// Z-Index für Klick-Erkennung (oberste Bilder zuerst)
const getImageAtPosition = (x: number, y: number): CollageImage | null => {
  const sortedImages = [...collageStore.canvasImages]
    .sort((a, b) => b.zIndex - a.zIndex)

  for (const image of sortedImages) {
    if (isPointInRotatedRect(x, y, image)) {
      return image
    }
  }

  return null
}

// Punkt in rotiertem Rechteck prüfen
const isPointInRotatedRect = (
  x: number,
  y: number,
  image: CollageImage
): boolean => {
  // Punkt zum Bildmittelpunkt transformieren
  const centerX = image.x + image.width / 2
  const centerY = image.y + image.height / 2

  // Punkt zurückrotieren
  const angle = -(image.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const dx = x - centerX
  const dy = y - centerY

  const rotatedX = dx * cos - dy * sin + centerX
  const rotatedY = dx * sin + dy * cos + centerY

  // Einfache Rechteck-Prüfung
  return (
    rotatedX >= image.x &&
    rotatedX <= image.x + image.width &&
    rotatedY >= image.y &&
    rotatedY <= image.y + image.height
  )
}
```

### Touch Events für Mobile

```typescript
// Touch-Unterstützung
const onTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    const rect = canvas.value!.getBoundingClientRect()

    const fakeMouseEvent = {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
      shiftKey: false
    } as MouseEvent

    onMouseDown(fakeMouseEvent)
  }
}

const onTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    event.preventDefault()
    const touch = event.touches[0]
    const rect = canvas.value!.getBoundingClientRect()

    const fakeMouseEvent = {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top
    } as MouseEvent

    onMouseMove(fakeMouseEvent)
  }
}

const onTouchEnd = () => {
  onMouseUp()
}

// Template
<template>
  <canvas
    ref="canvas"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  />
</template>
```

---

## 14. Responsive Design und Dark Mode

### Tailwind Dark Mode

```css
/* src/style.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Root-Variablen für Theme */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

.dark {
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
}

/* Utility Classes */
@layer components {
  .card {
    @apply bg-white dark:bg-gray-800
           rounded-lg shadow-md
           border border-gray-200 dark:border-gray-700;
  }

  .btn-primary {
    @apply px-4 py-2 rounded-lg
           bg-blue-600 hover:bg-blue-700
           text-white font-medium
           transition-colors duration-200
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .input-field {
    @apply w-full px-3 py-2 rounded-lg
           bg-white dark:bg-gray-700
           border border-gray-300 dark:border-gray-600
           text-gray-900 dark:text-gray-100
           focus:ring-2 focus:ring-blue-500 focus:outline-none;
  }
}
```

### Theme Toggle Komponente

```typescript
// src/components/ThemeToggle.vue
<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
</script>

<template>
  <button
    @click="settingsStore.toggleTheme"
    class="p-2 rounded-lg
           bg-gray-100 dark:bg-gray-700
           hover:bg-gray-200 dark:hover:bg-gray-600
           transition-colors duration-200"
    :aria-label="settingsStore.theme === 'dark' ? 'Light Mode' : 'Dark Mode'"
  >
    <!-- Sun Icon (Light Mode) -->
    <svg
      v-if="settingsStore.theme === 'dark'"
      class="w-5 h-5 text-yellow-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Moon Icon (Dark Mode) -->
    <svg
      v-else
      class="w-5 h-5 text-gray-700"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  </button>
</template>
```

### Responsive Layout

```typescript
// src/pages/EditorPage.vue
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile: Stack Layout -->
    <!-- Desktop: Sidebar + Main -->
    <div class="flex flex-col lg:flex-row">

      <!-- Sidebar: Links auf Desktop, unten auf Mobile -->
      <aside class="
        order-2 lg:order-1
        w-full lg:w-80
        p-4
        bg-white dark:bg-gray-800
        border-t lg:border-t-0 lg:border-r
        border-gray-200 dark:border-gray-700
      ">
        <!-- Tabs für verschiedene Panels -->
        <div class="flex lg:flex-col gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="mt-4">
          <ImageList v-if="activeTab === 'images'" />
          <ImageControls v-else-if="activeTab === 'edit'" />
          <TextControls v-else-if="activeTab === 'text'" />
          <LayoutSelector v-else-if="activeTab === 'layout'" />
          <CanvasSettings v-else-if="activeTab === 'canvas'" />
          <ExportControls v-else-if="activeTab === 'export'" />
        </div>
      </aside>

      <!-- Main Canvas Area -->
      <main class="
        order-1 lg:order-2
        flex-1
        min-h-[50vh] lg:min-h-screen
        p-4
        flex items-center justify-center
        overflow-auto
      ">
        <div
          class="relative"
          :style="{
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center center'
          }"
        >
          <CollageCanvas />
        </div>
      </main>

    </div>
  </div>
</template>
```

---

## 15. Sicherheit und Datenschutz

### 100% Client-Side Verarbeitung

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Vue Collage Maker                                   │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │  Upload  │  │  Process │  │  Export  │          │    │
│  │  │  ────────│  │  ────────│  │  ────────│          │    │
│  │  │  File API│  │ Canvas   │  │  Blob    │          │    │
│  │  │          │  │ API      │  │  URL     │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  │       │              │              │               │    │
│  │       └──────────────┼──────────────┘               │    │
│  │                      │                               │    │
│  │              ┌───────────────┐                       │    │
│  │              │  localStorage │                       │    │
│  │              │  (Optional)   │                       │    │
│  │              └───────────────┘                       │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ✓ Keine Server-Uploads                                     │
│  ✓ Keine Datenübertragung                                   │
│  ✓ DSGVO-konform                                            │
│  ✓ Bilder verlassen nie das Gerät                          │
└─────────────────────────────────────────────────────────────┘
```

### Input-Validierung

```typescript
// Datei-Validierung
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // MIME-Type prüfen
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Nur Bilddateien erlaubt' }
  }

  // Dateigröße prüfen (max 50MB)
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Datei zu groß (max. 50MB)' }
  }

  // Erlaubte Formate
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Nicht unterstütztes Format' }
  }

  return { valid: true }
}

// Template-Sanitization (bereits durch Vue gegeben)
// Vue escapet automatisch alle Template-Ausdrücke
// {{ userInput }} → Sicher gegen XSS
```

### Memory Management

```typescript
// Blob URLs aufräumen
const cleanupBlobUrls = () => {
  for (const image of images.value) {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url)
    }
  }
}

// Bei Komponentenzerstörung
onBeforeUnmount(() => {
  cleanupBlobUrls()
})

// Bei Bildlöschung
const removeImage = (id: string) => {
  const image = images.value.find(img => img.id === id)
  if (image?.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url)
  }
  images.value = images.value.filter(img => img.id !== id)
}
```

### localStorage Quota Handling

```typescript
const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
       error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('localStorage quota exceeded')

      // Alte Daten löschen
      localStorage.removeItem('collage-maker-autosave')

      // Erneut versuchen
      try {
        localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    }
    throw error
  }
}
```

---

## 16. Fazit und Best Practices

### Zusammenfassung der Technologien

| Technologie | Verwendung | Vorteile |
|-------------|------------|----------|
| Vue.js 3 | UI Framework | Reaktivität, Composition API, TypeScript |
| Pinia | State Management | Devtools, Modulär, TypeScript-First |
| Canvas API | Bildrendering | Volle Kontrolle, Performance, Filter |
| File API | Datei-Upload | Drag-and-Drop, Blob URLs |
| localStorage | Persistenz | Offline-fähig, Schnell |
| Vite | Build Tool | HMR, ESM, Schneller Build |
| TypeScript | Typsicherheit | Bessere DX, Weniger Bugs |
| Tailwind CSS | Styling | Utility-First, Dark Mode |

### Best Practices für ähnliche Projekte

1. **State Management**
   - Pinia für komplexen Zustand
   - Composables für wiederverwendbare Logik
   - Computed Properties für abgeleitete Werte

2. **Canvas Performance**
   - Bilder cachen (`Map<string, HTMLImageElement>`)
   - Rendering debounzen bei häufigen Updates
   - Off-Screen Canvas für Export

3. **Datei-Handling**
   - Blob URLs sofort nach Verwendung freigeben
   - Bilder komprimieren vor Speicherung
   - Fehlerbehandlung für Quota-Limits

4. **TypeScript**
   - Strict Mode aktivieren
   - Interfaces für alle Datenstrukturen
   - Utility Types für partielle Updates

5. **UX/Accessibility**
   - Keyboard Shortcuts dokumentieren
   - Touch-Events für Mobile
   - Visuelle Feedback bei Interaktionen

### Weiterführende Ressourcen

- [Vue.js 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Anhang: Vollständige Dateireferenz

### Kernkomponenten
- `src/components/CollageCanvas.vue` - Canvas-Rendering (1370 Zeilen)
- `src/stores/collage.ts` - Hauptzustand (1057 Zeilen)
- `src/pages/EditorPage.vue` - Editor-Seite
- `src/composables/useKeyboardShortcuts.ts` - Tastenkürzel
- `src/composables/useAutoSave.ts` - Auto-Speicherung

### Konfigurationsdateien
- `vite.config.ts` - Build-Konfiguration
- `tsconfig.json` - TypeScript-Konfiguration
- `tailwind.config.js` - Tailwind-Konfiguration
- `package.json` - Abhängigkeiten und Scripts

### Typdefinitionen
- `src/types/index.ts` - Alle TypeScript-Interfaces

---

*Diese Dokumentation wurde für Entwickler erstellt, die ein tiefgreifendes Verständnis der Vue Collage Maker-Anwendung erlangen möchten. Der Code demonstriert moderne Web-Entwicklungspraktiken und kann als Referenz für eigene Projekte dienen.*
