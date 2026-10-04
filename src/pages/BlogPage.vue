<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { RouterLink } from 'vue-router'
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
  <div class="min-h-screen bg-page-gradient">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 -left-40 w-96 h-96 bg-warm/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10">
      <!-- Navigation -->
      <header
        class="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md container mx-auto px-4 pt-6"
      >
        <nav class="flex flex-wrap items-center justify-between gap-y-2">
          <RouterLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span class="text-xl font-bold text-slate-dark dark:text-surface-light">{{
              t('app.title')
            }}</span>
          </RouterLink>

          <div class="flex items-center gap-2 sm:gap-6 ml-auto">
            <RouterLink
              to="/blog"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.guide') }}
            </RouterLink>
            <RouterLink
              to="/artikel"
              class="text-sm sm:text-base text-slate-dark dark:text-accent-light font-semibold"
            >
              {{ t('nav.blog') }}
            </RouterLink>
            <RouterLink
              to="/faq"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.faq') }}
            </RouterLink>
            <RouterLink
              to="/"
              class="text-sm sm:text-base text-muted dark:text-muted-light hover:text-slate-dark dark:hover:text-surface-light transition-colors font-medium"
            >
              {{ t('nav.home') }}
            </RouterLink>
            <RouterLink
              to="/editor"
              class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-accent hover:bg-accent-light text-accent-ink font-medium rounded-lg transition-colors"
            >
              {{ t('nav.editor') }}
            </RouterLink>
          </div>
        </nav>
      </header>

      <!-- Hero -->
      <section class="container mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center">
        <span
          class="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-accent/10 dark:bg-accent/20 text-slate-dark dark:text-accent"
        >
          {{ t('blogPage.tag') }}
        </span>
        <h1
          class="text-3xl sm:text-5xl font-bold text-slate-dark dark:text-surface-light mb-4 leading-tight"
        >
          {{ t('blogPage.title') }}
        </h1>
        <p class="text-muted dark:text-muted-light max-w-2xl mx-auto text-base sm:text-lg">
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
            class="group flex flex-col overflow-hidden bg-white dark:bg-navy rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-muted/10 dark:border-slate/30"
          >
            <div
              class="aspect-video overflow-hidden bg-surface dark:bg-surface-darker border-b border-muted/10 dark:border-slate/30"
            >
              <img
                :src="article.image"
                alt=""
                width="640"
                height="360"
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div class="flex flex-col flex-1 gap-3 p-5 sm:p-6 text-left">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span
                  class="px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent text-accent-ink"
                >
                  {{ article.tag }}
                </span>
                <span class="text-sm text-muted dark:text-muted-light">{{ article.meta }}</span>
              </div>
              <h2
                class="text-lg sm:text-xl font-bold text-slate-dark dark:text-surface-light leading-snug"
              >
                {{ article.title }}
              </h2>
              <p
                class="flex-1 text-sm sm:text-base text-muted dark:text-muted-light leading-relaxed"
              >
                {{ article.description }}
              </p>
              <span
                class="inline-flex items-center gap-1 text-sm font-semibold text-slate-dark dark:text-accent-light"
              >
                {{ t('blogPage.readMore') }}
                <svg
                  class="w-4 h-4 transition-transform group-hover:translate-x-1"
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
        <div
          class="rounded-2xl bg-gradient-to-br from-accent/20 to-accent-dark/10 border border-accent/20 p-8 text-center"
        >
          <h2 class="text-2xl font-bold text-slate-dark dark:text-surface-light mb-3">
            {{ t('blogPage.cta.title') }}
          </h2>
          <p class="text-muted dark:text-muted-light mb-6">
            {{ t('blogPage.cta.subtitle') }}
          </p>
          <RouterLink
            to="/editor"
            class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-accent-ink font-semibold rounded-xl transition-colors shadow-lg"
          >
            {{ t('landing.cta') }} →
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
