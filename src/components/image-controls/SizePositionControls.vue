<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
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
        <span class="text-sm font-medium">{{ t('imageControls.size') }}</span>
        <UiButton
          size="sm"
          :variant="api.collage.lockAspectRatio ? 'primary' : 'secondary'"
          :title="t('imageControls.lockAspectRatio')"
          :aria-pressed="api.collage.lockAspectRatio"
          @click="api.toggleAspectRatio"
        >
          <template #icon>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path
                v-if="api.collage.lockAspectRatio"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </template>
          {{
            api.collage.lockAspectRatio ? t('imageControls.locked') : t('imageControls.unlocked')
          }}
        </UiButton>
      </div>
      <div class="space-y-2">
        <div>
          <label for="image-width" class="text-xs text-ink-2">{{ t('canvas.width') }}</label>
          <input
            id="image-width"
            type="number"
            :value="Math.round(image.width)"
            min="10"
            max="8000"
            class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
            @input="api.updateWidth(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div>
          <label for="image-height" class="text-xs text-ink-2">{{ t('canvas.height') }}</label>
          <input
            id="image-height"
            type="number"
            :value="Math.round(image.height)"
            min="10"
            max="8000"
            class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
            @input="api.updateHeight(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
      <p class="text-xs text-ink-2 mt-1">
        {{ t('imageControls.shiftHint') }}
      </p>
    </div>

    <!-- Position -->
    <div>
      <span class="text-sm font-medium mb-2 block">{{ t('imageControls.position') }}</span>
      <div class="space-y-2">
        <div>
          <label for="image-x" class="text-xs text-ink-2">{{ t('imageControls.positionX') }}</label>
          <input
            id="image-x"
            type="number"
            :value="Math.round(image.x)"
            class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
            @input="api.updatePositionX(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div>
          <label for="image-y" class="text-xs text-ink-2">{{ t('imageControls.positionY') }}</label>
          <input
            id="image-y"
            type="number"
            :value="Math.round(image.y)"
            class="w-full px-3 py-2 border border-line-strong rounded-sm bg-surface-1 text-sm focus-visible:outline-none focus-visible:shadow-focus"
            @input="api.updatePositionY(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>
  </div>
</template>
