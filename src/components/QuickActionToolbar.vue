<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCollageStore } from '@/stores/collage'

  // Floating Quick-Action-Toolbar: erscheint direkt am ausgewählten Bild/Text
  // und bietet die häufigsten Aktionen (Löschen, Drehen, Ebene vor/zurück) an,
  // ohne dass der Nutzer in die Seitenleiste wechseln muss.
  const props = defineProps<{
    canvasEl: HTMLCanvasElement | null
    containerEl: HTMLElement | null
    autoFitScale: number
    panOffset: { x: number; y: number }
  }>()

  const { t } = useI18n()
  const collage = useCollageStore()

  const toolbarRef = ref<HTMLElement | null>(null)
  const toolbarSize = ref({ w: 168, h: 40 })

  // Layout-Änderungen (Scroll/Resize) triggern eine Neuberechnung der Position,
  // da getBoundingClientRect nicht von sich aus reaktiv ist.
  const layoutTick = ref(0)
  function bumpLayout() {
    layoutTick.value++
  }

  // Offscreen-Kontext für die Textvermessung (analog zum Canvas-Renderer).
  let measureCtx: CanvasRenderingContext2D | null = null
  function getMeasureCtx(): CanvasRenderingContext2D | null {
    if (!measureCtx) {
      measureCtx = document.createElement('canvas').getContext('2d')
    }
    return measureCtx
  }

  // Bounding-Box des ausgewählten Objekts in Canvas-Koordinaten.
  function getObjectBox(): { cx: number; top: number; bottom: number } | null {
    const text = collage.selectedText
    if (text) {
      const ctx = getMeasureCtx()
      const lines = text.text.split('\n')
      const lineHeight = text.fontSize * 1.2
      const boxHeight = lines.length * lineHeight
      let boxWidth = text.fontSize * 4 // Fallback, falls kein Kontext verfügbar
      if (ctx) {
        ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px '${text.fontFamily}'`
        ctx.letterSpacing = `${text.letterSpacing}px`
        boxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), 1)
      }
      let offsetX = 0
      if (text.textAlign === 'center') offsetX = -boxWidth / 2
      else if (text.textAlign === 'right') offsetX = -boxWidth
      const cx = text.x + offsetX + boxWidth / 2
      const top = text.y - boxHeight / 2 - 5
      const bottom = text.y + boxHeight / 2 + 5
      return { cx, top, bottom }
    }

    const img = collage.selectedImage
    if (img) {
      return {
        cx: img.x + img.width / 2,
        top: img.y,
        bottom: img.y + img.height,
      }
    }

    return null
  }

  // Sichtbar, wenn genau ein Bild (primär) oder ein Text ausgewählt ist und der
  // Hintergrund nicht selektiert ist.
  const isVisible = computed(
    () => !collage.isBackgroundSelected && (!!collage.selectedTextId || !!collage.selectedImageId)
  )

  const position = computed(() => {
    // Reaktive Abhängigkeiten (Zoom/Pan/Layout/Auswahl-Geometrie).
    void layoutTick.value
    void props.autoFitScale
    void props.panOffset.x
    void props.panOffset.y

    const canvasEl = props.canvasEl
    const containerEl = props.containerEl
    if (!isVisible.value || !canvasEl || !containerEl) return null

    const box = getObjectBox()
    if (!box) return null

    const canvasRect = canvasEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    const scaleX = canvasRect.width / canvasEl.width
    const scaleY = canvasRect.height / canvasEl.height

    const screenCx = canvasRect.left + box.cx * scaleX
    const screenTop = canvasRect.top + box.top * scaleY
    const screenBottom = canvasRect.top + box.bottom * scaleY

    // In Container-relative Koordinaten umrechnen.
    let left = screenCx - containerRect.left
    const objTop = screenTop - containerRect.top
    const objBottom = screenBottom - containerRect.top

    const gap = 10
    const { w, h } = toolbarSize.value

    // Bevorzugt oberhalb des Objekts; sonst darunter.
    let top: number
    let placement: 'top' | 'bottom'
    if (objTop - gap - h >= 4) {
      top = objTop - gap - h
      placement = 'top'
    } else {
      top = objBottom + gap
      placement = 'bottom'
    }

    // Innerhalb des Containers halten.
    const halfW = w / 2
    const minLeft = halfW + 4
    const maxLeft = containerRect.width - halfW - 4
    if (maxLeft > minLeft) {
      left = Math.min(Math.max(left, minLeft), maxLeft)
    }
    const maxTop = containerRect.height - h - 4
    top = Math.min(Math.max(top, 4), Math.max(4, maxTop))

    return { left, top, placement }
  })

  // ── Aktionen ──────────────────────────────────────────────────────────────
  function onDelete() {
    const textId = collage.selectedTextId
    if (textId) {
      collage.removeText(textId)
      return
    }
    const ids = collage.selectedImageIds
    if (ids.length > 1) {
      const count = ids.length
      collage.removeSelectedImages()
      collage.showUndoToast('toast.imagesDeleted', { count })
    } else if (collage.selectedImageId) {
      collage.removeImageWithUndoToast(collage.selectedImageId)
    }
  }

  function onRotate() {
    const textId = collage.selectedTextId
    if (textId) {
      collage.rotateText(textId, 90)
    } else {
      collage.rotateSelectedImages(90)
    }
  }

  function onBringForward() {
    const textId = collage.selectedTextId
    if (textId) {
      collage.bringTextToFront(textId)
    } else {
      collage.bringSelectedToFront()
    }
  }

  function onSendBackward() {
    const textId = collage.selectedTextId
    if (textId) {
      collage.sendTextToBack(textId)
    } else {
      collage.sendSelectedToBack()
    }
  }

  // Toolbar-Größe messen (für die Zentrierung/Klemmung).
  let resizeObserver: ResizeObserver | null = null
  function measureToolbar() {
    if (toolbarRef.value) {
      toolbarSize.value = {
        w: toolbarRef.value.offsetWidth || toolbarSize.value.w,
        h: toolbarRef.value.offsetHeight || toolbarSize.value.h,
      }
    }
  }

  watch(isVisible, (visible) => {
    if (visible) {
      nextTick(() => {
        measureToolbar()
        bumpLayout()
      })
    }
  })

  onMounted(() => {
    window.addEventListener('scroll', bumpLayout, true)
    window.addEventListener('resize', bumpLayout)
    if (props.containerEl && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => bumpLayout())
      resizeObserver.observe(props.containerEl)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', bumpLayout, true)
    window.removeEventListener('resize', bumpLayout)
    resizeObserver?.disconnect()
  })
</script>

<template>
  <Transition name="qat-fade">
    <div
      v-if="position"
      ref="toolbarRef"
      class="quick-action-toolbar absolute z-30 flex items-center gap-0.5 bg-slate-dark/90 dark:bg-surface-darker/95 backdrop-blur-sm text-surface-light rounded-lg shadow-xl px-1 py-1"
      :style="{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translateX(-50%)',
      }"
      role="toolbar"
      :aria-label="t('quickActions.delete')"
      @mousedown.stop
      @touchstart.stop
      @dblclick.stop
    >
      <!-- Nach hinten -->
      <button
        type="button"
        class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors"
        :title="t('quickActions.sendToBack')"
        :aria-label="t('quickActions.sendToBack')"
        @click="onSendBackward"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8l4-4m0 0l4 4m-4-4v12M20 16l-4 4m0 0l-4-4m4 4V8"
          />
        </svg>
      </button>
      <!-- Nach vorne -->
      <button
        type="button"
        class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors"
        :title="t('quickActions.bringToFront')"
        :aria-label="t('quickActions.bringToFront')"
        @click="onBringForward"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4"
          />
        </svg>
      </button>

      <span class="w-px h-5 bg-white/20 mx-0.5" aria-hidden="true"></span>

      <!-- Drehen -->
      <button
        type="button"
        class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors"
        :title="t('quickActions.rotate')"
        :aria-label="t('quickActions.rotate')"
        @click="onRotate"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <span class="w-px h-5 bg-white/20 mx-0.5" aria-hidden="true"></span>

      <!-- Löschen -->
      <button
        type="button"
        class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-500/80 transition-colors"
        :title="t('quickActions.delete')"
        :aria-label="t('quickActions.delete')"
        @click="onDelete"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      <!-- Kleiner Zeiger zum Objekt -->
      <span
        class="qat-arrow"
        :class="position.placement === 'top' ? 'qat-arrow-down' : 'qat-arrow-up'"
        aria-hidden="true"
      ></span>
    </div>
  </Transition>
</template>

<style scoped>
  .qat-fade-enter-active,
  .qat-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .qat-fade-enter-from,
  .qat-fade-leave-to {
    opacity: 0;
  }

  /* Kleiner dreieckiger Zeiger, der zum Objekt weist. */
  .qat-arrow {
    position: absolute;
    left: 50%;
    width: 0;
    height: 0;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }
  .qat-arrow-down {
    top: 100%;
    border-top: 6px solid rgb(20 38 64 / 0.9);
  }
  .qat-arrow-up {
    bottom: 100%;
    border-bottom: 6px solid rgb(20 38 64 / 0.9);
  }
  :global(.dark) .qat-arrow-down {
    border-top-color: var(--qat-dark-bg, rgb(15 23 42 / 0.95));
  }
  :global(.dark) .qat-arrow-up {
    border-bottom-color: var(--qat-dark-bg, rgb(15 23 42 / 0.95));
  }
</style>
