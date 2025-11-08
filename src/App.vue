<script setup lang="ts">
import { ref } from 'vue'
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
import TemplateLibrary from '@/components/TemplateLibrary.vue'
import FaqSection from '@/components/FaqSection.vue'

const { t } = useI18n()
const showTemplates = ref(false)
</script>

<template>
  <div>
    <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <!-- Header -->
      <header class="border-b border-gray-200 dark:border-gray-800">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ t('app.title') }}</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('app.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="showTemplates = true"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              <span class="hidden sm:inline">{{ t('templates.library') }}</span>
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sidebar -->
          <aside class="lg:col-span-3 space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2">
            <ImageUploader />
            <LayoutSelector />
            <GridControls />
            <ImageList />
            <TextList />
          </aside>

          <!-- Canvas -->
          <section class="lg:col-span-6 lg:sticky lg:top-6 lg:self-start" style="height: fit-content;">
            <CollageCanvas />
          </section>

          <!-- Controls -->
          <aside class="lg:col-span-3 space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pl-2">
            <CanvasSettings />
            <ImageControls />
            <TextControls />
            <ExportControls />
          </aside>
        </div>
      </main>
    </div>

    <!-- Donate Section -->
    <section class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8">
      <div class="container mx-auto px-4 text-center">
        <form action="https://www.paypal.com/donate" method="post" target="_top" class="inline-block">
          <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
          <button type="submit" class="px-8 py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H8.032c-.3 0-.54-.266-.475-.558l1.918-12.157-.002-.01.162-1.026a.805.805 0 0 1 .794-.68h2.535c3.238 0 5.774-1.314 6.514-5.12.132-.68.168-1.32.112-1.918a4.695 4.695 0 0 0-.544-1.736C20.183 3.505 21.538 5.978 20.067 8.478z"/>
              <path d="M18.814 1.444c-.3-.354-.664-.64-1.08-.854C16.714.09 15.483 0 13.953 0H7.95a.804.804 0 0 0-.794.68L4.97 16.806c-.07.448.26.85.715.85h5.214l1.31-8.307-.04.257a.805.805 0 0 1 .794-.68h1.656c3.238 0 5.774-1.314 6.514-5.12.13-.68.168-1.32.112-1.918-.056-.448-.172-.863-.344-1.236a4.647 4.647 0 0 0-.087-.208z"/>
            </svg>
            <span>Spenden mit PayPal</span>
          </button>
        </form>
      </div>
    </section>

    <!-- FAQ Section -->
    <div class="bg-white dark:bg-gray-900">
      <FaqSection />
    </div>

    <!-- Template Library Modal -->
    <TemplateLibrary v-model:isOpen="showTemplates" />
  </div>
</template>
