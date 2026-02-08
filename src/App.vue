<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

// Initialize settings store early so theme watcher and
// global nav event listener are active from app start
useSettingsStore()
</script>

<template>
  <RouterView />
</template>
