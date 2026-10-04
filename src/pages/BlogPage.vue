<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
  import { UiButton } from '@/components/ui'
  import { getBlogArticlesNewestFirst } from '@/data/blogArticles'
  import { buildBlogCards } from '@/lib/blogCards'

  const { t, locale } = useI18n()

  // Blog posts about the collage maker on kodinitools.com/blog (src/data/blogArticles.ts),
  // in the active language, newest post first
  const blogCards = computed(() =>
    buildBlogCards(getBlogArticlesNewestFirst(), String(locale.value), t('blogPage.minutes'))
  )
</script>

<template>
  <div class="min-h-screen bg-surface-0">
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="sticky top-0 z-50 bg-surface-1 border-b border-line">
        <nav
          class="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-y-2"
        >
          <RouterLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span class="text-xl font-bold text-ink">{{ t('app.title') }}</span>
          </RouterLink>

          <div class="flex items-center gap-2 sm:gap-6 ml-auto">
            <RouterLink
              to="/blog"
              class="text-sm sm:text-base text-ink-2 hover:text-ink transition-colors font-medium"
            >
              {{ t('nav.guide') }}
            </RouterLink>
            <RouterLink to="/artikel" class="text-sm sm:text-base text-ink font-semibold">
              {{ t('nav.blog') }}
            </RouterLink>
            <RouterLink
              to="/faq"
              class="text-sm sm:text-base text-ink-2 hover:text-ink transition-colors font-medium"
            >
              {{ t('nav.faq') }}
            </RouterLink>
            <RouterLink
              to="/"
              class="text-sm sm:text-base text-ink-2 hover:text-ink transition-colors font-medium"
            >
              {{ t('nav.home') }}
            </RouterLink>
            <UiButton to="/editor" variant="primary" size="sm">
              {{ t('nav.editor') }}
            </UiButton>
          </div>
        </nav>
      </header>

      <!-- Hero -->
      <section class="container mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center">
        <span
          class="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-accent-soft text-ink"
        >
          {{ t('blogPage.tag') }}
        </span>
        <h1 class="text-3xl sm:text-5xl font-bold text-ink mb-4 leading-tight">
          {{ t('blogPage.title') }}
        </h1>
        <p class="text-ink-2 max-w-2xl mx-auto text-base sm:text-lg">
          {{ t('blogPage.subtitle') }}
        </p>
      </section>

      <!-- Posts -->
      <section class="container mx-auto px-4 pb-12 sm:pb-20">
        <div
          class="grid gap-4 sm:gap-6 mx-auto"
          :class="blogCards.length > 1 ? 'md:grid-cols-2 max-w-4xl' : 'max-w-xl'"
        >
          <a
            v-for="article in blogCards"
            :key="article.id"
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex flex-col overflow-hidden bg-surface-1 rounded-lg transition-all duration-slow border border-line"
          >
            <div class="aspect-video overflow-hidden bg-surface-2 border-b border-line">
              <img
                :src="article.image"
                alt=""
                width="640"
                height="360"
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-slow group-hover:scale-[1.03]"
              />
            </div>
            <div class="flex flex-col flex-1 gap-3 p-5 sm:p-6 text-left">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span
                  class="px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent text-on-accent"
                >
                  {{ article.tag }}
                </span>
                <span class="text-sm text-ink-2">{{ article.meta }}</span>
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-ink leading-snug">
                {{ article.title }}
              </h2>
              <p class="flex-1 text-sm sm:text-base text-ink-2 leading-relaxed">
                {{ article.description }}
              </p>
              <span class="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                {{ t('blogPage.readMore') }}
                <svg
                  class="w-4 h-4 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </div>
          </a>
        </div>
      </section>

      <!-- CTA (same style as the guide page) -->
      <section class="container mx-auto px-4 pb-20 max-w-3xl">
        <div class="rounded-lg bg-surface-1 border border-line p-8 text-center">
          <h2 class="text-2xl font-bold text-ink mb-3">
            {{ t('blogPage.cta.title') }}
          </h2>
          <p class="text-ink-2 mb-6">
            {{ t('blogPage.cta.subtitle') }}
          </p>
          <UiButton to="/editor" variant="primary" size="lg">{{ t('landing.cta') }} →</UiButton>
        </div>
      </section>
    </div>
  </div>
</template>
