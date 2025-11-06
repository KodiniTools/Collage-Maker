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

export interface CollageSettings {
  width: number
  height: number
  backgroundColor: string
  layout: LayoutType
  gridEnabled: boolean
  gridSize: number
}

export type Theme = 'light' | 'dark'
export type Locale = 'de' | 'en'
