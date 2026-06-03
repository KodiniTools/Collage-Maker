import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('showToast', () => {
    it('adds a toast to the list', () => {
      const store = useToastStore()
      store.showToast('Hello')
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('Hello')
    })

    it('defaults to info type', () => {
      const store = useToastStore()
      store.showToast('Hello')
      expect(store.toasts[0].type).toBe('info')
    })

    it('returns a unique id', () => {
      const store = useToastStore()
      const id1 = store.showToast('A')
      const id2 = store.showToast('B')
      expect(id1).not.toBe(id2)
    })

    it('auto-removes after duration', () => {
      const store = useToastStore()
      store.showToast('Bye', 'info', 2000)
      expect(store.toasts).toHaveLength(1)
      vi.advanceTimersByTime(2000)
      expect(store.toasts).toHaveLength(0)
    })

    it('does not auto-remove when duration is 0', () => {
      const store = useToastStore()
      store.showToast('Sticky', 'info', 0)
      vi.advanceTimersByTime(10000)
      expect(store.toasts).toHaveLength(1)
    })
  })

  describe('removeToast', () => {
    it('removes a toast by id', () => {
      const store = useToastStore()
      const id = store.showToast('Test', 'info', 0)
      store.removeToast(id)
      expect(store.toasts).toHaveLength(0)
    })

    it('is a no-op for unknown id', () => {
      const store = useToastStore()
      store.showToast('Test', 'info', 0)
      store.removeToast('nonexistent-id')
      expect(store.toasts).toHaveLength(1)
    })
  })

  describe('convenience methods', () => {
    it('success() creates a success toast', () => {
      const store = useToastStore()
      store.success('Done!')
      expect(store.toasts[0].type).toBe('success')
      expect(store.toasts[0].message).toBe('Done!')
    })

    it('error() creates an error toast', () => {
      const store = useToastStore()
      store.error('Oops!')
      expect(store.toasts[0].type).toBe('error')
    })

    it('info() creates an info toast', () => {
      const store = useToastStore()
      store.info('FYI')
      expect(store.toasts[0].type).toBe('info')
    })

    it('multiple toasts stack in order', () => {
      const store = useToastStore()
      store.success('First', 0)
      store.error('Second', 0)
      store.info('Third', 0)
      expect(store.toasts.map((t) => t.message)).toEqual(['First', 'Second', 'Third'])
    })
  })
})
