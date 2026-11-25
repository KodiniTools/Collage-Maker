<script setup lang="ts">
  /**
   * Gemeinsame Navigation aller Seiten. RouterLink markiert die aktuelle Seite mit
   * aria-current="page". Der Theme-Schalter ist nur ohne globale SSI-Navigation sichtbar.
   */
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { useSettingsStore } from '@/stores/settings'
  import './collage-header.css'

  const { t } = useI18n()
  const settings = useSettingsStore()

  const links = [
    { to: '/', label: 'home' },
    { to: '/blog', label: 'guide' },
    { to: '/artikel', label: 'blog' },
    { to: '/faq', label: 'faq' },
    { to: '/editor', label: 'editor' },
  ] as const
</script>

<template>
  <div class="collage-header">
    <div class="collage-shell collage-header-row">
      <span class="collage-header-title">Collage Maker</span>
      <nav class="collage-header-links" :aria-label="t('nav.label')">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="{ 'collage-editor-link': link.label === 'editor' }"
        >
          {{ t(`nav.${link.label}`) }}
        </RouterLink>
      </nav>
      <button type="button" class="collage-theme-toggle" @click="settings.toggleTheme">
        {{ t(settings.theme === 'dark' ? 'nav.switchToLight' : 'nav.switchToDark') }}
      </button>
    </div>
  </div>
</template>
