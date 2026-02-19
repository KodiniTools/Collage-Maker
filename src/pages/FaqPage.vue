<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t, tm } = useI18n()
const openIndex = ref<number | null>(null)

// Hole die FAQ-Fragen aus den Übersetzungen
const faqQuestions = computed(() => {
  const questions = tm('faqPage.questions') as Array<{ question: string; answer: string; category: string }>
  return questions
})

// Kategorisierte FAQs
const categories = computed(() => {
  const cats: Record<string, Array<{ question: string; answer: string; index: number }>> = {}
  faqQuestions.value.forEach((q, index) => {
    const cat = q.category || 'general'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push({ ...q, index })
  })
  return cats
})

function toggleQuestion(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <div class="min-h-screen bg-page-gradient">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 -left-40 w-96 h-96 bg-warm/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md container mx-auto px-4 pt-6">
        <nav class="flex items-center justify-between">
          <!-- Logo -->
          <RouterLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div class="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-slate-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-slate-dark dark:text-surface-light">{{ t('app.title') }}</span>
          </RouterLink>

          <!-- Nav Links + Controls -->
          <div class="flex items-center gap-2 sm:gap-6">
            <RouterLink
              to="/"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.home') }}
            </RouterLink>
            <RouterLink
              to="/editor"
              class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-accent hover:bg-accent-light text-slate-dark font-medium rounded-lg transition-colors"
            >
              {{ t('nav.editor') }}
            </RouterLink>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-4 pt-8 sm:pt-16 pb-8 sm:pb-12 text-center">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-dark dark:text-surface-light mb-4">
          {{ t('faqPage.title') }}
        </h1>
        <p class="text-base sm:text-lg text-muted dark:text-muted-light max-w-2xl mx-auto">
          {{ t('faqPage.subtitle') }}
        </p>
      </section>

      <!-- FAQ Content -->
      <section class="container mx-auto px-4 pb-10 sm:pb-20">
        <div class="max-w-4xl mx-auto">
          <!-- Category Sections -->
          <div v-for="(items, category) in categories" :key="category" class="mb-12">
            <h2 class="text-2xl font-bold text-slate-dark dark:text-surface-light mb-6">
              {{ t(`faqPage.categories.${category}`) }}
            </h2>

            <div class="space-y-4">
              <div
                v-for="item in items"
                :key="item.index"
                class="border border-muted/30 dark:border-slate/50 rounded-xl overflow-hidden bg-white dark:bg-navy backdrop-blur-sm"
              >
                <button
                  @click="toggleQuestion(item.index)"
                  class="w-full px-4 py-3 sm:px-6 sm:py-5 text-left hover:bg-muted/10 dark:hover:bg-navy/30 transition-colors flex items-center justify-between gap-3 sm:gap-4"
                >
                  <span class="font-semibold text-base sm:text-lg text-slate-dark dark:text-white">{{ item.question }}</span>
                  <svg
                    class="w-5 h-5 flex-shrink-0 transition-transform text-slate dark:text-muted-light"
                    :class="{ 'rotate-180': openIndex === item.index }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <transition
                  enter-active-class="transition-[max-height,opacity] duration-200 ease-out"
                  leave-active-class="transition-[max-height,opacity] duration-200 ease-in"
                  enter-from-class="max-h-0 opacity-0"
                  enter-to-class="max-h-96 opacity-100"
                  leave-from-class="max-h-96 opacity-100"
                  leave-to-class="max-h-0 opacity-0"
                >
                  <div v-show="openIndex === item.index" class="overflow-hidden">
                    <div class="px-4 py-3 sm:px-6 sm:py-5 bg-muted/5 dark:bg-navy/20 text-slate-dark dark:text-gray-100 leading-relaxed border-t border-muted/20 dark:border-slate/30 text-sm sm:text-base">
                      {{ item.answer }}
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="container mx-auto px-4 py-10 sm:py-16">
        <div class="max-w-2xl mx-auto bg-gradient-to-br from-slate-dark to-slate dark:from-slate dark:to-slate-light/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl text-center">
          <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-cream mb-4">
            {{ t('faqPage.cta.title') }}
          </h3>
          <p class="text-cream/70 mb-6 sm:mb-8">
            {{ t('faqPage.cta.subtitle') }}
          </p>
          <RouterLink
            to="/editor"
            class="inline-flex items-center gap-2 px-5 py-3 sm:px-8 sm:py-4 bg-accent hover:bg-accent-light text-slate-dark font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ t('landing.cta') }}
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
