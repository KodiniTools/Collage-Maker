<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { CollageImage } from '@/types'
  import type { ImageControlsApi } from '@/composables/useImageControls'

  const props = defineProps<{ image: CollageImage; api: ImageControlsApi }>()
  const { t } = useI18n()
  const { api } = props
</script>

<template>
  <div class="space-y-4">
    <!-- Größe -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium">{{ t('imageControls.size') }}</label>
        <button
          :class="[
            'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
            api.collage.lockAspectRatio
              ? 'bg-accent/20 text-slate-dark dark:text-accent'
              : 'bg-muted/10 dark:bg-navy/30 text-slate dark:text-muted',
          ]"
          :title="t('imageControls.lockAspectRatio')"
          @click="api.toggleAspectRatio"
        >
          <svg
            v-if="api.collage.lockAspectRatio"
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          <span>{{
            api.collage.lockAspectRatio ? t('imageControls.locked') : t('imageControls.unlocked')
          }}</span>
        </button>
      </div>
      <div class="space-y-2">
        <div>
          <label class="text-xs text-muted">{{ t('canvas.width') }}</label>
          <input
            type="number"
            :value="Math.round(image.width)"
            min="10"
            max="8000"
            class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div>
          <label class="text-xs text-muted">{{ t('canvas.height') }}</label>
          <input
            type="number"
            :value="Math.round(image.height)"
            min="10"
            max="8000"
            class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
      <p class="text-xs text-muted mt-1">
        {{ t('imageControls.shiftHint') }}
      </p>
    </div>

    <!-- Position -->
    <div>
      <label class="text-sm font-medium mb-2 block">{{ t('imageControls.position') }}</label>
      <div class="space-y-2">
        <div>
          <label class="text-xs text-muted">{{ t('imageControls.positionX') }}</label>
          <input
            type="number"
            :value="Math.round(image.x)"
            class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            @input="api.updatePositionX(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div>
          <label class="text-xs text-muted">{{ t('imageControls.positionY') }}</label>
          <input
            type="number"
            :value="Math.round(image.y)"
            class="w-full px-3 py-2 border border-muted/50 dark:border-slate rounded-md bg-surface-light dark:bg-surface-dark"
            @input="api.updatePositionY(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>
  </div>
</template>
