<template>
  <div class="min-h-screen flex flex-col bg-[var(--color-brand-50)]/30 font-sans">
    <!-- Top E-commerce Navigation -->
    <header class="bg-white/70 backdrop-blur-2xl border-b border-[var(--color-brand-100)] shadow-[0_10px_30px_-15px_rgba(15,23,42,0.1)] sticky top-0 z-30">
      <!-- Topmost small strip (Optional: for Balance/Agent) -->
      <div class="bg-[var(--color-brand-900)] text-white/80 text-[10px] uppercase tracking-widest py-1.5 px-4 sm:px-8 flex justify-between items-center font-bold">
        <div class="flex items-center gap-2">
           <Icon icon="mdi:headset" class="w-3.5 h-3.5" />
           <span>Ejecutivo de Cuenta: Portal</span>
        </div>
        <div class="flex items-center gap-2">
           <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5" />
           <span>Disponibilidad 24/7 B2B</span>
        </div>
      </div>
      
      <!-- Main Navbar -->
      <div class="px-4 sm:px-8 h-20 flex items-center justify-between gap-6 relative">
        <!-- Logo -->
        <div class="flex items-center gap-4 z-10 shrink-0">
           <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center shadow-md border border-[var(--color-accent-400)]/50 overflow-hidden ring-4 ring-white">
             <img v-if="auth.company?.logo" :src="auth.company.logo" class="w-full h-full object-cover" />
             <span v-else class="text-white font-black text-xl">N</span>
           </div>
           <div>
             <p class="text-[var(--color-brand-900)] font-black text-xl leading-none tracking-tight">{{ auth.company?.name || 'NexoB2B Store' }}</p>
             <p class="text-[var(--color-accent-600)] text-[9px] uppercase font-black tracking-widest mt-1">Corporate E-Commerce</p>
           </div>
        </div>

        <!-- Horizontal Nav -->
        <nav class="hidden lg:flex items-center gap-1.5 flex-1 justify-center absolute inset-x-0 h-full">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-4 py-2.5 rounded-full text-[13px] font-bold text-[var(--color-brand-600)] hover:text-[var(--color-accent-600)] hover:bg-[var(--color-accent-50)]/50 transition-all group flex items-center gap-2 border border-transparent"
            active-class="!text-[var(--color-accent-600)] bg-[var(--color-accent-50)] !border-[var(--color-accent-100)] shadow-sm shadow-[var(--color-accent-100)]/50"
          >
            <Icon :icon="item.icon" class="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
            <span class="tracking-tight">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <!-- Right Side (User Profile) -->
        <div class="flex items-center gap-4 z-10 shrink-0">
           <div class="relative">
             <button
                @click="userMenuOpen = !userMenuOpen"
                class="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-transparent hover:border-[var(--color-brand-200)]/50 transition-all font-medium group ring-2 ring-transparent focus:ring-[var(--color-accent-100)]"
             >
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-100)] to-[var(--color-accent-200)] flex items-center justify-center text-[var(--color-accent-700)] text-xs font-bold border border-[var(--color-accent-300)] shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
                  {{ initials }}
                </div>
                <div class="text-left hidden sm:block">
                  <p class="text-xs font-semibold text-[var(--color-brand-900)] leading-tight group-hover:text-[var(--color-accent-600)] transition-colors uppercase tracking-tight">{{ auth.fullName }}</p>
                  <p class="text-[10px] text-[var(--color-brand-500)] font-bold tracking-widest uppercase mt-0.5">{{ auth.user?.role === 'ADMIN' ? 'Administrador' : 'Comprador' }}</p>
                </div>
                <Icon icon="mdi:chevron-down" class="w-4 h-4 text-[var(--color-brand-400)] group-hover:text-[var(--color-brand-800)] transition-transform duration-300" :class="{ 'rotate-180': userMenuOpen }" />
             </button>

              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-2"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-2"
              >
                <div v-if="userMenuOpen" class="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-[var(--color-brand-200)]/80 py-2 z-50">
                  <div class="px-5 py-4 border-b border-[var(--color-brand-100)]">
                    <p class="text-[10px] font-black uppercase text-[var(--color-accent-600)] tracking-widest mb-1">Mi Cuenta</p>
                    <p class="text-sm font-semibold text-[var(--color-brand-900)] truncate tracking-tight">{{ auth.fullName }}</p>
                    <p class="text-[11px] font-medium text-[var(--color-brand-500)] truncate">{{ auth.user?.email }}</p>
                  </div>
                  <div class="py-2 px-2">
                    <button @click.stop.prevent="handleLogout" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-3 font-semibold transition-colors group">

                      <Icon icon="mdi:logout" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      Cerrar Sesión Segura
                    </button>

                  </div>
                </div>
              </Transition>
           </div>
           
           <button class="lg:hidden p-2.5 text-[var(--color-brand-600)] bg-white/60 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[var(--color-brand-200)]/50" @click="mobileMenuOpen = !mobileMenuOpen">
              <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
           </button>
        </div>
      </div>

      <!-- Mobile Menu (Drops down) -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="mobileMenuOpen" class="lg:hidden border-t border-[var(--color-brand-100)] bg-white/95 backdrop-blur-xl absolute w-full left-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-40">
           <nav class="flex flex-col p-4 space-y-2">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-5 py-4 rounded-xl text-[13px] font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-accent-600)] hover:bg-[var(--color-accent-50)] transition-all border border-transparent"
                active-class="!text-[var(--color-accent-600)] bg-[var(--color-accent-50)] border-[var(--color-accent-100)] shadow-sm"
              >
                <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[var(--color-brand-100)] shrink-0">
                  <Icon :icon="item.icon" class="w-4 h-4 opacity-70" />
                </div>
                {{ item.label }}
              </RouterLink>
           </nav>
        </div>
      </Transition>
    </header>

    <!-- Main Content Container (Centered like an E-Commerce) -->
    <main class="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-8 relative pb-24">
      <RouterView />
    </main>

    <!-- Overlay for User Menu to close when clicking outside -->
    <div v-if="userMenuOpen" @click="userMenuOpen = false" class="fixed inset-0 z-40"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)

function handleLogout() {
  userMenuOpen.value = false
  auth.logout()
}


const navItems = computed(() => {
  const items = [
    { to: '/portal/dashboard', icon: 'mdi:view-grid-outline',       label: 'Inicio' },
    { to: '/portal/catalog',   icon: 'mdi:storefront-outline',      label: 'Catálogo B2B' },
    { to: '/portal/orders',    icon: 'mdi:package-variant',         label: 'Mis Pedidos' },
    { to: '/portal/invoices',  icon: 'mdi:file-document-outline',   label: 'Facturación' },
    { to: '/portal/support',   icon: 'mdi:headset',                 label: 'Ayuda B2B' },
  ]
  
  if (auth.user?.role === 'ADMIN') {
    items.push({ to: '/portal/team', icon: 'mdi:account-group-outline', label: 'Delegados' })
  }
  
  items.push({ to: '/portal/profile',   icon: 'mdi:account-circle-outline',   label: 'Mi Perfil' })
  
  return items
})


const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})

let sessionInterval: number

onMounted(() => {
  // Background Session Monitor (Kill-Switch Enforcer) runs every 15s
  sessionInterval = window.setInterval(async () => {
    if (auth.isAuthenticated) {
      await auth.fetchMe() // Will trigger global 401 logout if revoked
    }
  }, 15000)
})

onUnmounted(() => {
  clearInterval(sessionInterval)
})
</script>

<style scoped>
.router-link-active {
  position: relative;
}
.hidden-scrollbar::-webkit-scrollbar {
  display: none;
}
.hidden-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
