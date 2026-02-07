<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FaqSection from '@/components/FaqSection.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'start'): void
}>()

const features = [
  {
    key: 'privacy',
    icon: 'shield',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    key: 'batch',
    icon: 'images',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    key: 'background',
    icon: 'layers',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    key: 'formats',
    icon: 'file-image',
    gradient: 'from-orange-500 to-red-600'
  }
]
</script>

<template>
  <div class="min-h-screen bg-surface-light dark:bg-surface-dark overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob"></div>
      <div class="absolute top-1/2 -left-40 w-96 h-96 bg-warm/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-40 right-1/3 w-72 h-72 bg-accent-light/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Hero Section -->
      <header class="container mx-auto px-4 pt-12 pb-8">
        <nav class="flex items-center justify-between mb-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-slate-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-slate-dark dark:text-surface-light">{{ t('app.title') }}</span>
          </div>
        </nav>

        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-6xl font-bold text-slate-dark dark:text-surface-light mb-6 leading-tight">
            {{ t('landing.hero.title') }}
          </h1>
          <p class="text-lg md:text-xl text-muted dark:text-muted-light mb-10 max-w-2xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>

          <!-- CTA Button -->
          <button
            @click="emit('start')"
            class="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-slate-dark font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span>{{ t('landing.cta') }}</span>
            <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </header>

      <!-- Features Section -->
      <section class="container mx-auto px-4 py-16">
        <h2 class="text-2xl md:text-3xl font-bold text-center text-slate-dark dark:text-surface-light mb-12">
          {{ t('landing.features.title') }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="feature in features"
            :key="feature.key"
            class="group relative bg-white dark:bg-navy rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30 backdrop-blur-sm"
          >
            <!-- Icon -->
            <div :class="['w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg', feature.gradient]">
              <!-- Shield Icon - Privacy -->
              <svg v-if="feature.icon === 'shield'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <!-- Images Icon - Batch -->
              <svg v-if="feature.icon === 'images'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- Layers Icon - Background -->
              <svg v-if="feature.icon === 'layers'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- File Image Icon - Formats -->
              <svg v-if="feature.icon === 'file-image'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17l2-2 2 2m2-2l-4-4-4 4" />
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-slate-dark dark:text-surface-light mb-2">
              {{ t(`landing.features.${feature.key}.title`) }}
            </h3>
            <p class="text-muted dark:text-muted-light text-sm leading-relaxed">
              {{ t(`landing.features.${feature.key}.description`) }}
            </p>

            <!-- Hover Effect -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <FaqSection />

      <!-- Bottom CTA -->
      <section class="container mx-auto px-4 py-16 text-center">
        <div class="max-w-2xl mx-auto bg-gradient-to-br from-slate-dark to-slate dark:from-slate dark:to-slate-light/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h3 class="text-2xl md:text-3xl font-bold text-surface-light mb-4">
            {{ t('landing.bottomCta.title') }}
          </h3>
          <p class="text-muted-light mb-8">
            {{ t('landing.bottomCta.subtitle') }}
          </p>
          <button
            @click="emit('start')"
            class="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-light text-slate-dark font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ t('landing.cta') }}
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="container mx-auto px-4 py-8 text-center text-muted dark:text-muted-light text-sm">
        <p>{{ t('landing.footer') }}</p>
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
