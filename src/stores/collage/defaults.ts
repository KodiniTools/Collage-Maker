import type { BackgroundImageSettings, CollageImage, CollageSettings } from '@/types'

/** Hintergrundbild ohne Bild und ohne Anpassungen. */
export function createDefaultBackgroundImage(): BackgroundImageSettings {
  return {
    url: null,
    fit: 'cover',
    opacity: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  }
}

export function createDefaultSettings(): CollageSettings {
  return {
    width: 700,
    height: 740,
    backgroundColor: '#ffffff',
    backgroundImage: createDefaultBackgroundImage(),
    layout: 'grid-3x3',
    gridEnabled: false,
    gridSize: 50,
    border: {
      enabled: false,
      width: 12,
      color: '#000000',
      style: 'solid',
    },
    cornerRadius: 0,
  }
}

/** Effekt-/Filter-/Transform-Felder, die jedes neue Bild erhält. */
export type ImageEffectDefaults = Omit<
  CollageImage,
  | 'id'
  | 'file'
  | 'url'
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'zIndex'
  | 'distortEnabled'
  | 'cornerOffsets'
  | 'crop'
  | 'isGalleryTemplate'
  | 'sourceId'
>

/** Standardwerte für neue Bilder (keine Effekte, keine Filter, keine Transformation). */
export function createImageDefaults(): ImageEffectDefaults {
  return {
    rotation: 0,
    opacity: 1,
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'solid',
    borderShadowEnabled: false,
    borderShadowOffsetX: 3,
    borderShadowOffsetY: 3,
    borderShadowBlur: 6,
    borderShadowColor: '#000000',
    shadowEnabled: false,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    shadowBlur: 10,
    shadowColor: '#000000',
    // Bildbearbeitungs-Filter (Standard = keine Anpassung)
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0,
    // Transformation (Standard = keine Spiegelung/Neigung)
    flipHorizontal: false,
    flipVertical: false,
    skewX: 0,
    skewY: 0,
  }
}
