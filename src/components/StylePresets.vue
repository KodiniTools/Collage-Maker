<script setup lang="ts">
  import { computed } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'

  const collage = useCollageStore()
  const { t } = useI18n()

  // Ein Preset beschreibt einen kompletten Satz an Effekt-Feldern (abgerundete
  // Ecken, Rahmen, Schatten). Der Store setzt beim Anwenden ALLE Felder, damit
  // der Wechsel zwischen Presets deterministisch ist.
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
  >

  interface StylePreset {
    id: string
    labelKey: string
    effects: StyleEffects
  }

  // Basiszustand „ohne Effekte" – dient als Grundlage für jedes Preset, sodass
  // jedes Preset wirklich alle Felder belegt (auch die deaktivierten).
  const NONE: StyleEffects = {
    borderRadius: 0,
    borderEnabled: false,
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'solid',
    shadowEnabled: false,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    shadowBlur: 10,
    shadowColor: '#000000',
    borderShadowEnabled: false,
    borderShadowOffsetX: 3,
    borderShadowOffsetY: 3,
    borderShadowBlur: 6,
    borderShadowColor: '#000000',
  }

  const presets: StylePreset[] = [
    {
      id: 'original',
      labelKey: 'stylePresets.original',
      effects: { ...NONE },
    },
    {
      id: 'rounded',
      labelKey: 'stylePresets.rounded',
      effects: { ...NONE, borderRadius: 28 },
    },
    {
      id: 'circle',
      labelKey: 'stylePresets.circle',
      effects: { ...NONE, borderRadius: 9999 },
    },
    {
      id: 'shadow',
      labelKey: 'stylePresets.shadow',
      effects: {
        ...NONE,
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
        ...NONE,
        borderRadius: 22,
        shadowEnabled: true,
        shadowOffsetX: 0,
        shadowOffsetY: 10,
        shadowBlur: 26,
        shadowColor: '#000000',
      },
    },
    {
      id: 'frameWhite',
      labelKey: 'stylePresets.frameWhite',
      effects: {
        ...NONE,
        borderRadius: 6,
        borderEnabled: true,
        borderWidth: 8,
        borderColor: '#ffffff',
        borderStyle: 'solid',
        borderShadowEnabled: true,
        borderShadowOffsetX: 0,
        borderShadowOffsetY: 6,
        borderShadowBlur: 16,
        borderShadowColor: '#000000',
      },
    },
    {
      id: 'polaroid',
      labelKey: 'stylePresets.polaroid',
      effects: {
        ...NONE,
        borderRadius: 4,
        borderEnabled: true,
        borderWidth: 14,
        borderColor: '#ffffff',
        borderStyle: 'solid',
        borderShadowEnabled: true,
        borderShadowOffsetX: 4,
        borderShadowOffsetY: 6,
        borderShadowBlur: 14,
        borderShadowColor: '#000000',
      },
    },
    {
      id: 'elegant',
      labelKey: 'stylePresets.elegant',
      effects: {
        ...NONE,
        borderRadius: 16,
        borderEnabled: true,
        borderWidth: 3,
        borderColor: '#1f2937',
        borderStyle: 'solid',
        shadowEnabled: true,
        shadowOffsetX: 0,
        shadowOffsetY: 8,
        shadowBlur: 20,
        shadowColor: '#000000',
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
  function previewStyle(effects: StyleEffects): Record<string, string> {
    const style: Record<string, string> = {}

    // Abgerundete Ecken (Kreis = 50 %)
    style.borderRadius = effects.borderRadius >= 9999 ? '50%' : `${effects.borderRadius / 3}px`

    // Rahmen (Breite herunterskaliert)
    if (effects.borderEnabled) {
      const w = Math.max(1, Math.round(effects.borderWidth / 3))
      style.border = `${w}px ${effects.borderStyle} ${effects.borderColor}`
    }

    // Schatten (Bild- oder Rahmenschatten, herunterskaliert)
    if (effects.borderShadowEnabled) {
      style.boxShadow = `${effects.borderShadowOffsetX / 2}px ${effects.borderShadowOffsetY / 2}px ${
        effects.borderShadowBlur / 2
      }px ${effects.borderShadowColor}66`
    } else if (effects.shadowEnabled) {
      style.boxShadow = `${effects.shadowOffsetX / 2}px ${effects.shadowOffsetY / 2}px ${
        effects.shadowBlur / 2
      }px ${effects.shadowColor}66`
    }

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
            class="block w-9 h-9 bg-gradient-to-br from-accent/80 to-accent-dark/80"
            :style="previewStyle(preset.effects)"
          />
        </span>
        <span class="text-xs font-medium text-center leading-tight">{{ t(preset.labelKey) }}</span>
      </button>
    </div>
  </div>
</template>
