<template>
  <div class="min-h-screen flex bg-transparent">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-white/70 backdrop-blur-2xl flex flex-col shrink-0 fixed inset-y-0 left-0 z-30 transition-transform duration-300 border-r border-white/80 shadow-[10px_0_30px_-15px_rgba(15,23,42,0.1)]"
      :class="{ '-translate-x-full': !sidebarOpen, 'translate-x-0': sidebarOpen }"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-(--color-brand-200)/50">
        <div class="w-9 h-9 rounded-xl bg-linear-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md border border-accent-400/50 overflow-hidden">
          <img v-if="auth.company?.logo" :src="auth.company.logo" class="w-full h-full object-cover" />
          <span v-else class="text-white font-black text-sm">N</span>
        </div>
        <div>
          <p class="text-(--color-brand-900) font-bold text-sm leading-none tracking-wide">NexoB2B</p>
          <p class="text-(--color-brand-600) text-xs mt-0.5 truncate max-w-[140px]">{{ auth.company?.name }}</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in filteredNavItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-(--color-brand-700) hover:text-accent-600 hover:bg-white/60 transition-all duration-300 group"
          active-class="!text-accent-600 !bg-white/90 font-medium shadow-[inset_3px_0_0_0_var(--color-accent-500),0_2px_4px_rgba(0,0,0,0.02)]"
        >
          <Icon :icon="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

    </aside>

    <!-- Main content -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header class="bg-white/50 backdrop-blur-xl border-b border-white/80 h-16 flex items-center px-8 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.05)]">
        <button
          class="md:hidden mr-4 text-(--color-brand-600) hover:text-(--color-brand-900) transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon icon="mdi:menu" class="w-6 h-6" />
        </button>
        <h1 class="text-[1.05rem] font-bold text-(--color-brand-900) tracking-tight">{{ pageTitle }}</h1>
        <div class="ml-auto flex items-center gap-6">
          <span class="badge badge-success text-[10px] uppercase font-bold tracking-wider px-2 py-1 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-success-500 inline-block mr-1 shadow-[0_0_6px_var(--color-success-500)]"></span>
            Online
          </span>
          
          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-3 focus:outline-none group p-1 pr-3 rounded-full hover:bg-white/60 transition-colors border border-transparent hover:border-(--color-brand-200)/50"
            >
              <div class="w-8 h-8 rounded-full bg-linear-to-br from-accent-100 to-(--color-accent-200) flex items-center justify-center text-(--color-accent-700) text-xs font-bold border border-accent-300 shadow-sm">
                {{ initials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-(--color-brand-900) text-sm font-semibold leading-none">{{ auth.fullName }}</p>
                <p class="text-(--color-brand-600) text-xs mt-0.5">{{ auth.user?.role }}</p>
              </div>
              <Icon icon="mdi:chevron-down" class="w-4 h-4 text-(--color-brand-500) group-hover:text-(--color-brand-800) transition-transform" :class="{ 'rotate-180': userMenuOpen }" />
            </button>

            <!-- Dropdown Body -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0 translate-y-2"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 translate-y-2"
            >
              <div v-if="userMenuOpen" class="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-(--color-brand-200)/80 py-2 z-50">
                <div class="px-4 py-3 border-b border-(--color-brand-100)">
                  <p class="text-sm font-semibold text-(--color-brand-900) truncate">{{ auth.fullName }}</p>
                  <p class="text-xs text-(--color-brand-500) truncate">{{ auth.user?.email }}</p>
                </div>
                <div class="py-1">
                  <RouterLink to="/admin/profile" @click="userMenuOpen = false" class="w-full text-left px-4 py-2 text-sm text-(--color-brand-700) hover:bg-(--color-brand-50) hover:text-accent-600 flex items-center gap-2 transition-colors">
                    <Icon icon="mdi:account-circle-outline" class="w-4 h-4" />
                    Mi Perfil
                  </RouterLink>
                  <RouterLink to="/admin/profile" @click="userMenuOpen = false" class="w-full text-left px-4 py-2 text-sm text-(--color-brand-700) hover:bg-(--color-brand-50) hover:text-accent-600 flex items-center gap-2 transition-colors">
                    <Icon icon="mdi:shield-key-outline" class="w-4 h-4" />
                    Cambiar Clave
                  </RouterLink>
                </div>
                <div class="border-t border-(--color-brand-100) py-1">
                  <button
                    @click="auth.logout()"
                    class="w-full text-left px-4 py-2 text-sm text-danger-500 hover:bg-danger-100/50 flex items-center gap-2 transition-colors group"
                  >
                    <Icon icon="mdi:logout" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Salir del Sistema
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-8">
        <RouterView />
      </main>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-20 md:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(true)
const userMenuOpen = ref(false)

const navItems = [
  { to: '/admin/dashboard',    icon: 'mdi:view-dashboard-outline', label: 'Monitor Sistema', permission: 'settings:view' },
  { to: '/admin/analytics',    icon: 'mdi:trophy-outline',          label: 'Ventas VIP',     permission: 'settings:view' },
  { to: '/admin/customers',    icon: 'mdi:account-group-outline',  label: 'Clientes',       permission: 'customers:view' },
  { to: '/admin/products',     icon: 'mdi:package-variant-closed', label: 'Catálogo',       permission: 'products:view' },
  { to: '/admin/orders',       icon: 'mdi:cart-outline',           label: 'Pedidos B2B',    permission: 'orders:view' },
  { to: '/admin/support',      icon: 'mdi:face-agent',             label: 'Soporte',        permission: 'settings:view' },
  { to: '/admin/audit',        icon: 'mdi:shield-search',          label: 'Auditoría',      permission: 'settings:manage' },
  { to: '/admin/settings',     icon: 'mdi:cog-outline',            label: 'Configuraciones', permission: 'team:view' }, // Catch-all for settings layout
]

const filteredNavItems = computed(() => {
  return navItems.filter(item => {
    // Special handling for Configurations: Show if user has ANY of the technical settings permissions
    if (item.to === '/admin/settings') {
      const subPerms = ['settings:view', 'team:view', 'integrations:view', 'role:manage']
      return subPerms.some(p => auth.hasPermission(p))
    }
    return auth.hasPermission(item.permission!)
  })
})



const routeTitles: Record<string, string> = {
  dashboard:        'Monitor de Sistema',
  'sales-analytics': 'Inteligencia de Ventas',
  company:          'Mi Empresa',
  integrations:     'Integraciones ERP',
  customers:        'Clientes',
  'admin-orders':    'Pedidos B2B',
  products:         'Catálogo de Productos',
  profile:          'Mi Perfil',
  'email-settings': 'Configuración de Email',
  'admin-support':   'Tickets de Soporte',
  'audit-logs':      'Logs de Auditoría',
}

const pageTitle = computed(() => routeTitles[route.name as string] ?? 'NexoB2B')
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})
</script>
