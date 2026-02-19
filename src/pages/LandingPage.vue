<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()

const heroFeatures = ['layouts', 'editing', 'privacy']

const allFeatures = ['layouts', 'editing', 'text', 'background', 'filters', 'export', 'templates', 'privacy']
</script>

<template>
  <div class="min-h-screen bg-page-gradient overflow-hidden">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob"></div>
      <div class="absolute top-1/2 -left-40 w-96 h-96 bg-warm/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-40 right-1/3 w-72 h-72 bg-accent-light/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md container mx-auto px-4 pt-6">
        <nav class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-slate-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-slate-dark dark:text-surface-light">{{ t('app.title') }}</span>
          </div>

          <!-- Nav Links + Controls -->
          <div class="flex items-center gap-3 sm:gap-6">
            <RouterLink
              to="/faq"
              class="text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.faq') }}
            </RouterLink>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-4 pt-8 pb-8 sm:pt-16 sm:pb-12">
        <div class="text-center max-w-4xl mx-auto mb-8 sm:mb-16">
          <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold text-slate-dark dark:text-surface-light mb-4 sm:mb-6 leading-tight">
            {{ t('landing.hero.title') }}
          </h1>
          <p class="text-base sm:text-lg md:text-xl text-muted dark:text-muted-light mb-6 sm:mb-10 max-w-2xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>

          <!-- CTA Button -->
          <RouterLink
            to="/editor"
            class="group relative inline-flex items-center gap-2 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-slate-dark font-semibold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span>{{ t('landing.cta') }}</span>
            <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </RouterLink>
        </div>

        <!-- Hero Feature Cards Grid (3 Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <div
            v-for="feature in heroFeatures"
            :key="feature"
            class="group relative bg-white dark:bg-navy rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30 backdrop-blur-sm text-center"
          >
            <h3 class="text-xl font-bold text-slate-dark dark:text-surface-light mb-2">
              {{ t(`landing.heroFeatures.${feature}.title`) }}
            </h3>
            <p class="text-muted dark:text-muted-light leading-relaxed">
              {{ t(`landing.heroFeatures.${feature}.description`) }}
            </p>

            <!-- Hover Effect -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </section>

      <!-- All Features Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-slate-dark dark:text-surface-light mb-4">
          {{ t('landing.allFeatures.title') }}
        </h2>
        <p class="text-center text-muted dark:text-muted-light mb-8 sm:mb-12 max-w-2xl mx-auto">
          {{ t('landing.allFeatures.subtitle') }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
          <div
            v-for="feature in allFeatures"
            :key="feature"
            class="group relative bg-white dark:bg-navy rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30 backdrop-blur-sm text-center"
          >
            <h3 class="text-lg font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t(`landing.allFeatures.items.${feature}.title`) }}
            </h3>
            <p class="text-sm text-muted dark:text-muted-light leading-relaxed">
              {{ t(`landing.allFeatures.items.${feature}.description`) }}
            </p>

            <!-- Hover Effect -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20 border-t border-muted/20 dark:border-slate/30">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-slate-dark dark:text-surface-light mb-4">
          {{ t('landing.howItWorks.title') }}
        </h2>
        <p class="text-center text-muted dark:text-muted-light mb-8 sm:mb-12 max-w-2xl mx-auto">
          {{ t('landing.howItWorks.subtitle') }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-2xl font-bold text-slate-dark">1</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t('landing.howItWorks.step1.title') }}
            </h3>
            <p class="text-muted dark:text-muted-light">
              {{ t('landing.howItWorks.step1.description') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-2xl font-bold text-slate-dark">2</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t('landing.howItWorks.step2.title') }}
            </h3>
            <p class="text-muted dark:text-muted-light">
              {{ t('landing.howItWorks.step2.description') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-2xl font-bold text-slate-dark">3</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t('landing.howItWorks.step3.title') }}
            </h3>
            <p class="text-muted dark:text-muted-light">
              {{ t('landing.howItWorks.step3.description') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Bottom CTA -->
      <section class="container mx-auto px-4 py-10 sm:py-16 text-center">
        <div class="max-w-2xl mx-auto bg-gradient-to-br from-slate-dark to-slate dark:from-slate dark:to-slate-light/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl">
          <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-cream mb-4">
            {{ t('landing.bottomCta.title') }}
          </h3>
          <p class="text-cream/70 mb-6 sm:mb-8">
            {{ t('landing.bottomCta.subtitle') }}
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

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  75% {
    transform: translate(30px, 10px) scale(1.05);
  }
}

.animate-blob {
  animation: blob 15s ease-in-out infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
