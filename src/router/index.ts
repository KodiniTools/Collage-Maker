import { createRouter, createWebHistory } from 'vue-router'
// Startseite fest im Haupt-Bundle; alle anderen Seiten werden beim Aufruf nachgeladen.
import LandingPage from '@/pages/LandingPage.vue'
import { clearChunkReloadFlag, reloadOnChunkError } from './chunkReload'

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
    component: () => import('@/pages/EditorPage.vue'),
    meta: { seo: 'editor' },
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('@/pages/FaqPage.vue'),
    meta: { seo: 'faq' },
  },
  {
    // Anleitung (guide); the path stays /blog so existing links keep working
    path: '/blog',
    name: 'guide',
    component: () => import('@/pages/GuidePage.vue'),
    meta: { seo: 'guide' },
  },
  {
    // Blog posts about the collage maker on kodinitools.com/blog
    path: '/artikel',
    name: 'blog',
    component: () => import('@/pages/BlogPage.vue'),
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

// Fehlender Chunk nach einem Deploy: Zielseite einmal neu laden statt leerer Seite.
router.onError((error, to) => {
  reloadOnChunkError(error, router.resolve(to).href)
})
router.afterEach(() => clearChunkReloadFlag())

export default router
