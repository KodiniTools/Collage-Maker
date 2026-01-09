<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageToggle from '@/components/LanguageToggle.vue'

const { t } = useI18n()

const heroFeatures = [
  {
    key: 'layouts',
    icon: 'grid',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    key: 'editing',
    icon: 'sliders',
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    key: 'privacy',
    icon: 'shield',
    gradient: 'from-emerald-500 to-teal-600'
  }
]

const allFeatures = [
  {
    key: 'layouts',
    icon: 'grid',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    key: 'editing',
    icon: 'sliders',
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    key: 'text',
    icon: 'type',
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    key: 'background',
    icon: 'layers',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    key: 'filters',
    icon: 'sparkles',
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    key: 'export',
    icon: 'download',
    gradient: 'from-teal-500 to-green-600'
  },
  {
    key: 'templates',
    icon: 'template',
    gradient: 'from-fuchsia-500 to-pink-600'
  },
  {
    key: 'privacy',
    icon: 'shield',
    gradient: 'from-emerald-500 to-teal-600'
  }
]
</script>

<template>
  <div class="min-h-screen bg-surface-light dark:bg-surface-dark overflow-hidden">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob"></div>
      <div class="absolute top-1/2 -left-40 w-96 h-96 bg-warm/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-40 right-1/3 w-72 h-72 bg-accent-light/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="container mx-auto px-4 pt-6">
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
          <div class="flex items-center gap-6">
            <RouterLink
              to="/faq"
              class="text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.faq') }}
            </RouterLink>
            <div class="flex items-center gap-2 bg-surface-light/90 dark:bg-slate-dark/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-muted/20 dark:border-muted/30">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-4 pt-16 pb-12">
        <div class="text-center max-w-4xl mx-auto mb-16">
          <h1 class="text-4xl md:text-6xl font-bold text-slate-dark dark:text-surface-light mb-6 leading-tight">
            {{ t('landing.hero.title') }}
          </h1>
          <p class="text-lg md:text-xl text-muted dark:text-muted-light mb-10 max-w-2xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>

          <!-- CTA Button -->
          <RouterLink
            to="/editor"
            class="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-slate-dark font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span>{{ t('landing.cta') }}</span>
            <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </RouterLink>
        </div>

        <!-- Hero Feature Cards Grid (3 Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div
            v-for="feature in heroFeatures"
            :key="feature.key"
            class="group relative bg-white dark:bg-slate-dark/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30 backdrop-blur-sm"
          >
            <!-- Icon -->
            <div :class="['w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg', feature.gradient]">
              <!-- Grid Icon - Layouts -->
              <svg v-if="feature.icon === 'grid'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <!-- Sliders Icon - Editing -->
              <svg v-if="feature.icon === 'sliders'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <!-- Shield Icon - Privacy -->
              <svg v-if="feature.icon === 'shield'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-xl font-bold text-slate-dark dark:text-surface-light mb-3">
              {{ t(`landing.heroFeatures.${feature.key}.title`) }}
            </h3>
            <p class="text-muted dark:text-muted-light leading-relaxed">
              {{ t(`landing.heroFeatures.${feature.key}.description`) }}
            </p>

            <!-- Hover Effect -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </section>

      <!-- All Features Section -->
      <section class="container mx-auto px-4 py-20">
        <h2 class="text-3xl md:text-4xl font-bold text-center text-slate-dark dark:text-surface-light mb-4">
          {{ t('landing.allFeatures.title') }}
        </h2>
        <p class="text-center text-muted dark:text-muted-light mb-12 max-w-2xl mx-auto">
          {{ t('landing.allFeatures.subtitle') }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div
            v-for="feature in allFeatures"
            :key="feature.key"
            class="group relative bg-white dark:bg-slate-dark/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30 backdrop-blur-sm"
          >
            <!-- Icon -->
            <div :class="['w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4 shadow-md', feature.gradient]">
              <!-- Grid Icon -->
              <svg v-if="feature.icon === 'grid'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <!-- Sliders Icon -->
              <svg v-if="feature.icon === 'sliders'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <!-- Type Icon -->
              <svg v-if="feature.icon === 'type'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <!-- Layers Icon -->
              <svg v-if="feature.icon === 'layers'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- Sparkles Icon -->
              <svg v-if="feature.icon === 'sparkles'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <!-- Download Icon -->
              <svg v-if="feature.icon === 'download'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <!-- Template Icon -->
              <svg v-if="feature.icon === 'template'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <!-- Shield Icon -->
              <svg v-if="feature.icon === 'shield'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t(`landing.allFeatures.items.${feature.key}.title`) }}
            </h3>
            <p class="text-sm text-muted dark:text-muted-light leading-relaxed">
              {{ t(`landing.allFeatures.items.${feature.key}.description`) }}
            </p>

            <!-- Hover Effect -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="container mx-auto px-4 py-20 border-t border-muted/20 dark:border-slate/30">
        <h2 class="text-3xl md:text-4xl font-bold text-center text-slate-dark dark:text-surface-light mb-4">
          {{ t('landing.howItWorks.title') }}
        </h2>
        <p class="text-center text-muted dark:text-muted-light mb-12 max-w-2xl mx-auto">
          {{ t('landing.howItWorks.subtitle') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
      <section class="container mx-auto px-4 py-16 text-center">
        <div class="max-w-2xl mx-auto bg-gradient-to-br from-slate-dark to-slate dark:from-slate dark:to-slate-light/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h3 class="text-2xl md:text-3xl font-bold text-surface-light mb-4">
            {{ t('landing.bottomCta.title') }}
          </h3>
          <p class="text-muted-light mb-8">
            {{ t('landing.bottomCta.subtitle') }}
          </p>
          <RouterLink
            to="/editor"
            class="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-light text-slate-dark font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ t('landing.cta') }}
          </RouterLink>
        </div>
      </section>

      <!-- Footer -->
      <footer class="container mx-auto px-4 py-8 border-t border-muted/20 dark:border-slate/30">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-muted dark:text-muted-light text-sm">{{ t('landing.footer') }}</p>
          <div class="flex items-center gap-6">
            <RouterLink to="/faq" class="text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light text-sm transition-colors">
              {{ t('nav.faq') }}
            </RouterLink>
            <RouterLink to="/editor" class="text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light text-sm transition-colors">
              {{ t('nav.editor') }}
            </RouterLink>
          </div>
        </div>
      </footer>
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
