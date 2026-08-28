import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

describe('useToastStore', () => {
  beforeEach(() => {
    localStorage.clear()
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

  describe('notify + dismissForever', () => {
    it('notify() sets a dismissKey on the toast', () => {
      const store = useToastStore()
      store.notify('key.a', 'Message A')
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].dismissKey).toBe('key.a')
    })

    it('dismissForever() suppresses future notifications with that key', () => {
      const store = useToastStore()
      store.dismissForever('key.a')
      const id = store.notify('key.a', 'Message A')
      expect(id).toBeNull()
      expect(store.toasts).toHaveLength(0)
    })

    it('dismissForever() removes active toasts with that key', () => {
      const store = useToastStore()
      store.notify('key.a', 'A', 'info', 0)
      store.notify('key.b', 'B', 'info', 0)
      store.dismissForever('key.a')
      expect(store.toasts.map((t) => t.message)).toEqual(['B'])
    })

    it('does not affect other keys', () => {
      const store = useToastStore()
      store.dismissForever('key.a')
      store.notify('key.b', 'B')
      expect(store.toasts).toHaveLength(1)
    })

    it('persists dismissed keys to localStorage', () => {
      const store = useToastStore()
      store.dismissForever('key.a')
      const raw = localStorage.getItem('collage-maker-dismissed-toasts')
      expect(JSON.parse(raw as string)).toContain('key.a')
    })

    it('loads dismissed keys from localStorage on init', () => {
      localStorage.setItem('collage-maker-dismissed-toasts', JSON.stringify(['key.a']))
      setActivePinia(createPinia())
      const store = useToastStore()
      expect(store.isDismissed('key.a')).toBe(true)
      expect(store.notify('key.a', 'A')).toBeNull()
    })

    it('resetDismissed() re-enables all notifications', () => {
      const store = useToastStore()
      store.dismissForever('key.a')
      store.resetDismissed()
      expect(store.isDismissed('key.a')).toBe(false)
      expect(store.notify('key.a', 'A')).not.toBeNull()
    })
  })
})
