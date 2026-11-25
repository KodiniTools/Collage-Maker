<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { UiButton } from '@/components/ui'
  import CollageHeader from '@/components/CollageHeader.vue'

  const { t, tm } = useI18n()
  const openIndex = ref<number | null>(null)

  // Hole die FAQ-Fragen aus den Übersetzungen
  const faqQuestions = computed(() => {
    const questions = tm('faqPage.questions') as Array<{
      question: string
      answer: string
      category: string
    }>
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
  <div class="min-h-screen bg-surface-0">
    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation -->
      <header class="collage-site-header">
        <CollageHeader />
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-4 pt-8 sm:pt-16 pb-8 sm:pb-12 text-center">
        <h1 class="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-4">
          {{ t('faqPage.title') }}
        </h1>
        <p class="text-lg text-ink-2 max-w-2xl mx-auto">
          {{ t('faqPage.subtitle') }}
        </p>
      </section>

      <!-- FAQ Content -->
      <section class="container mx-auto px-4 pb-10 sm:pb-20">
        <div class="max-w-4xl mx-auto">
          <!-- Category Sections -->
          <div v-for="(items, category) in categories" :key="category" class="mb-12">
            <h2 class="text-2xl font-bold text-ink mb-6">
              {{ t(`faqPage.categories.${category}`) }}
            </h2>

            <div class="space-y-4">
              <div
                v-for="item in items"
                :key="item.index"
                class="border border-line rounded-lg overflow-hidden bg-surface-1"
              >
                <button
                  class="w-full px-4 py-3 sm:px-6 sm:py-5 text-left hover:bg-surface-2 transition-colors flex items-center justify-between gap-3 sm:gap-4"
                  @click="toggleQuestion(item.index)"
                >
                  <span class="font-semibold text-lg text-ink">{{ item.question }}</span>
                  <svg
                    class="w-5 h-5 flex-shrink-0 transition-transform text-ink"
                    :class="{ 'rotate-180': openIndex === item.index }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <transition
                  enter-active-class="transition-[max-height,opacity]"
                  leave-active-class="transition-[max-height,opacity]"
                  enter-from-class="max-h-0 opacity-0"
                  enter-to-class="max-h-96 opacity-100"
                  leave-from-class="max-h-96 opacity-100"
                  leave-to-class="max-h-0 opacity-0"
                >
                  <div v-show="openIndex === item.index" class="overflow-hidden">
                    <div
                      class="px-4 py-3 sm:px-6 sm:py-5 text-ink border-t border-line text-sm sm:text-lg"
                    >
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
        <div
          class="max-w-2xl mx-auto bg-surface-1 border border-line rounded-lg p-5 sm:p-8 md:p-12 text-center"
        >
          <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-4">
            {{ t('faqPage.cta.title') }}
          </h3>
          <p class="text-ink-2 mb-6 sm:mb-8">
            {{ t('faqPage.cta.subtitle') }}
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
