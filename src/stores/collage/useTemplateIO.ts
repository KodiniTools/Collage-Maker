import type { CollageImage, CollageText, LayoutType, TemplateCollageState } from '@/types'
import { TEMPLATE_MAX_IMAGE_PX, TEMPLATE_JPEG_QUALITY } from '@/config/constants'
import { urlToCompressedDataUrl } from '@/utils/imageCompression'
import type { CollageContext } from './context'
import { createDefaultBackgroundImage } from './defaults'

/** Vorlagen: aktuelle Collage als Vorlage speichern und Vorlagen laden. */
export function useTemplateIO(ctx: CollageContext) {
  const { images, texts, settings } = ctx

  async function saveAsTemplate(
    name: string,
    description: string,
    options?: { maxImagePx?: number; quality?: number }
  ) {
    const maxImagePx = options?.maxImagePx ?? TEMPLATE_MAX_IMAGE_PX
    const jpegQuality = options?.quality ?? TEMPLATE_JPEG_QUALITY
    // Screenshot des aktuellen Canvas erstellen (als Thumbnail)
    const canvas = document.querySelector('canvas')
    let thumbnail = ''
    if (canvas) {
      try {
        thumbnail = canvas.toDataURL('image/jpeg', 0.3)
      } catch (error) {
        console.warn('Could not create thumbnail:', error)
      }
    }

    // Bilder dauerhaft einbetten: Blob-URLs und File-Objekte überleben den
    // localStorage nicht. Deshalb jedes Bild als komprimierte Data-URL ablegen.
    // Pro eindeutiger URL nur einmal komprimieren (Galerie-Template + Canvas-
    // Instanzen teilen sich dieselbe URL).
    const dataUrlByUrl = new Map<string, string>()
    for (const img of images.value) {
      if (img.url && !dataUrlByUrl.has(img.url)) {
        try {
          dataUrlByUrl.set(img.url, await urlToCompressedDataUrl(img.url, maxImagePx, jpegQuality))
        } catch (error) {
          console.warn('Could not embed template image:', error)
        }
      }
    }

    // file/url werden nicht persistiert; das Bild wird beim Laden aus dataUrl
    // rekonstruiert.
    const embeddedImages = images.value.map((img) => {
      const { file: _file, url: _url, ...rest } = img
      return {
        ...rest,
        dataUrl: dataUrlByUrl.get(img.url) ?? '',
      }
    })

    return {
      id: `template-user-${Date.now()}`,
      name,
      description,
      thumbnail,
      category: 'user' as const,
      createdAt: Date.now(),
      collageState: {
        settings: { ...settings.value },
        layout: settings.value.layout,
        images: embeddedImages,
        texts: texts.value.map((txt) => ({ ...txt })),
      },
    }
  }

  function loadFromTemplate(template: { collageState?: TemplateCollageState }) {
    // Snapshot sichern, damit das Anwenden einer Vorlage rückgängig gemacht
    // werden kann (Strg+Z / „Rückgängig"-Toast) und keine Arbeit verloren geht.
    ctx.saveStateForUndo()

    const state = template.collageState ?? {}
    const templateImages = Array.isArray(state.images) ? state.images : []
    const templateTexts = Array.isArray(state.texts) ? state.texts : []
    // Enthält die Vorlage eigene Bilder/Texte (gespeicherte Collage) oder ist
    // sie ein reines Leinwand-Preset (vordefinierte Vorlagen: Größe/Layout/
    // Hintergrund, aber kein Inhalt)?
    const templateHasContent = templateImages.length > 0 || templateTexts.length > 0

    // Lade Template-Einstellungen
    if (template.collageState && template.collageState.settings) {
      const ts = template.collageState.settings

      // Aktualisiere Settings einzeln, um Reaktivität zu erhalten
      settings.value.width = ts.width ?? 700
      settings.value.height = ts.height ?? 740
      settings.value.backgroundColor = ts.backgroundColor ?? '#ffffff'
      settings.value.layout = (ts.layout as LayoutType | undefined) ?? 'freestyle'
      settings.value.gridEnabled = ts.gridEnabled ?? false
      settings.value.gridSize = ts.gridSize ?? 50

      // Canvas-Rahmen mit Defaults
      settings.value.border = {
        enabled: ts.border?.enabled ?? false,
        width: ts.border?.width ?? 12,
        color: ts.border?.color ?? '#000000',
        style: ts.border?.style ?? 'solid',
      }
      settings.value.cornerRadius = ts.cornerRadius ?? 0

      // Hintergrundbild: Werte der Vorlage, fehlende Felder (oder ganz ohne
      // Hintergrundbild) auf Standard. Feldweise, um Reaktivität zu erhalten.
      const bg = ts.backgroundImage ?? {}
      const d = createDefaultBackgroundImage()
      Object.assign(settings.value.backgroundImage, {
        url: bg.url ?? d.url,
        fit: bg.fit ?? d.fit,
        opacity: bg.opacity ?? d.opacity,
        brightness: bg.brightness ?? d.brightness,
        contrast: bg.contrast ?? d.contrast,
        saturation: bg.saturation ?? d.saturation,
        blur: bg.blur ?? d.blur,
      })
    }

    if (templateHasContent) {
      // Vollständige Collage-Vorlage: aktuellen Inhalt durch den der Vorlage
      // ersetzen. Dank des Undo-Snapshots oben ist auch das rückgängig-fähig.
      ctx.selectedImageIds.value = []
      ctx.selectedTextId.value = null
      ctx.isBackgroundSelected.value = false
      images.value = templateImages.map((img) => {
        const { dataUrl, ...rest } = img
        return {
          ...rest,
          // Eingebettete Data-URL als Bildquelle nutzen (überlebt Reload);
          // Fallback auf eine ggf. vorhandene url.
          url: dataUrl || rest.url || '',
          // File-Referenz kann nicht persistiert werden.
          file: rest.file ?? (null as unknown as File),
        }
      }) as CollageImage[]
      texts.value = templateTexts.map((txt: CollageText) => ({ ...txt })) as CollageText[]
    } else {
      // Reines Leinwand-Preset: hochgeladene Bilder und Texte BEHALTEN, damit
      // die Arbeit ohne Verlust weitergeht. Nur das Layout auf die vorhandenen
      // Bilder neu anwenden (skipUndo, Snapshot wurde bereits erstellt).
      ctx.reapplyLayout()
    }
  }

  return { saveAsTemplate, loadFromTemplate }
}
