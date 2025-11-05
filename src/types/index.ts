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
}

export type LayoutType = 'freestyle' | 'grid-2x2' | 'grid-3x3' | 'grid-2x3'

export interface CollageSettings {
  width: number
  height: number
  backgroundColor: string
  layout: LayoutType
}

export type Theme = 'light' | 'dark'
export type Locale = 'de' | 'en'
