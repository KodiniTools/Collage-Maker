<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import CollageHeader from '@/components/CollageHeader.vue'
  import './landing.css'

  import travel1 from '@/assets/collage/travel-1.webp'
  import travel2 from '@/assets/collage/travel-2.webp'
  import travel3 from '@/assets/collage/travel-3.webp'
  import travel4 from '@/assets/collage/travel-4.webp'
  import travel5 from '@/assets/collage/travel-5.webp'
  import travel6 from '@/assets/collage/travel-6.webp'

  const { t } = useI18n()
  const heroPhotos = [travel1, travel2, travel3, travel4, travel5, travel6]

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
  <div class="collage-landing min-h-screen bg-surface-0">
    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="collage-site-header">
        <CollageHeader />
      </header>

      <!-- Hero Section -->
      <section class="collage-shell">
        <div class="collage-hero">
          <div class="collage-hero-copy">
            <h1>{{ t('landing.hero.title') }}</h1>
            <p class="collage-hero-lede">{{ t('landing.hero.lede') }}</p>
            <p class="collage-hero-description">{{ t('landing.hero.subtitle') }}</p>
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

          <div class="collage-hero-art" role="img" :aria-label="t('landing.hero.collageAlt')">
            <div class="collage-hero-tiles" aria-hidden="true">
              <img
                v-for="photo in heroPhotos"
                :key="photo"
                :src="photo"
                alt=""
                width="512"
                height="512"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <!-- Hero Feature Cards Grid (3 Cards) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 collage-feature-cards"
        >
          <div
            v-for="feature in heroFeatures"
            :key="feature"
            class="bg-surface-1 rounded-lg p-5 sm:p-6 transition-colors border border-line hover:border-line-strong text-center"
          >
            <h3 class="text-xl font-bold text-ink mb-2">
              {{ t(`landing.heroFeatures.${feature}.title`) }}
            </h3>
            <p class="text-ink-2">
              {{ t(`landing.heroFeatures.${feature}.description`) }}
            </p>
          </div>
        </div>
      </section>

      <section class="collage-demo collage-shell" :aria-label="t('landing.hero.demo')">
        <h2>{{ t('landing.hero.demo') }}</h2>
        <video
          class="w-full rounded-lg border border-line"
          :src="heroVideoSrc"
          autoplay
          muted
          playsinline
          preload="auto"
          :aria-label="t('landing.hero.title')"
        ></video>
      </section>

      <!-- All Features Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20">
        <h2 class="text-xl sm:text-2xl font-bold text-center text-ink mb-4">
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
            <p class="text-sm text-ink-2">
              {{ t(`landing.allFeatures.items.${feature}.description`) }}
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="container mx-auto px-4 py-10 sm:py-20 border-t border-line">
        <h2 class="text-xl sm:text-2xl font-bold text-center text-ink mb-4">
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
