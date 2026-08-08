import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Template {
  id: string
  name?: string
  description?: string
  nameKey?: string
  descriptionKey?: string
  thumbnail: string
  category: 'predefined' | 'user'
  createdAt: number
  collageState: {
    settings: {
      width: number
      height: number
      backgroundColor: string
      gridEnabled: boolean
      gridSize: number
    }
    layout: string
    images: any[]
    texts: any[]
  }
}

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<Template[]>([])
  const userTemplates = ref<Template[]>([])

  // Lade vordefinierte Vorlagen
  async function loadPredefinedTemplates() {
    try {
      // Nutze import.meta.env.BASE_URL für korrekten Base-Path
      const basePath = import.meta.env.BASE_URL || '/'
      const url = `${basePath}templates/default-templates.json`
        .replace(/\/+/g, '/')
        .replace(':/', '://')
      console.log('Fetching templates from:', url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Loaded templates:', data)
      templates.value = data.templates || []
      console.log('Templates in store:', templates.value.length)
    } catch (error) {
      console.error('Could not load predefined templates:', error)
      templates.value = []
    }
  }

  // Lade Benutzer-Vorlagen aus LocalStorage
  function loadUserTemplates() {
    try {
      const saved = localStorage.getItem('collage-maker-user-templates')
      if (saved) {
        userTemplates.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Could not load user templates:', error)
      userTemplates.value = []
    }
  }

  // Speichere Benutzer-Vorlagen in LocalStorage.
  // Gibt true zurück, wenn erfolgreich persistiert wurde, sonst false
  // (z. B. wenn die Speicher-Quota überschritten ist).
  function saveUserTemplates(): boolean {
    try {
      localStorage.setItem('collage-maker-user-templates', JSON.stringify(userTemplates.value))
      return true
    } catch (error) {
      console.error('Could not save user templates:', error)
      return false
    }
  }

  // Füge eine Benutzer-Vorlage hinzu. Schlägt das Persistieren fehl (Quota),
  // wird die Vorlage NICHT im Speicher behalten und false zurückgegeben, damit
  // der Aufrufer einen Fallback (kleinere Bilder) versuchen oder einen Fehler
  // anzeigen kann.
  function addUserTemplate(template: Template): boolean {
    userTemplates.value.unshift(template)
    if (!saveUserTemplates()) {
      userTemplates.value.shift()
      return false
    }
    return true
  }

  // Lösche eine Benutzer-Vorlage
  function deleteUserTemplate(id: string) {
    const index = userTemplates.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      userTemplates.value.splice(index, 1)
      saveUserTemplates()
    }
  }

  // Alle Vorlagen (vordefiniert + Benutzer)
  function getAllTemplates(): Template[] {
    return [...templates.value, ...userTemplates.value]
  }

  // Vorlage nach ID finden
  function getTemplateById(id: string): Template | undefined {
    return getAllTemplates().find((t) => t.id === id)
  }

  return {
    templates,
    userTemplates,
    loadPredefinedTemplates,
    loadUserTemplates,
    addUserTemplate,
    deleteUserTemplate,
    getAllTemplates,
    getTemplateById,
  }
})
