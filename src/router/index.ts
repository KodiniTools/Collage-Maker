import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/pages/LandingPage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import FaqPage from '@/pages/FaqPage.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorPage
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqPage
  }
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
  }
})

export default router
