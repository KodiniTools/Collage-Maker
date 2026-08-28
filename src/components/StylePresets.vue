<script setup lang="ts">
  import { computed } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'

  const collage = useCollageStore()
  const { t } = useI18n()

  // Ein Preset belegt entweder die GEOMETRIE-Domäne (Ecken/Schatten) ODER die
  // FILTER-Domäne (Bildlooks). Beide sind orthogonal: ein Filter-Look und ein
  // Geometrie-Look lassen sich kombinieren, ohne einander zurückzusetzen. Nur
  // „Original" setzt beides zurück.
  // Hinweis: Rahmen (Border) liegen bewusst NICHT hier, sondern in der eigenen
  // Sektion „Bildrahmen Vorlagen".
  type StyleEffects = Pick<
    CollageImage,
    | 'borderRadius'
    | 'borderEnabled'
    | 'borderWidth'
    | 'borderColor'
    | 'borderStyle'
    | 'shadowEnabled'
    | 'shadowOffsetX'
    | 'shadowOffsetY'
    | 'shadowBlur'
    | 'shadowColor'
    | 'borderShadowEnabled'
    | 'borderShadowOffsetX'
    | 'borderShadowOffsetY'
    | 'borderShadowBlur'
    | 'borderShadowColor'
    | 'brightness'
    | 'contrast'
    | 'highlights'
    | 'shadows'
    | 'saturation'
    | 'warmth'
    | 'sharpness'
  >

  interface StylePreset {
    id: string
    labelKey: string
    effects: Partial<StyleEffects>
  }

  // Geometrie/Schatten-Domäne neutral (Rahmen bleibt aus). Jedes Geometrie-
  // Preset belegt diese Felder vollständig → deterministischer Wechsel.
  const GEOMETRY_NONE: Partial<StyleEffects> = {
    borderRadius: 0,
    borderEnabled: false,
    shadowEnabled: false,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    shadowBlur: 10,
    shadowColor: '#000000',
    borderShadowEnabled: false,
  }

  // Filter-Domäne neutral. Jedes Filter-Preset belegt diese Felder vollständig.
  const FILTER_NONE: Partial<StyleEffects> = {
    brightness: 100,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    warmth: 0,
    sharpness: 0,
  }

  const presets: StylePreset[] = [
    // „Original" setzt BEIDE Domänen zurück.
    {
      id: 'original',
      labelKey: 'stylePresets.original',
      effects: { ...GEOMETRY_NONE, ...FILTER_NONE },
    },
    // Geometrie-Looks
    {
      id: 'rounded',
      labelKey: 'stylePresets.rounded',
      effects: { ...GEOMETRY_NONE, borderRadius: 28 },
    },
    {
      id: 'circle',
      labelKey: 'stylePresets.circle',
      effects: { ...GEOMETRY_NONE, borderRadius: 9999 },
    },
    {
      id: 'shadow',
      labelKey: 'stylePresets.shadow',
      effects: {
        ...GEOMETRY_NONE,
        shadowEnabled: true,
        shadowOffsetX: 0,
        shadowOffsetY: 12,
        shadowBlur: 24,
        shadowColor: '#000000',
      },
    },
    {
      id: 'softCard',
      labelKey: 'stylePresets.softCard',
      effects: {
        ...GEOMETRY_NONE,
        borderRadius: 22,
        shadowEnabled: true,
        shadowOffsetX: 0,
        shadowOffsetY: 10,
        shadowBlur: 26,
        shadowColor: '#000000',
      },
    },
    // Filter-Looks (kombinierbar mit den Geometrie-Looks)
    {
      id: 'vintage',
      labelKey: 'stylePresets.vintage',
      effects: {
        ...FILTER_NONE,
        brightness: 104,
        contrast: 108,
        saturation: 62,
        warmth: 38,
        highlights: -10,
      },
    },
    {
      id: 'blackWhite',
      labelKey: 'stylePresets.blackWhite',
      effects: {
        ...FILTER_NONE,
        saturation: 0,
        contrast: 112,
        brightness: 102,
      },
    },
    {
      id: 'vivid',
      labelKey: 'stylePresets.vivid',
      effects: {
        ...FILTER_NONE,
        saturation: 148,
        contrast: 116,
        brightness: 103,
        sharpness: 20,
      },
    },
  ]

  // Anzahl der Canvas-Bilder (ohne Galerie-Templates)
  const canvasImageCount = computed(
    () => collage.images.filter((img) => img.isGalleryTemplate !== true).length
  )

  // Anzahl ausgewählter Canvas-Bilder (bestimmt den Wirkungsbereich)
  const selectedCount = computed(
    () =>
      collage.images.filter(
        (img) => img.isGalleryTemplate !== true && collage.selectedImageIds.includes(img.id)
      ).length
  )

  // Erzeugt eine CSS-Vorschau der Kachel, die den Preset-Effekt nachahmt.
  // Die Canvas-Werte werden für die kleine Vorschau herunterskaliert.
  function previewStyle(effects: Partial<StyleEffects>): Record<string, string> {
    const style: Record<string, string> = {}

    // Abgerundete Ecken (Kreis = 50 %)
    const radius = effects.borderRadius ?? 0
    style.borderRadius = radius >= 9999 ? '50%' : `${radius / 3}px`

    // Bild- bzw. Rahmenschatten (herunterskaliert)
    if (effects.shadowEnabled) {
      style.boxShadow = `${(effects.shadowOffsetX ?? 0) / 2}px ${(effects.shadowOffsetY ?? 0) / 2}px ${
        (effects.shadowBlur ?? 0) / 2
      }px ${effects.shadowColor ?? '#000000'}66`
    }

    // Bildfilter als CSS-Filter für die Vorschau annähern.
    const brightness = effects.brightness ?? 100
    const contrast = effects.contrast ?? 100
    const saturation = effects.saturation ?? 100
    const warmth = effects.warmth ?? 0
    const filters: string[] = []
    if (brightness !== 100) filters.push(`brightness(${brightness / 100})`)
    if (contrast !== 100) filters.push(`contrast(${contrast / 100})`)
    if (saturation !== 100) filters.push(`saturate(${saturation / 100})`)
    if (warmth > 0) filters.push(`sepia(${Math.min(1, warmth / 100)})`)
    if (filters.length > 0) style.filter = filters.join(' ')

    return style
  }

  function applyPreset(preset: StylePreset) {
    if (canvasImageCount.value === 0) return
    collage.applyStylePreset(preset.effects)
  }
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-1">{{ t('stylePresets.title') }}</h2>
    <p class="text-xs text-muted dark:text-muted-light mb-3">{{ t('stylePresets.subtitle') }}</p>

    <!-- Hinweis: keine Bilder auf der Leinwand -->
    <div
      v-if="canvasImageCount === 0"
      class="mb-3 p-2 bg-muted/10 dark:bg-navy/20 rounded-lg text-xs text-muted dark:text-muted-light"
    >
      {{ t('stylePresets.noImages') }}
    </div>

    <!-- Wirkungsbereich: Auswahl vs. alle Bilder -->
    <div
      v-else
      class="mb-3 p-2 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/30 text-xs"
    >
      <p class="font-medium text-accent-dark dark:text-accent">
        {{
          selectedCount > 0
            ? t('stylePresets.scopeSelected', { count: selectedCount })
            : t('stylePresets.scopeAll', { count: canvasImageCount })
        }}
      </p>
    </div>

    <div
      class="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pr-1"
      role="group"
      :aria-label="t('stylePresets.title')"
    >
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        :disabled="canvasImageCount === 0"
        class="group flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-muted/50 dark:border-slate hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-muted/50"
        :title="t(preset.labelKey)"
        @click="applyPreset(preset)"
      >
        <!-- Vorschaufeld mit einem Miniatur-„Bild", das den Effekt zeigt -->
        <span
          class="flex items-center justify-center w-full h-12 rounded-md bg-gradient-to-br from-muted/20 to-muted/5 dark:from-navy/40 dark:to-navy/10"
        >
          <span
            class="block w-9 h-9 bg-gradient-to-br from-sky-400 via-amber-300 to-rose-400"
            :style="previewStyle(preset.effects)"
          />
        </span>
        <span class="text-xs font-medium text-center leading-tight">{{ t(preset.labelKey) }}</span>
      </button>
    </div>
  </div>
</template>
