<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
const openIndex = ref<number | null>(null)

// Hole die FAQ-Fragen aus den Übersetzungen
const faqQuestions = computed(() => {
  const questions = tm('faq.questions') as Array<{ question: string; answer: string }>
  return questions
})

function toggleQuestion(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section class="border-t border-gray-200 dark:border-gray-800 py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <h2 class="text-3xl font-bold text-center mb-8">{{ t('faq.title') }}</h2>

      <div class="space-y-4">
        <div
          v-for="(item, index) in faqQuestions"
          :key="index"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            @click="toggleQuestion(index)"
            class="w-full px-6 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-between gap-4"
          >
            <span class="font-semibold text-lg">{{ item.question }}</span>
            <svg
              class="w-5 h-5 flex-shrink-0 transition-transform"
              :class="{ 'rotate-180': openIndex === index }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-show="openIndex === index" class="overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                {{ item.answer }}
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </section>
</template>
