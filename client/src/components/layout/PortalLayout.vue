<template>
  <div class="min-h-screen flex flex-col bg-(--color-brand-50)/30 font-sans">
    <GlobalSearch v-model="searchOpen" />
    <!-- Top E-commerce Navigation -->
    <header class="bg-white/70 backdrop-blur-2xl border-b border-(--color-brand-100) shadow-[0_10px_30px_-15px_rgba(15,23,42,0.1)] sticky top-0 z-30">
      <!-- Topmost small strip (Optional: for Balance/Agent) -->
      <div class="bg-(--color-brand-900) text-white/80 text-[10px] uppercase tracking-widest py-1.5 px-4 sm:px-8 flex justify-between items-center font-bold">
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
           <div class="w-12 h-12 rounded-2xl bg-linear-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md border border-accent-400/50 overflow-hidden ring-4 ring-white">
              <img v-if="auth.company?.logo" :src="auth.company.logo" class="w-full h-full object-cover" />
              <span v-else class="text-white font-black text-xl">N</span>
           </div>
            <div>
               <p class="text-(--color-brand-900) font-black text-xl leading-none tracking-tight">{{ auth.company?.name || 'NexoB2B Store' }}</p>
               <div class="flex items-center gap-1.5 mt-1">
                 <span class="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                 <p class="text-accent-600 text-[10px] uppercase font-black tracking-widest">{{ auth.user?.customerName || 'Portal Corporativo' }}</p>
               </div>
            </div>
        </div>

        <!-- Horizontal Nav -->
        <nav class="hidden lg:flex items-center gap-1.5 flex-1 justify-center absolute inset-x-0 h-full">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-4 py-2.5 rounded-full text-[13px] font-bold text-(--color-brand-600) hover:text-accent-600 hover:bg-(--color-accent-50)/50 transition-all group flex items-center gap-2 border border-transparent"
            active-class="!text-accent-600 bg-(--color-accent-50) !border-(--color-accent-100) shadow-sm shadow-[var(--color-accent-100)]/50"
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
                class="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-transparent hover:border-(--color-brand-200)/50 transition-all font-medium group ring-2 ring-transparent focus:ring-accent-100"
             >
                <div class="w-8 h-8 rounded-full bg-linear-to-br from-accent-100 to-(--color-accent-200) flex items-center justify-center text-(--color-accent-700) text-xs font-bold border-white border-2 shadow-sm group-hover:scale-105 transition-transform">
                  {{ initials }}
                </div>
                 <div class="text-left hidden sm:block">
                   <p class="text-xs font-bold text-(--color-brand-900) leading-tight group-hover:text-accent-600 transition-colors uppercase tracking-tight">{{ auth.fullName }}</p>
                   <p class="text-[9px] text-(--color-brand-500) font-black tracking-widest uppercase mt-0.5">
                     {{ auth.user?.role === 'ADMIN' ? 'Administrador de Cuenta' : 'Comprador Autorizado' }}
                   </p>
                 </div>
                <Icon icon="mdi:chevron-down" class="w-4 h-4 text-(--color-brand-400) group-hover:text-(--color-brand-800) transition-transform duration-300" :class="{ 'rotate-180': userMenuOpen }" />
             </button>

             <!-- Search Trigger -->
             <button 
               @click="searchOpen = true"
               class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 hover:bg-slate-100 rounded-xl border border-slate-200/50 transition-all text-slate-400 group"
             >
               <Icon icon="mdi:magnify" class="w-4 h-4 group-hover:text-indigo-600" />
               <span class="text-xs font-bold group-hover:text-slate-600">Buscar...</span>
               <span class="ml-4 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black shadow-xs">⌘K</span>
             </button>

             <!-- Notification Bell -->
             <div class="relative">
               <button 
                 @click="toggleNotifications" 
                 class="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
                 :class="{'text-indigo-600 bg-indigo-50': notificationsOpen}"
               >
                 <Icon icon="mdi:bell-outline" class="w-5 h-5" />
                 <span v-if="unreadCount > 0" class="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white ring-1 ring-rose-500/20 animate-bounce">
                   {{ unreadCount }}
                 </span>
               </button>

               <!-- Notifications Panel -->
               <Transition
                 enter-active-class="transition duration-200 ease-out"
                 enter-from-class="transform scale-95 opacity-0 translate-y-2"
                 enter-to-class="transform scale-100 opacity-100 translate-y-0"
                 leave-active-class="transition duration-150 ease-in"
                 leave-from-class="transform scale-100 opacity-100 translate-y-0"
                 leave-to-class="transform scale-95 opacity-0 translate-y-2"
               >
                 <div v-if="notificationsOpen" class="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-slate-200 py-0 z-50 overflow-hidden">
                   <div class="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                     <p class="text-[10px] font-black uppercase text-slate-500 tracking-widest">Notificaciones</p>
                     <p v-if="unreadCount > 0" class="text-[10px] font-bold text-indigo-600">{{ unreadCount }} nuevas</p>
                   </div>
                   <div class="max-h-[400px] overflow-y-auto">
                     <div v-if="!notifications.length" class="p-8 text-center">
                       <Icon icon="mdi:bell-off-outline" class="w-10 h-10 text-slate-200 mx-auto mb-2" />
                       <p class="text-xs text-slate-400 font-medium">Bandeja vacía</p>
                     </div>
                     <button 
                       v-for="notif in notifications" 
                       :key="notif.id"
                       @click="handleNotificationClick(notif)"
                       class="w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 group relative"
                       :class="{'bg-indigo-50/30': !notif.isRead}"
                     >
                       <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" :class="getNotifIconClass(notif.type)">
                         <Icon :icon="getNotifIcon(notif.type)" class="w-4 h-4" />
                       </div>
                       <div class="flex-1 min-w-0">
                         <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ notif.title }}</p>
                         <p class="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{{ notif.body }}</p>
                         <p class="text-[9px] text-slate-400 font-bold mt-1 uppercase">{{ formatRelativeTime(notif.createdAt) }}</p>
                       </div>
                       <div v-if="!notif.isRead" class="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-4 right-4"></div>
                     </button>
                   </div>
                   <div class="p-3 bg-slate-50 text-center border-t border-slate-100">
                     <button class="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">Limpiar todas</button>
                   </div>
                 </div>
               </Transition>
             </div>

              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-2"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-2"
              >
                <div v-if="userMenuOpen" class="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-(--color-brand-200)/80 py-2 z-50">
                  <div class="px-5 py-4 border-b border-(--color-brand-100)">
                    <p class="text-[10px] font-black uppercase text-accent-600 tracking-widest mb-1">Mi Cuenta</p>
                    <p class="text-sm font-semibold text-(--color-brand-900) truncate tracking-tight">{{ auth.fullName }}</p>
                    <p class="text-[11px] font-medium text-(--color-brand-500) truncate">{{ auth.user?.email }}</p>
                  </div>
                  <div class="py-2 px-2 space-y-0.5">
                    <RouterLink to="/portal/profile" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-(--color-brand-700) hover:bg-(--color-brand-50) flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:account-circle-outline" class="w-5 h-5 text-(--color-brand-400)" />
                      Mi Perfil
                    </RouterLink>
                    <RouterLink to="/portal/orders" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-(--color-brand-700) hover:bg-(--color-brand-50) flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:package-variant" class="w-5 h-5 text-(--color-brand-400)" />
                      Mis Pedidos
                    </RouterLink>
                    <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/portal/team" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-(--color-brand-700) hover:bg-(--color-brand-50) flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:account-group-outline" class="w-5 h-5 text-(--color-brand-400)" />
                      Mi Equipo
                    </RouterLink>
                  </div>
                  <div class="py-2 px-2 border-t border-(--color-brand-100)">
                    <button @mousedown.stop="auth.logout()" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-bold transition-all group cursor-pointer border-none bg-transparent">
                      <Icon icon="mdi:logout-variant" class="w-5 h-5 pointer-events-none" />
                      <span class="pointer-events-none">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </Transition>
           </div>
           
           <button class="lg:hidden p-2.5 text-(--color-brand-600) bg-white/60 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-(--color-brand-200)/50" @click="mobileMenuOpen = !mobileMenuOpen">
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
        <div v-if="mobileMenuOpen" class="lg:hidden border-t border-(--color-brand-100) bg-white/95 backdrop-blur-xl absolute w-full left-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-40">
           <nav class="flex flex-col p-4 space-y-2">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-5 py-4 rounded-xl text-[13px] font-semibold text-(--color-brand-700) hover:text-accent-600 hover:bg-(--color-accent-50) transition-all border border-transparent"
                active-class="!text-accent-600 bg-(--color-accent-50) border-(--color-accent-100) shadow-sm"
              >
                <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-(--color-brand-100) shrink-0">
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

    <!-- Overlay for User Menu to close when clicking outside - z-20 so it does NOT block the dropdown (z-50) -->
    <div v-if="userMenuOpen || notificationsOpen" @click="userMenuOpen = false; notificationsOpen = false" class="fixed inset-0 z-20"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import GlobalSearch from '@/components/portal/GlobalSearch.vue'
import type { PortalNotification } from '@/types/portal'

const auth = useAuthStore()
const router = useRouter()
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)
const searchOpen = ref(false)

// Notifications Logic
const notificationsOpen = ref(false)
const notifications = ref<PortalNotification[]>([])
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const fetchNotifications = async () => {
  try {
    const { data } = await api.get('/portal/notifications')
    notifications.value = data.data
  } catch (err) {
    console.error('Error fetching notifications:', err)
  }
}

const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) {
    userMenuOpen.value = false
    fetchNotifications()
  }
}

const handleNotificationClick = async (notif: PortalNotification) => {
  if (!notif.isRead) {
    try {
      await api.patch(`/portal/notifications/${notif.id}/read`)
      notif.isRead = true
    } catch (err) {
       console.error('Error marking as read:', err)
    }
  }
  
  if (notif.link) {
    notificationsOpen.value = false
    router.push(notif.link)
  }
}

const getNotifIcon = (type: PortalNotification['type']): string => {
  const map: Record<PortalNotification['type'], string> = {
    ORDER_STATUS: 'mdi:package-variant',
    INVOICE_DUE: 'mdi:file-alert-outline',
    TICKET_REPLY: 'mdi:message-text-outline',
    INFO: 'mdi:information-outline'
  }
  return map[type] || map.INFO
}

const getNotifIconClass = (type: PortalNotification['type']): string => {
  const map: Record<PortalNotification['type'], string> = {
    ORDER_STATUS: 'bg-indigo-100 text-indigo-600',
    INVOICE_DUE: 'bg-rose-100 text-rose-600',
    TICKET_REPLY: 'bg-emerald-100 text-emerald-600',
    INFO: 'bg-slate-100 text-slate-600'
  }
  return map[type] || map.INFO
}

const formatRelativeTime = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return new Date(date).toLocaleDateString()
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
  fetchNotifications()
  const notifInterval = setInterval(fetchNotifications, 120000)

  // Background Session Monitor (Kill-Switch Enforcer) runs every 15s
  sessionInterval = window.setInterval(async () => {
    if (auth.isAuthenticated) {
      await auth.fetchMe() // Will trigger global 401 logout if revoked
    }
  }, 15000)

  onUnmounted(() => {
    clearInterval(notifInterval)
    clearInterval(sessionInterval)
  })
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
