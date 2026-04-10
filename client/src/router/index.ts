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
    {
      path: '/setup-account',
      name: 'setup-account',
      component: () => import('@/modules/auth/views/SetupPasswordView.vue'),
      meta: { public: true },
    },

    // ─── Admin (internal users) ───────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/components/layout/AdminLayout.vue'),
      meta: { requiresAuth: true, type: 'internal' },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/modules/dashboard/views/DashboardView.vue'),
          meta: { permission: 'settings:view' }
        },
        {
          path: 'analytics',
          name: 'sales-analytics',
          component: () => import('@/modules/dashboard/views/SalesAnalyticsView.vue'),
          meta: { permission: 'settings:view' }
        },
        {
          path: 'settings',
          component: () => import('@/modules/settings/views/SettingsLayout.vue'),
          meta: { permission: 'team:view' }, // Default to lowest specific permission needed for the layout
          children: [
            { path: '', redirect: '/admin/settings/company' },
            {
              path: 'company',
              name: 'company',
              component: () => import('@/modules/company/views/CompanyView.vue'),
              meta: { permission: 'settings:view' }
            },
            {
              path: 'integrations',
              name: 'integrations',
              component: () => import('@/modules/integrations/views/IntegrationsView.vue'),
              meta: { permission: 'integrations:view' }
            },
            {
              path: 'integrations/queue',
              name: 'queue-monitor',
              component: () => import('@/modules/integrations/views/QueueMonitorView.vue'),
              meta: { permission: 'integrations:view' }
            },
            {
              path: 'email',
              name: 'email-settings',
              component: () => import('@/modules/settings/views/EmailSettingsView.vue'),
              meta: { permission: 'settings:manage' }
            },
            {
              path: 'team',
              name: 'team-management',
              component: () => import('@/modules/settings/views/TeamView.vue'),
              meta: { permission: 'team:view' }
            },
            {
              path: 'roles',
              name: 'roles-management',
              component: () => import('@/modules/settings/views/RolesView.vue'),
              meta: { permission: 'role:manage' }
            },
            {
              path: 'smart-basket',
              name: 'smart-basket-settings',
              component: () => import('@/modules/settings/views/SmartBasketSettingsView.vue'),
              meta: { permission: 'settings:manage' }
            },
          ]
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/modules/customers/views/CustomersView.vue'),
          meta: { permission: 'customers:view' }
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/modules/products/views/ProductsView.vue'),
          meta: { permission: 'products:view' }
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/modules/orders/views/AdminOrdersView.vue'),
          meta: { permission: 'orders:view' }
        },
        {
          path: 'support',
          name: 'admin-support',
          component: () => import('@/modules/support/views/SupportView.vue'),
          meta: { permission: 'settings:view' }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/modules/profile/views/ProfileView.vue'),
        },
        {
          path: 'audit',
          name: 'audit-logs',
          component: () => import('@/modules/audit/views/AuditLogsView.vue'),
          meta: { permission: 'settings:manage' }
        },
      ],
    },

    // ─── Portal (customer users) ──────────────────────────────────
    {
      path: '/portal',
      component: () => import('@/components/layout/PortalLayout.vue'),
      meta: { requiresAuth: true, type: 'customer' },
      children: [
        { path: '', redirect: '/portal/dashboard' },
        {
          path: 'dashboard',
          name: 'portal-dashboard',
          component: () => import('@/modules/portal/views/PortalDashboard.vue'),
        },
        {
          path: 'catalog',
          name: 'portal-catalog',
          component: () => import('@/modules/portal/views/CatalogView.vue'),
        },
        {
          path: 'orders',
          name: 'portal-orders',
          component: () => import('@/modules/portal/views/OrdersView.vue'),
        },
        {
          path: 'invoices',
          name: 'portal-invoices',
          component: () => import('@/modules/portal/views/InvoicesView.vue'),
        },
        {
          path: 'team',
          name: 'portal-team',
          component: () => import('@/modules/portal/views/PortalUsersView.vue'),
        },
        {
          path: 'support',
          name: 'portal-support',
          component: () => import('@/modules/support/views/SupportView.vue'),
        },
        {
          path: 'profile',
          name: 'portal-profile',
          component: () => import('@/modules/portal/views/ProfileView.vue'),
        },
      ],
    },


    // ─── Root redirect ────────────────────────────────────────────
    { 
      path: '/', 
      redirect: _ => {
        const auth = useAuthStore()
        if (auth.isAuthenticated) {
          return auth.user?.type === 'internal' ? '/admin/dashboard' : '/portal/dashboard'
        }
        return '/login'
      }
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 1. Restore session if needed
  if (auth.token && !auth.user) {
    await auth.fetchMe()
  }

  // 2. Auth protection
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // 3. Cross-access / Public routes protection
  if (auth.isAuthenticated) {
    const userType = auth.user?.type
    
    // Redirect internal users away from /portal
    if (to.path.startsWith('/portal') && userType === 'internal') {
      return { name: 'dashboard' }
    }
    
    // Redirect customer users away from /admin
    if (to.path.startsWith('/admin') && userType === 'customer') {
      return { name: 'portal-dashboard' }
    }

    // Redirect logged in users away from public routes
    if (to.meta.public) {
      return userType === 'internal' ? { name: 'dashboard' } : { name: 'portal-dashboard' }
    }
  }

  // 4. RBAC Enforcement (Strict)
  if (to.meta.permission && !auth.hasPermission(to.meta.permission as string)) {
    console.warn(`Access denied for ${to.path}. Missing permission: ${to.meta.permission}`)
    
    // Fallback logic for unauthorized internal users
    if (auth.user?.type === 'internal') {
      const adminRoutes = [
        { p: 'settings:view', to: 'dashboard' },
        { p: 'customers:view', to: 'customers' },
        { p: 'products:view', to: 'products' },
        { p: 'orders:view', to: 'admin-orders' },
        { p: 'team:view', to: 'team-management' },
        { p: 'settings:view', to: 'profile' }
      ]

      const firstAllowed = adminRoutes.find(r => auth.hasPermission(r.p))
      if (firstAllowed) {
        return { name: firstAllowed.to }
      }
      return { name: 'profile' }
    }
  }
})

export default router
