<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageToggle from '@/components/LanguageToggle.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import LayoutSelector from '@/components/LayoutSelector.vue'
import GridControls from '@/components/GridControls.vue'
import CanvasSettings from '@/components/CanvasSettings.vue'
import ImageList from '@/components/ImageList.vue'
import TextList from '@/components/TextList.vue'
import CollageCanvas from '@/components/CollageCanvas.vue'
import ImageControls from '@/components/ImageControls.vue'
import TextControls from '@/components/TextControls.vue'
import ExportControls from '@/components/ExportControls.vue'

const settings = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ t('app.title') }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('app.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar -->
        <aside class="lg:col-span-3 space-y-6">
          <ImageUploader />
          <LayoutSelector />
          <GridControls />
          <ImageList />
          <TextList />
        </aside>

        <!-- Canvas -->
        <section class="lg:col-span-6 min-h-[600px]">
          <CollageCanvas />
        </section>

        <!-- Controls -->
        <aside class="lg:col-span-3 space-y-6">
          <CanvasSettings />
          <ImageControls />
          <TextControls />
          <ExportControls />
        </aside>
      </div>
    </main>

    <!-- Donate Section -->
    <section class="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 pb-8">
      <div class="container mx-auto px-4 text-center">
        <form action="https://www.paypal.com/donate" method="post" target="_top" class="inline-block">
          <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
          <input type="image" src="https://www.paypalobjects.com/de_DE/CH/i/btn/btn_donate_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Spenden mit dem PayPal-Button" />
          <img alt="" border="0" src="https://www.paypal.com/de_CH/i/scr/pixel.gif" width="1" height="1" />
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© 2025 kodinitools.com – 100% client-seitige Verarbeitung</p>
      </div>
    </footer>
  </div>
</template>
