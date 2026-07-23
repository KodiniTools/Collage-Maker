import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/pages/LandingPage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import FaqPage from '@/pages/FaqPage.vue'
import BlogPage from '@/pages/BlogPage.vue'

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
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
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
