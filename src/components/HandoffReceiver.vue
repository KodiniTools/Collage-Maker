<!--
  HandoffReceiver.vue – Portable receiver banner for KodiniTools cross-tool handoff.

  INTEGRATION GUIDE (for other KodiniTools):
  ==========================================
  1. Copy this file + /src/lib/core/handoff.ts into your project
  2. Add the i18n keys from the `handoff` section (see locale files)
  3. Mount this component in your app's main page:

     <HandoffReceiver @accept="handleHandoffAccept" />

  4. Implement the accept handler to import images into your tool's store:

     function handleHandoffAccept(images: HandoffImage[]) {
       for (const img of images) {
         const canvas = await handoffImageToCanvas(img)
         // Add canvas to your tool's image store
       }
     }
-->
<template>
  <Transition name="handoff-banner">
    <div v-if="handoff" class="handoff-banner">
      <div class="handoff-inner">
        <div class="handoff-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>

        <div class="handoff-text">
          <strong>{{ t('handoff.title', { count: handoff.images.length }) }}</strong>
          <span class="handoff-source">{{ t('handoff.from', { tool: sourceLabel }) }}</span>
        </div>

        <div class="handoff-thumbs">
          <div v-for="(img, i) in previewImages" :key="i" class="handoff-thumb">
            <img :src="img.dataUrl" :alt="img.name" />
          </div>
          <span v-if="handoff.images.length > 4" class="handoff-more">
            +{{ handoff.images.length - 4 }}
          </span>
        </div>

        <div class="handoff-actions">
          <UiButton variant="primary" size="sm" @click="handleAccept">
            {{ t('handoff.accept') }}
          </UiButton>
          <UiButton variant="ghost" size="sm" @click="handleDismiss">
            {{ t('handoff.dismiss') }}
          </UiButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import {
    checkHandoff,
    consumeHandoff,
    dismissHandoff,
    type HandoffPayload,
    type HandoffImage,
  } from '@/lib/core/handoff'

  const { t } = useI18n()

  const handoff = ref<HandoffPayload | null>(null)

  const emit = defineEmits<{
    accept: [images: HandoffImage[]]
  }>()

  const SOURCE_LABELS: Record<string, string> = {
    'bilder-batchbearbeitung': 'Bilder-Batchbearbeitung',
    bildkonverter: 'Bildkonverter',
    collagemaker: 'Collage Maker',
    'color-extractor': 'Color Extractor',
  }

  const sourceLabel = computed(() =>
    handoff.value ? SOURCE_LABELS[handoff.value.source] || handoff.value.source : ''
  )

  const previewImages = computed(() => (handoff.value ? handoff.value.images.slice(0, 4) : []))

  function handleAccept() {
    const images = consumeHandoff()
    if (images) {
      emit('accept', images)
    }
    handoff.value = null
  }

  function handleDismiss() {
    dismissHandoff()
    handoff.value = null
  }

  onMounted(() => {
    handoff.value = checkHandoff()
  })
</script>

<style scoped>
  .handoff-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--ds-z-dialog);
    padding: var(--ds-space-2) var(--ds-space-3);
    background: var(--ds-surface-1);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
    box-shadow: var(--ds-shadow-overlay);
  }

  .handoff-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: var(--ds-space-3);
    flex-wrap: wrap;
  }

  .handoff-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--ds-radius-md);
    background: var(--ds-accent-soft);
    color: var(--ds-accent);
    flex-shrink: 0;
  }

  .handoff-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .handoff-text strong {
    font-size: 0.9rem;
    color: var(--ds-text);
  }

  .handoff-source {
    font-size: 0.8rem;
    color: var(--ds-text-2);
  }

  .handoff-thumbs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .handoff-thumb {
    width: 36px;
    height: 36px;
    border-radius: var(--ds-radius-sm);
    overflow: hidden;
    border: var(--ds-border-width) solid var(--ds-border);
  }

  .handoff-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .handoff-more {
    font-size: 0.8rem;
    color: var(--ds-text-2);
    font-weight: 600;
    padding-left: 4px;
  }

  .handoff-actions {
    display: flex;
    gap: var(--ds-space-2);
    flex-shrink: 0;
  }

  /* Transition */
  .handoff-banner-enter-active {
    transition:
      transform var(--ds-duration-slow) var(--ds-ease),
      opacity var(--ds-duration-slow) var(--ds-ease);
  }

  .handoff-banner-leave-active {
    transition:
      transform var(--ds-duration-slow) var(--ds-ease),
      opacity var(--ds-duration-slow) var(--ds-ease);
  }

  .handoff-banner-enter-from {
    transform: translateY(-100%);
    opacity: 0;
  }

  .handoff-banner-leave-to {
    transform: translateY(-100%);
    opacity: 0;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .handoff-inner {
      gap: var(--ds-space-2);
    }

    .handoff-thumbs {
      display: none;
    }

    .handoff-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
