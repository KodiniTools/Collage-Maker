import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/pages/LandingPage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import FaqPage from '@/pages/FaqPage.vue'
import BlogPage from '@/pages/BlogPage.vue'

// Offset for in-page anchors (/#blog, guide sections): the target's
// `scroll-margin-top` (Tailwind scroll-mt-*) keeps it clear of the sticky
// navigation, so the CSS stays the single source of truth.
const DEFAULT_HASH_OFFSET = 96 // = scroll-mt-24
function hashScrollOffset(hash: string): number {
  const el = document.getElementById(hash.slice(1))
  if (!el) return DEFAULT_HASH_OFFSET
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop)
  return Number.isFinite(margin) && margin > 0 ? margin : DEFAULT_HASH_OFFSET
}

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage,
    meta: { seo: 'landing' },
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorPage,
    meta: { seo: 'editor' },
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqPage,
    meta: { seo: 'faq' },
  },
  {
    path: '/blog',
    name: 'blog',
    component: BlogPage,
    meta: { seo: 'blog' },
  },
]

const router = createRouter({
  history: createWebHistory('/collagemaker/'),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, top: hashScrollOffset(to.hash), behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

// Handoff Guard: redirect to editor when handoff data is detected
router.beforeEach((to, _from, next) => {
  if (to.name !== 'editor') {
    const hasHandoffParam = to.query.handoff === 'kodinitools'
    const hasHandoffData = !!localStorage.getItem('kodinitools-handoff')
    if (hasHandoffParam || hasHandoffData) {
      return next({ name: 'editor', query: { ...to.query, handoff: 'kodinitools' } })
    }
  }
  next()
})

export default router
