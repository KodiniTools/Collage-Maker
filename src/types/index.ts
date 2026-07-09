export interface Point {
  x: number
  y: number
}

/**
 * Eck-Versätze für das freie Verzerren (Distort). Definiert im lokalen
 * Bildkoordinatensystem (Ursprung = Bildmitte, VOR Rotation/Spiegelung/Neigung).
 * Ein Versatz von 0/0 lässt die jeweilige Ecke am Rechteck; ≠0 verformt das Bild.
 */
export interface CornerOffsets {
  nw: Point
  ne: Point
  se: Point
  sw: Point
}

export interface CollageImage {
  id: string
  file: File
  url: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  opacity: number
  borderRadius: number
  borderEnabled: boolean
  borderWidth: number
  borderColor: string
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'
  borderShadowEnabled: boolean
  borderShadowOffsetX: number
  borderShadowOffsetY: number
  borderShadowBlur: number
  borderShadowColor: string
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string
  // Bildbearbeitungs-Filter
  brightness: number
  contrast: number
  highlights: number
  shadows: number
  saturation: number
  warmth: number
  sharpness: number
  // Transformation: Spiegelung & Neigung (Scherung)
  flipHorizontal: boolean
  flipVertical: boolean
  skewX: number // horizontale Neigung in Grad
  skewY: number // vertikale Neigung in Grad
  // Freies Verzerren (Distort / Eckpunkt-Pinning): Ist es aktiv, ziehen die
  // 4 Eckpunkte einzeln und verformen das Bild zu einem beliebigen Viereck.
  distortEnabled?: boolean
  // Eck-Versätze im lokalen Bildsystem (Default: alle 0 → unverzerrtes Rechteck)
  cornerOffsets?: CornerOffsets
  // Template/Instanz-System: Templates sind in der Galerie, Instanzen im Canvas
  isGalleryTemplate?: boolean
  // ID des Galerie-Templates, von dem diese Canvas-Instanz abstammt.
  // Bleibt über das Speichern/Wiederherstellen stabil (im Gegensatz zur Blob-URL)
  // und verknüpft Canvas-Instanzen mit ihrem Galerie-Bild.
  sourceId?: string
}

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
  fontWeight: number | 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string
  // Textumrandung (Stroke)
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
  // Buchstabenabstand
  letterSpacing: number
}

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

export type BackgroundImageFit = 'cover' | 'contain' | 'stretch' | 'tile'

export interface BackgroundImageSettings {
  url: string | null
  fit: BackgroundImageFit
  opacity: number
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

export interface CanvasBorderSettings {
  enabled: boolean
  width: number
  color: string
  style: 'solid' | 'dashed' | 'dotted' | 'double'
}

export interface CollageSettings {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: BackgroundImageSettings
  layout: LayoutType
  gridEnabled: boolean
  gridSize: number
  // Rahmen um die gesamte Leinwand (wird mitexportiert)
  border: CanvasBorderSettings
  // Eckenradius der Leinwand in px (0 = eckig, wird mitexportiert)
  cornerRadius: number
}

export type Theme = 'light' | 'dark'
export type Locale = 'de' | 'en'

export interface ToastAction {
  label: string
  handler: () => void
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  action?: ToastAction
}
