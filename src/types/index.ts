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
  shadowEnabled: boolean
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string
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
