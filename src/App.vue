<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { useSettingsStore } from '@/stores/settings'
  import { useSeo } from '@/composables/useSeo'

  // Initialize settings store early so theme watcher and
  // global nav event listener are active from app start
  useSettingsStore()

  // SEO-Tags (Titel/Description/OG) an Route und Sprache koppeln
  useSeo()
</script>

<template>
  <RouterView />
  <div id="modal-portal"></div>
</template>
