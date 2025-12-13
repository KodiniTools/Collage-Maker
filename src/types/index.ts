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
  // Template/Instanz-System: Templates sind in der Galerie, Instanzen im Canvas
  isGalleryTemplate?: boolean
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

export interface CollageSettings {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: string | null  // URL des Hintergrundbildes
  backgroundImageFit: BackgroundImageFit  // Wie das Hintergrundbild angepasst wird
  layout: LayoutType
  gridEnabled: boolean
  gridSize: number
}

export type Theme = 'light' | 'dark'
export type Locale = 'de' | 'en'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}
