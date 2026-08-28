<script setup lang="ts">
  import { computed } from 'vue'
  import { useCollageStore } from '@/stores/collage'
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'

  const collage = useCollageStore()
  const { t } = useI18n()

  // Eine Rahmen-Vorlage belegt NUR die Rahmen-Felder (Border, Rahmenschatten,
  // Eckenradius). Bildschatten und Filter der Zielbilder bleiben erhalten
  // (der Store merged die Felder). So bleibt die Galerie auf „Rahmen" fokussiert.
  type FrameEffects = Pick<
    CollageImage,
    | 'borderEnabled'
    | 'borderWidth'
    | 'borderColor'
    | 'borderStyle'
    | 'borderRadius'
    | 'borderShadowEnabled'
    | 'borderShadowOffsetX'
    | 'borderShadowOffsetY'
    | 'borderShadowBlur'
    | 'borderShadowColor'
  >

  interface FramePreset {
    id: string
    labelKey: string
    effects: FrameEffects
  }

  // Basiszustand „ohne Rahmen" – jede Vorlage belegt darauf aufbauend ALLE
  // Rahmen-Felder, damit der Wechsel zwischen Rahmen deterministisch ist.
  const BASE: FrameEffects = {
    borderEnabled: false,
    borderWidth: 4,
    borderColor: '#ffffff',
    borderStyle: 'solid',
    borderRadius: 0,
    borderShadowEnabled: false,
    borderShadowOffsetX: 0,
    borderShadowOffsetY: 6,
    borderShadowBlur: 16,
    borderShadowColor: '#000000',
  }

  const frames: FramePreset[] = [
    { id: 'none', labelKey: 'frameGallery.none', effects: { ...BASE } },
    {
      id: 'thinBlack',
      labelKey: 'frameGallery.thinBlack',
      effects: { ...BASE, borderEnabled: true, borderWidth: 2, borderColor: '#111111' },
    },
    {
      id: 'thinWhite',
      labelKey: 'frameGallery.thinWhite',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderShadowEnabled: true,
        borderShadowBlur: 12,
      },
    },
    {
      id: 'boldBlack',
      labelKey: 'frameGallery.boldBlack',
      effects: { ...BASE, borderEnabled: true, borderWidth: 10, borderColor: '#0b0b0b' },
    },
    {
      id: 'whiteRounded',
      labelKey: 'frameGallery.whiteRounded',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 6,
        borderColor: '#ffffff',
        borderRadius: 18,
        borderShadowEnabled: true,
        borderShadowOffsetY: 6,
        borderShadowBlur: 16,
      },
    },
    {
      id: 'polaroid',
      labelKey: 'frameGallery.polaroid',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 14,
        borderColor: '#ffffff',
        borderRadius: 4,
        borderShadowEnabled: true,
        borderShadowOffsetX: 4,
        borderShadowOffsetY: 8,
        borderShadowBlur: 16,
      },
    },
    {
      id: 'goldElegant',
      labelKey: 'frameGallery.goldElegant',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 4,
        borderColor: '#c9984d',
        borderRadius: 12,
      },
    },
    {
      id: 'doubleDark',
      labelKey: 'frameGallery.doubleDark',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 6,
        borderColor: '#1f2937',
        borderStyle: 'double',
      },
    },
    {
      id: 'dashed',
      labelKey: 'frameGallery.dashed',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 3,
        borderColor: '#64748b',
        borderStyle: 'dashed',
        borderRadius: 8,
      },
    },
    {
      id: 'shadowFloat',
      labelKey: 'frameGallery.shadowFloat',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 5,
        borderColor: '#ffffff',
        borderRadius: 14,
        borderShadowEnabled: true,
        borderShadowOffsetY: 12,
        borderShadowBlur: 28,
      },
    },
    {
      id: 'thickRounded',
      labelKey: 'frameGallery.thickRounded',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 8,
        borderColor: '#0f172a',
        borderRadius: 26,
      },
    },
    {
      id: 'circle',
      labelKey: 'frameGallery.circle',
      effects: {
        ...BASE,
        borderEnabled: true,
        borderWidth: 6,
        borderColor: '#ffffff',
        borderRadius: 9999,
        borderShadowEnabled: true,
        borderShadowOffsetY: 6,
        borderShadowBlur: 16,
      },
    },
  ]

  const canvasImageCount = computed(
    () => collage.images.filter((img) => img.isGalleryTemplate !== true).length
  )

  const selectedCount = computed(
    () =>
      collage.images.filter(
        (img) => img.isGalleryTemplate !== true && collage.selectedImageIds.includes(img.id)
      ).length
  )

  // CSS-Vorschau der Kachel: bildet den Rahmen auf einem Miniatur-„Foto" nach
  // (Werte für die kleine Vorschau herunterskaliert).
  function previewStyle(effects: FrameEffects): Record<string, string> {
    const style: Record<string, string> = {}
    style.borderRadius = effects.borderRadius >= 9999 ? '50%' : `${effects.borderRadius / 2.5}px`

    if (effects.borderEnabled) {
      const w = Math.max(1, Math.round(effects.borderWidth / 2.5))
      style.border = `${w}px ${effects.borderStyle} ${effects.borderColor}`
    }
    if (effects.borderShadowEnabled) {
      style.boxShadow = `${effects.borderShadowOffsetX / 2}px ${effects.borderShadowOffsetY / 2}px ${
        effects.borderShadowBlur / 2
      }px ${effects.borderShadowColor}59`
    }
    return style
  }

  function applyFrame(frame: FramePreset) {
    if (canvasImageCount.value === 0) return
    collage.applyFrameTemplate(frame.effects)
  }
</script>

<template>
  <div class="w-full">
    <h2 class="text-lg font-semibold mb-1">{{ t('frameGallery.title') }}</h2>
    <p class="text-xs text-muted dark:text-muted-light mb-3">{{ t('frameGallery.subtitle') }}</p>

    <!-- Hinweis: keine Bilder auf der Leinwand -->
    <div
      v-if="canvasImageCount === 0"
      class="mb-3 p-2 bg-muted/10 dark:bg-navy/20 rounded-lg text-xs text-muted dark:text-muted-light"
    >
      {{ t('frameGallery.noImages') }}
    </div>

    <!-- Wirkungsbereich: Auswahl vs. alle Bilder -->
    <div
      v-else
      class="mb-3 p-2 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/30 text-xs"
    >
      <p class="font-medium text-accent-dark dark:text-accent">
        {{
          selectedCount > 0
            ? t('frameGallery.scopeSelected', { count: selectedCount })
            : t('frameGallery.scopeAll', { count: canvasImageCount })
        }}
      </p>
    </div>

    <div
      class="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pr-1"
      role="group"
      :aria-label="t('frameGallery.title')"
    >
      <button
        v-for="frame in frames"
        :key="frame.id"
        type="button"
        :disabled="canvasImageCount === 0"
        class="group flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-muted/50 dark:border-slate hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-muted/50"
        :title="t(frame.labelKey)"
        @click="applyFrame(frame)"
      >
        <!-- Vorschaufeld mit einem Miniatur-„Foto", das den Rahmen zeigt -->
        <span
          class="flex items-center justify-center w-full h-14 rounded-md bg-gradient-to-br from-muted/15 to-muted/5 dark:from-navy/40 dark:to-navy/10"
        >
          <span
            class="block w-10 h-10 bg-gradient-to-br from-slate/70 via-accent/60 to-warm/70"
            :style="previewStyle(frame.effects)"
          />
        </span>
        <span class="text-xs font-medium text-center leading-tight">{{ t(frame.labelKey) }}</span>
      </button>
    </div>
  </div>
</template>
