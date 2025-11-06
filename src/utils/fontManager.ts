/**
 * Font Manager - Verwaltet benutzerdefinierte Schriftarten
 * Lädt fonts.json und stellt Schriftarten-Informationen bereit
 */

export interface FontFamily {
  name: string
  variants: string[]
  hasItalic?: boolean
  hasVariable?: boolean
}

class FontManager {
  private fonts: Record<string, FontFamily> = {}
  private loading: boolean = false
  private loaded: boolean = false
  private error: Error | null = null

  /**
   * Lädt die fonts.json und fonts.css
   */
  async loadFonts(): Promise<Record<string, FontFamily>> {
    // Bereits geladen
    if (this.loaded) {
      return this.fonts
    }

    // Bereits am Laden
    if (this.loading) {
      return new Promise((resolve, reject) => {
        const checkLoaded = setInterval(() => {
          if (this.loaded) {
            clearInterval(checkLoaded)
            resolve(this.fonts)
          } else if (this.error) {
            clearInterval(checkLoaded)
            reject(this.error)
          }
        }, 100)
      })
    }

    this.loading = true

    try {
      // BASE_URL aus Vite Config
      const basePath = import.meta.env.BASE_URL || '/'
      const fontsJsonUrl = `${basePath}fonts.json`

      console.log('🔍 Loading fonts from:', fontsJsonUrl)

      // fonts.json laden
      const response = await fetch(fontsJsonUrl)

      if (!response.ok) {
        throw new Error(`Failed to load fonts.json: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validierung
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid fonts.json format')
      }

      this.fonts = data
      this.loaded = true
      this.loading = false

      console.log('✅ Fonts loaded successfully:', Object.keys(this.fonts).length, 'families')
      console.log('📝 Font families:', Object.keys(this.fonts).join(', '))

      // fonts.css laden und in DOM einfügen
      await this.loadFontCSS(basePath)

      // WICHTIG: Warten bis alle Fonts vom Browser geladen sind
      await this.waitForFontsReady()

      return this.fonts
    } catch (error) {
      this.error = error as Error
      this.loading = false
      console.error('❌ Failed to load fonts:', error)
      throw error
    }
  }

  /**
   * Lädt fonts.css und fügt es in den DOM ein
   */
  private async loadFontCSS(basePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prüfen, ob fonts.css bereits geladen ist
      const existingLink = document.querySelector('link[href*="fonts.css"]')
      if (existingLink) {
        console.log('ℹ️ fonts.css already loaded')
        resolve()
        return
      }

      // fonts.css Link erstellen
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `${basePath}fonts.css`

      link.onload = () => {
        console.log('✅ fonts.css loaded successfully')
        resolve()
      }

      link.onerror = () => {
        const error = new Error('Failed to load fonts.css')
        console.error('❌ Failed to load fonts.css')
        reject(error)
      }

      // In den DOM einfügen
      document.head.appendChild(link)
    })
  }

  /**
   * Wartet, bis alle Fonts vom Browser geladen sind (Font Loading API)
   */
  private async waitForFontsReady(): Promise<void> {
    try {
      console.log('⏳ Waiting for fonts to be ready...')

      // Font Loading API verwenden
      if ('fonts' in document) {
        await document.fonts.ready
        console.log('✅ All fonts are ready!')

        // Alle geladenen Fonts loggen
        const loadedFonts = Array.from(document.fonts.values())
          .map(font => font.family)
          .filter((family, index, self) => self.indexOf(family) === index)

        console.log('📦 Loaded font families:', loadedFonts.length, 'fonts')
        console.log('   ', loadedFonts.join(', '))
      } else {
        console.warn('⚠️ Font Loading API not supported, using fallback delay')
        // Fallback: Warte 1 Sekunde
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('❌ Error waiting for fonts:', error)
      // Trotzdem weitermachen
    }
  }

  /**
   * Gibt alle verfügbaren Font-Familien zurück
   */
  getFontFamilies(): string[] {
    return Object.keys(this.fonts).sort()
  }

  /**
   * Gibt die Varianten für eine bestimmte Font-Familie zurück
   */
  getFontVariants(family: string): string[] {
    const font = this.fonts[family]
    return font?.variants || []
  }

  /**
   * Prüft, ob eine Font-Familie existiert
   */
  hasFontFamily(family: string): boolean {
    return family in this.fonts
  }

  /**
   * Gibt die Font-Informationen für eine Familie zurück
   */
  getFontInfo(family: string): FontFamily | null {
    return this.fonts[family] || null
  }

  /**
   * Gibt alle Fonts zurück
   */
  getAllFonts(): Record<string, FontFamily> {
    return this.fonts
  }

  /**
   * Gibt den Ladezustand zurück
   */
  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Gibt den Fehler zurück (falls vorhanden)
   */
  getError(): Error | null {
    return this.error
  }
}

// Singleton Instance
const fontManager = new FontManager()

export default fontManager
