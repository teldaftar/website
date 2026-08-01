import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resolveTransition } from '@/lib/transition'

/**
 * Route tree. Auth screens live outside the app shell (full-screen); every
 * authenticated screen is a child of the shell layout. Views are lazy-loaded.
 * `meta.requiresAuth` (default true) drives the guard below; `meta.guestOnly`
 * bounces logged-in users away from login/register.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppShell.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'phones', name: 'phones', component: () => import('@/views/phones/PhonesView.vue') },
      {
        path: 'phones/:id',
        name: 'phone-detail',
        component: () => import('@/views/phones/PhoneDetailView.vue'),
      },
      {
        path: 'accessories',
        name: 'accessories',
        component: () => import('@/views/accessories/AccessoriesView.vue'),
      },
      {
        path: 'accessories/:id',
        name: 'accessory-detail',
        component: () => import('@/views/accessories/AccessoryDetailView.vue'),
      },
      {
        path: 'sales',
        name: 'sales',
        component: () => import('@/views/sales/SalesHistoryView.vue'),
      },
      {
        path: 'sales/:id',
        name: 'sale-detail',
        component: () => import('@/views/sales/SaleDetailView.vue'),
      },
      { path: 'debts', name: 'debts', component: () => import('@/views/debts/DebtsView.vue') },
      {
        path: 'expenses',
        name: 'expenses',
        component: () => import('@/views/expenses/ExpensesView.vue'),
      },
      { path: 'more', name: 'more', component: () => import('@/views/MoreView.vue') },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
      },
    ],
  },
  {
    path: '/phones/:id/label',
    name: 'phone-label',
    component: () => import('@/views/phones/PhoneLabelView.vue'),
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: { name: 'dashboard' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, saved) {
    return saved ?? { top: 0 }
  },
})

/** Auth guard: hydrate the session once, then gate by meta. */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.ready) {
    await auth.bootstrap()
  }

  const guestOnly = to.meta.guestOnly === true
  const requiresAuth = to.meta.requiresAuth !== false && !guestOnly

  if (requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }
  if (guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

// Pick the page-transition direction before the component swaps.
router.beforeEach((to, from) => {
  resolveTransition(to, from)
  return true
})

export default router
