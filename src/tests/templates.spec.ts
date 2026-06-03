import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTemplatesStore, type Template } from '@/stores/templates'

function makeTemplate(id: string, category: Template['category'] = 'user'): Template {
  return {
    id,
    name: `Template ${id}`,
    thumbnail: 'data:image/png;base64,abc',
    category,
    createdAt: Date.now(),
    collageState: {
      settings: { width: 700, height: 740, backgroundColor: '#fff', gridEnabled: false, gridSize: 50 },
      layout: 'freestyle',
      images: [],
      texts: [],
    },
  }
}

describe('useTemplatesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('addUserTemplate', () => {
    it('adds a template and persists to localStorage', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('t1'))
      expect(store.userTemplates).toHaveLength(1)
      expect(store.userTemplates[0].id).toBe('t1')
      const saved = JSON.parse(localStorage.getItem('collage-maker-user-templates')!)
      expect(saved).toHaveLength(1)
    })

    it('prepends new templates (newest first)', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('t1'))
      store.addUserTemplate(makeTemplate('t2'))
      expect(store.userTemplates[0].id).toBe('t2')
      expect(store.userTemplates[1].id).toBe('t1')
    })
  })

  describe('deleteUserTemplate', () => {
    it('removes template by id', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('t1'))
      store.addUserTemplate(makeTemplate('t2'))
      store.deleteUserTemplate('t1')
      expect(store.userTemplates).toHaveLength(1)
      expect(store.userTemplates[0].id).toBe('t2')
    })

    it('persists deletion to localStorage', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('t1'))
      store.deleteUserTemplate('t1')
      const saved = JSON.parse(localStorage.getItem('collage-maker-user-templates')!)
      expect(saved).toHaveLength(0)
    })

    it('is a no-op for unknown id', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('t1'))
      store.deleteUserTemplate('nonexistent')
      expect(store.userTemplates).toHaveLength(1)
    })
  })

  describe('loadUserTemplates', () => {
    it('loads persisted templates from localStorage', () => {
      localStorage.setItem(
        'collage-maker-user-templates',
        JSON.stringify([makeTemplate('t-persisted')])
      )
      const store = useTemplatesStore()
      store.loadUserTemplates()
      expect(store.userTemplates).toHaveLength(1)
      expect(store.userTemplates[0].id).toBe('t-persisted')
    })

    it('handles corrupt localStorage gracefully', () => {
      localStorage.setItem('collage-maker-user-templates', 'not-valid-json{{{')
      const store = useTemplatesStore()
      store.loadUserTemplates()
      expect(store.userTemplates).toHaveLength(0)
    })
  })

  describe('getAllTemplates', () => {
    it('returns predefined + user templates combined', () => {
      const store = useTemplatesStore()
      // Simulate predefined templates already loaded
      store.templates.push(makeTemplate('predefined-1', 'predefined'))
      store.addUserTemplate(makeTemplate('user-1'))
      const all = store.getAllTemplates()
      expect(all).toHaveLength(2)
    })
  })

  describe('getTemplateById', () => {
    it('finds a user template by id', () => {
      const store = useTemplatesStore()
      store.addUserTemplate(makeTemplate('find-me'))
      expect(store.getTemplateById('find-me')?.id).toBe('find-me')
    })

    it('returns undefined for unknown id', () => {
      const store = useTemplatesStore()
      expect(store.getTemplateById('ghost')).toBeUndefined()
    })
  })

  describe('loadPredefinedTemplates', () => {
    it('populates templates on successful fetch', async () => {
      const mockData = {
        templates: [makeTemplate('p1', 'predefined'), makeTemplate('p2', 'predefined')],
      }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const store = useTemplatesStore()
      await store.loadPredefinedTemplates()
      expect(store.templates).toHaveLength(2)
    })

    it('sets templates to empty array on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
      const store = useTemplatesStore()
      await store.loadPredefinedTemplates()
      expect(store.templates).toHaveLength(0)
    })

    it('sets templates to empty array on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const store = useTemplatesStore()
      await store.loadPredefinedTemplates()
      expect(store.templates).toHaveLength(0)
    })
  })
})
