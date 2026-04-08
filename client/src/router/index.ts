import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ─── Auth ────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/modules/auth/views/RegisterView.vue'),
      meta: { public: true },
    },

    // ─── Admin (internal users) ───────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/components/layout/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/modules/dashboard/views/DashboardView.vue'),
        },
        {
          path: 'company',
          name: 'company',
          component: () => import('@/modules/company/views/CompanyView.vue'),
        },
        {
          path: 'integrations',
          name: 'integrations',
          component: () => import('@/modules/integrations/views/IntegrationsView.vue'),
        },
        {
          path: 'integrations/queue',
          name: 'queue-monitor',
          component: () => import('@/modules/integrations/views/QueueMonitorView.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/modules/customers/views/CustomersView.vue'),
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/modules/products/views/ProductsView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/modules/profile/views/ProfileView.vue'),
        },
      ],
    },

    // ─── Root redirect ────────────────────────────────────────────
    { path: '/', redirect: '/admin/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/admin/dashboard' },
  ],
})

// Navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Try to restore session
  if (auth.token && !auth.user) {
    await auth.fetchMe()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
