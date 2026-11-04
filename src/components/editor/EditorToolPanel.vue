<script setup lang="ts">
  /** Kontext-Panel links: zeigt nur das aktive Werkzeug. */
  import ImageUploader from '@/components/ImageUploader.vue'
  import LayoutSelector from '@/components/LayoutSelector.vue'
  import StylePresets from '@/components/StylePresets.vue'
  import FrameGallery from '@/components/FrameGallery.vue'
  import ImageList from '@/components/ImageList.vue'
  import type { ToolTab } from '@/composables/useEditorLayout'

  defineProps<{ activeTool: ToolTab }>()
</script>

<template>
  <aside
    v-if="activeTool"
    class="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:self-start lg:max-h-[calc(100vh-8rem)] overflow-y-auto"
  >
    <ImageUploader v-if="activeTool === 'upload'" />
    <LayoutSelector v-else-if="activeTool === 'layouts'" />
    <StylePresets v-else-if="activeTool === 'effects'" />
    <FrameGallery v-else-if="activeTool === 'frames'" />
    <ImageList v-else-if="activeTool === 'images'" />
  </aside>
</template>
