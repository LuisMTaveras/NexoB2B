<template>
  <div class="min-h-screen flex bg-transparent font-sans">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-white/70 backdrop-blur-2xl flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30 transition-transform duration-300 border-r border-white/80 shadow-[10px_0_30px_-15px_rgba(15,23,42,0.1)]"
      :class="{ '-translate-x-full': !sidebarOpen, 'translate-x-0': sidebarOpen }"
    >
      <!-- Logo & Company Branding -->
      <div class="flex items-center gap-3 px-5 py-6 border-b border-[var(--color-brand-200)]/50">
        <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg overflow-hidden border border-white/20">
          <img v-if="auth.company?.logo" :src="auth.company.logo" class="w-full h-full object-cover" />
          <span v-else class="text-white font-black text-lg">N</span>
        </div>
        <div class="overflow-hidden">
          <p class="text-[var(--color-brand-900)] font-black text-sm leading-none tracking-tight truncate">{{ auth.company?.name || 'NexoB2B' }}</p>
          <p class="text-[var(--color-brand-500)] text-[10px] uppercase font-bold mt-1 tracking-widest opacity-70">Portal de Clientes</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--color-brand-700)] hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300 group"
          active-class="!text-indigo-600 !bg-indigo-50 font-bold shadow-sm"
        >
          <Icon :icon="item.icon" class="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Bottom Info -->
      <div class="p-4 border-t border-slate-100 bg-slate-50/30">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/80 shadow-sm">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Icon icon="mdi:person-check-outline" class="w-5 h-5" />
          </div>
          <div class="overflow-hidden">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tu Representante</p>
            <p class="text-xs font-bold text-slate-700 truncate">Ventas Corporativas</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header class="bg-white/40 backdrop-blur-xl border-b border-white/80 h-16 flex items-center px-8 sticky top-0 z-20 shadow-sm">
        <button
          class="md:hidden mr-4 text-slate-600"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon icon="mdi:menu" class="w-6 h-6" />
        </button>

        <h1 class="text-lg font-black text-slate-800 tracking-tight">{{ pageTitle }}</h1>

        <div class="ml-auto flex items-center gap-4">
          <!-- Quick Status -->
          <div class="hidden lg:flex items-center gap-3 mr-4">
             <div class="text-right">
                <p class="text-[10px] font-black text-slate-400 uppercase">Balance Pendiente</p>
                <p class="text-sm font-black text-slate-900 font-mono tracking-tighter">RD$ 0.00</p>
             </div>
             <div class="w-px h-8 bg-slate-200"></div>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                {{ initials }}
              </div>
              <Icon icon="mdi:chevron-down" class="w-4 h-4 text-slate-400" :class="{ 'rotate-180': userMenuOpen }" />
            </button>

            <!-- Dropdown -->
            <div v-if="userMenuOpen" class="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div class="px-4 py-3 border-b border-slate-50">
                <p class="text-sm font-bold text-slate-900 truncate">{{ auth.fullName }}</p>
                <p class="text-xs text-slate-500 truncate">{{ auth.user?.email }}</p>
              </div>
              <div class="py-1">
                <button @click="auth.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium">
                  <Icon icon="mdi:logout" class="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-8 bg-slate-50/20">
        <RouterView />
      </main>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(true)
const userMenuOpen = ref(false)
const isMobile = ref(false)

const navItems = computed(() => {
  const items = [
    { to: '/portal/dashboard', icon: 'mdi:view-grid-outline',       label: 'Inicio' },
    { to: '/portal/catalog',   icon: 'mdi:store-search-outline',   label: 'Catálogo de Productos' },
    { to: '/portal/orders',    icon: 'mdi:cart-check',             label: 'Mis Pedidos' },
    { to: '/portal/invoices',  icon: 'mdi:file-document-outline',  label: 'Facturación' },
  ]
  
  if (auth.user?.role === 'ADMIN') {
    items.push({ to: '/portal/team', icon: 'mdi:account-group-outline', label: 'Mi Equipo' })
  }
  
  items.push({ to: '/portal/profile',   icon: 'mdi:account-circle-outline',   label: 'Configuración' })
  
  return items
})

const routeTitles: Record<string, string> = {
  'portal-dashboard': 'Resumen General',
  'portal-catalog':   'Comprar Productos',
  'portal-orders':    'Historial de Pedidos',
  'portal-invoices':  'Estado de Cuenta',
  'portal-team':      'Gestión de Equipo',
  'portal-profile':   'Mi Perfil',
}

const pageTitle = computed(() => routeTitles[route.name as string] ?? 'Bienvenido')
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) sidebarOpen.value = false
  else sidebarOpen.value = true
}

let sessionInterval: number

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Background Session Monitor (Kill-Switch Enforcer) runs every 15s
  sessionInterval = window.setInterval(async () => {
    if (auth.isAuthenticated) {
      await auth.fetchMe() // Will trigger global 401 logout if revoked
    }
  }, 15000)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  clearInterval(sessionInterval)
})
</script>

<style scoped>
.router-link-active {
  position: relative;
}
</style>
