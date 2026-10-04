<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { UiButton } from '@/components/ui'

  const { t } = useI18n()

  const heroFeatures = ['layouts', 'editing', 'privacy']

  // Served from the site root (/var/www/kodinitools.com/videos/), not the app base.
  const heroVideoSrc = '/videos/collage-maker.webm'

  const allFeatures = [
    'layouts',
    'editing',
    'text',
    'background',
    'filters',
    'export',
    'templates',
    'privacy',
  ]
</script>

<template>
  <div class="min-h-screen bg-surface-0">
    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="sticky top-0 z-50 bg-surface-1 border-b border-line">
        <nav
          class="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-y-2"
        >
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <span class="text-xl font-bold text-ink">{{ t('app.title') }}</span>
          </div>

          <!-- Nav Links + Controls -->
          <div class="flex items-center gap-3 sm:gap-6 ml-auto">
            <RouterLink to="/blog" class="text-ink-2 hover:text-ink transition-colors font-medium">
              {{ t('nav.guide') }}
            </RouterLink>
            <RouterLink
              to="/artikel"
              class="text-ink-2 hover:text-ink transition-colors font-medium"
            >
              {{ t('nav.blog') }}
            </RouterLink>
            <RouterLink to="/faq" class="text-ink-2 hover:text-ink transition-colors font-medium">
              {{ t('nav.faq') }}
            </RouterLink>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-4 pt-8 pb-8 sm:pt-16 sm:pb-12">
        <div class="text-center max-w-4xl mx-auto mb-8 sm:mb-16">
          <h1
            class="text-3xl sm:text-4xl md:text-6xl font-bold text-ink mb-4 sm:mb-6 leading-tight"
          >
            {{ t('landing.hero.title') }}
          </h1>

          <!-- Hero Video (autoplay once on page load, muted for browser autoplay policy) -->
          <div class="mb-6 sm:mb-10 max-w-3xl mx-auto">
            <video
              class="w-full rounded-lg border border-line"
              :src="heroVideoSrc"
              autoplay
              muted
              playsinline
              preload="auto"
              :aria-label="t('landing.hero.title')"
            ></video>
          </div>

          <p class="text-base sm:text-lg md:text-xl text-ink-2 mb-6 sm:mb-10 max-w-2xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>

          <!-- CTA Button -->
          <UiButton to="/editor" variant="primary" size="lg">
            <span>{{ t('landing.cta') }}</span>
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </UiButton>
        </div>

        <!-- Hero Feature Cards Grid (3 Cards) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto"
        >
          <div
            v-for="feature in heroFeatures"
            :key="feature"
            class="bg-surface-1 rounded-lg p-5 sm:p-6 transition-colors border border-line hover:border-line-strong text-center"
          >
            <h3 class="text-xl font-bold text-ink mb-2">
              {{ t(`landing.heroFeatures.${feature}.title`) }}
            </h3>
            <p class="text-ink-2 leading-relaxed">
              {{ t(`landing.heroFeatures.${feature}.description`) }}
            </p>
          </div>
        </div>
      </section>

      <!-- All Features Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-ink mb-4">
          {{ t('landing.allFeatures.title') }}
        </h2>
        <p class="text-center text-ink-2 mb-8 sm:mb-12 max-w-2xl mx-auto">
          {{ t('landing.allFeatures.subtitle') }}
        </p>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto"
        >
          <div
            v-for="feature in allFeatures"
            :key="feature"
            class="bg-surface-1 rounded-lg p-4 sm:p-5 transition-colors border border-line hover:border-line-strong text-center"
          >
            <h3 class="text-lg font-semibold text-ink mb-2">
              {{ t(`landing.allFeatures.items.${feature}.title`) }}
            </h3>
            <p class="text-sm text-ink-2 leading-relaxed">
              {{ t(`landing.allFeatures.items.${feature}.description`) }}
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20 border-t border-line">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-ink mb-4">
          {{ t('landing.howItWorks.title') }}
        </h2>
        <p class="text-center text-ink-2 mb-8 sm:mb-12 max-w-2xl mx-auto">
          {{ t('landing.howItWorks.subtitle') }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <div class="text-center">
            <div
              class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span class="text-2xl font-bold text-on-accent">1</span>
            </div>
            <h3 class="text-xl font-semibold text-ink mb-2">
              {{ t('landing.howItWorks.step1.title') }}
            </h3>
            <p class="text-ink-2">
              {{ t('landing.howItWorks.step1.description') }}
            </p>
          </div>
          <div class="text-center">
            <div
              class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span class="text-2xl font-bold text-on-accent">2</span>
            </div>
            <h3 class="text-xl font-semibold text-ink mb-2">
              {{ t('landing.howItWorks.step2.title') }}
            </h3>
            <p class="text-ink-2">
              {{ t('landing.howItWorks.step2.description') }}
            </p>
          </div>
          <div class="text-center">
            <div
              class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span class="text-2xl font-bold text-on-accent">3</span>
            </div>
            <h3 class="text-xl font-semibold text-ink mb-2">
              {{ t('landing.howItWorks.step3.title') }}
            </h3>
            <p class="text-ink-2">
              {{ t('landing.howItWorks.step3.description') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Bottom CTA -->
      <section class="container mx-auto px-4 py-10 sm:py-16 text-center">
        <div
          class="max-w-2xl mx-auto bg-surface-1 border border-line rounded-lg p-5 sm:p-8 md:p-12"
        >
          <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-4">
            {{ t('landing.bottomCta.title') }}
          </h3>
          <p class="text-ink-2 mb-6 sm:mb-8">
            {{ t('landing.bottomCta.subtitle') }}
          </p>
          <UiButton to="/editor" variant="primary" size="lg">
            <template #icon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </template>
            {{ t('landing.cta') }}
          </UiButton>
        </div>
      </section>
    </div>
  </div>
</template>
