import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { useCollageStore } from '@/stores/collage'

export function useCanvasPan(container: Ref<HTMLDivElement | null>) {
  const collage = useCollageStore()
  const containerSize = ref({ width: 0, height: 0 })
  const panOffset = ref({ x: 0, y: 0 })
  const spacePressed = ref(false)

  // Calculate auto-fit scale to keep canvas fully visible
  const autoFitScale = computed(() => {
    if (containerSize.value.width === 0 || containerSize.value.height === 0) {
      return 1
    }

    const padding = 32 // 16px padding on each side
    const availableWidth = containerSize.value.width - padding
    const availableHeight = containerSize.value.height - padding

    const canvasWidth = collage.settings.width
    const canvasHeight = collage.settings.height

    const scaleX = availableWidth / canvasWidth
    const scaleY = availableHeight / canvasHeight

    // Use the smaller scale to ensure canvas fits completely
    // Apply user zoom on top of auto-fit
    return Math.min(scaleX, scaleY, 1) * collage.canvasZoom
  })

  // Update container size on mount and resize
  function updateContainerSize() {
    if (container.value) {
      containerSize.value = {
        width: container.value.clientWidth,
        height: container.value.clientHeight,
      }
    }
  }

  let resizeObserver: ResizeObserver | null = null

  // Reset pan when zoom changes to 1 or less
  watch(
    () => collage.canvasZoom,
    (newZoom) => {
      if (newZoom <= 1) {
        panOffset.value = { x: 0, y: 0 }
      }
    }
  )

  // Keyboard event handlers for panning
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    const isTextInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (e.code === 'Space' && !spacePressed.value && !isTextInput) {
      spacePressed.value = true
      e.preventDefault()
    }

    // Arrow key panning when zoomed in
    if (collage.canvasZoom > 1 && !isTextInput) {
      const panStep = e.shiftKey ? 50 : 10
      switch (e.code) {
        case 'ArrowLeft':
          panOffset.value.x += panStep
          e.preventDefault()
          break
        case 'ArrowRight':
          panOffset.value.x -= panStep
          e.preventDefault()
          break
        case 'ArrowUp':
          panOffset.value.y += panStep
          e.preventDefault()
          break
        case 'ArrowDown':
          panOffset.value.y -= panStep
          e.preventDefault()
          break
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      spacePressed.value = false
    }
  }

  onMounted(() => {
    updateContainerSize()

    // Watch for container resize
    if (container.value) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerSize()
      })
      resizeObserver.observe(container.value)
    }

    // Add keyboard listeners for panning
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return { autoFitScale, panOffset, spacePressed }
}
