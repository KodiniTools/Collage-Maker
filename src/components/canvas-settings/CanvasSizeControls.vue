<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CanvasSettingsApi } from '@/composables/useCanvasSettings'

  const props = defineProps<{ api: CanvasSettingsApi }>()
  const { t } = useI18n()
  const { api } = props
  const { collage } = api
</script>

<template>
  <div class="space-y-4">
    <!-- Seitenverhältnis beibehalten -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">{{ t('canvas.keepAspectRatio') }}</label>
      <button
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
          api.keepAspect.value
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        :title="t('canvas.keepAspectRatio')"
        :aria-pressed="api.keepAspect.value"
        @click="api.toggleKeepAspect"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            v-if="api.keepAspect.value"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
        {{ api.keepAspect.value ? t('canvas.on') : t('canvas.off') }}
      </button>
    </div>

    <!-- Inhalte mitskalieren -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">{{ t('canvas.scaleContent') }}</label>
      <button
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
          api.scaleContent.value
            ? 'bg-accent hover:bg-accent-dark text-slate-dark'
            : 'bg-muted/20 dark:bg-navy/50 hover:bg-muted/30 dark:hover:bg-navy/70 text-slate dark:text-muted',
        ]"
        :title="t('canvas.scaleContent')"
        :aria-pressed="api.scaleContent.value"
        @click="api.toggleScaleContent"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        {{ api.scaleContent.value ? t('canvas.on') : t('canvas.off') }}
      </button>
    </div>

    <!-- Canvas Width -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium">
          {{ t('canvas.width') }}: {{ collage.settings.width }}px
        </label>
        <button
          v-if="collage.settings.width !== api.DEFAULT_WIDTH"
          class="text-xs text-muted hover:text-accent transition-colors"
          :title="t('imageControls.resetValue')"
          @click="api.resetWidth"
        >
          ↺
        </button>
      </div>
      <input
        type="number"
        :value="collage.settings.width"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="1"
        class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
        @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
      />
      <input
        type="range"
        :value="collage.settings.width"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="10"
        class="w-full mt-2"
        :aria-label="t('canvas.width')"
        @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Canvas Height -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium">
          {{ t('canvas.height') }}: {{ collage.settings.height }}px
        </label>
        <button
          v-if="collage.settings.height !== api.DEFAULT_HEIGHT"
          class="text-xs text-muted hover:text-accent transition-colors"
          :title="t('imageControls.resetValue')"
          @click="api.resetHeight"
        >
          ↺
        </button>
      </div>
      <input
        type="number"
        :value="collage.settings.height"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="1"
        class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
        @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
      />
      <input
        type="range"
        :value="collage.settings.height"
        :min="api.MIN_SIZE"
        :max="api.MAX_SIZE"
        step="10"
        class="w-full mt-2"
        :aria-label="t('canvas.height')"
        @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Warnung bei sehr großer Leinwand (Mobile-Export-Limit) -->
    <p
      v-if="api.showLargeSizeWarning.value"
      class="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
    >
      <svg
        class="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
        />
      </svg>
      <span>{{ t('canvas.largeSizeWarning') }}</span>
    </p>
  </div>
</template>
