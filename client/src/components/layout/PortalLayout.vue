<template>
  <div class="min-h-screen flex flex-col bg-slate-50/30 font-sans">
    <!-- Premium Horizontal Navigation -->
    <header class="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] transition-all duration-300 shadow-sm">
      <!-- Main Navbar -->
      <div class="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6 relative">
        <!-- Brand -->
        <div class="flex items-center gap-5 z-10 shrink-0">
           <div class="relative group cursor-pointer" @click="$router.push('/portal/dashboard')">
              <div class="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 border border-indigo-500 overflow-hidden transition-transform group-hover:scale-105 active:scale-95">
                 <img v-if="auth.company?.logo" :src="auth.company.logo" class="w-full h-full object-cover" />
                 <Icon v-else icon="mdi:alpha-n-box" class="text-white text-3xl" />
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
           </div>
           <div class="hidden sm:block border-l border-slate-100 pl-5">
              <p class="text-slate-900 font-black text-lg tracking-tight leading-none">{{ auth.company?.name || 'NexoB2B' }}</p>
              <p class="text-indigo-500 text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                 <Icon icon="mdi:office-building-marker" class="w-3 h-3" />
                 {{ auth.user?.customerName || 'Empresa Cliente' }}
              </p>
           </div>
        </div>

        <!-- Center: Horizontal Navigation Pills -->
        <nav class="hidden lg:flex items-center gap-1 flex-1 justify-center mx-4">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="whitespace-nowrap px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group flex items-center gap-2.5 border border-transparent"
            active-class="!text-indigo-600 bg-indigo-50 !border-indigo-100 shadow-sm"
          >
            <Icon :icon="item.icon" class="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <!-- Right Side -->
        <div class="flex items-center gap-3 sm:gap-5 z-10 shrink-0">
           <!-- Notifications -->
           <div class="relative">
             <button 
               @click="toggleNotifications" 
               class="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all relative group"
               :class="{'bg-indigo-50 text-indigo-600 border-indigo-100': notificationsOpen}"
             >
               <Icon icon="mdi:bell-outline" class="w-5 h-5 group-hover:scale-110 transition-transform" />
               <span v-if="unreadCount > 0" class="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
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

           <div class="w-px h-8 bg-slate-100 hidden sm:block"></div>

           <!-- User Dropdown -->
           <div class="relative">
              <button
                 @click="userMenuOpen = !userMenuOpen"
                 class="flex items-center gap-3 p-1 pr-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all group"
              >
                 <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100 border border-indigo-500 transition-transform group-hover:scale-105">
                   {{ initials }}
                 </div>
                  <div class="text-left hidden md:block">
                    <p class="text-xs font-black text-slate-800 leading-none truncate uppercase tracking-tight">{{ auth.fullName }}</p>
                    <p class="text-[9px] text-indigo-500 font-black tracking-widest uppercase mt-1.5">
                      {{ auth.user?.role === 'ADMIN' ? 'Administrador' : 'Comprador' }}
                    </p>
                  </div>
                 <Icon icon="mdi:chevron-down" class="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all" :class="{ 'rotate-180': userMenuOpen }" />
              </button>

              <!-- Dropdown Menu -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-2"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-2"
              >
                <div v-if="userMenuOpen" class="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-slate-100 py-2 z-50">
                  <div class="px-5 py-4 border-b border-slate-50">
                    <p class="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Mi Cuenta</p>
                    <p class="text-sm font-black text-slate-800 truncate tracking-tight uppercase leading-none">{{ auth.fullName }}</p>
                    <p class="text-[11px] font-medium text-slate-400 truncate mt-1.5">{{ auth.user?.email }}</p>
                  </div>
                  <div class="py-2 px-2 space-y-0.5">
                    <RouterLink to="/portal/account/profile" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:account-circle-outline" class="w-5 h-5 text-slate-400" />
                      Mi Perfil
                    </RouterLink>
                    <RouterLink to="/portal/orders" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:package-variant" class="w-5 h-5 text-slate-400" />
                      Mis Pedidos
                    </RouterLink>
                    <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/portal/account/team" @click="userMenuOpen = false" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-all">
                      <Icon icon="mdi:account-group-outline" class="w-5 h-5 text-slate-400" />
                      Mi Equipo
                    </RouterLink>
                  </div>
                  <div class="py-2 px-2 border-t border-slate-50">
                    <button @mousedown.stop="auth.logout()" class="w-full text-left px-4 py-2.5 rounded-xl text-[13px] text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-bold transition-all group cursor-pointer border-none bg-transparent">
                      <Icon icon="mdi:logout-variant" class="w-5 h-5 pointer-events-none" />
                      <span class="pointer-events-none">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </Transition>
           </div>
           
           <button class="lg:hidden p-2.5 text-slate-600 bg-slate-50 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200" @click="mobileMenuOpen = !mobileMenuOpen">
              <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
           </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="mobileMenuOpen" class="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl absolute w-full left-0 shadow-2xl z-40">
           <nav class="flex flex-col p-4 space-y-2">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                active-class="!text-indigo-600 bg-indigo-50"
              >
                <Icon :icon="item.icon" class="w-5 h-5" />
                {{ item.label }}
              </RouterLink>
           </nav>
        </div>
      </Transition>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-8 relative pb-24">
      <RouterView />
    </main>

    <!-- Overlay to close menus -->
    <div v-if="userMenuOpen || notificationsOpen" @click="userMenuOpen = false; notificationsOpen = false" class="fixed inset-0 z-20"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { PortalNotification } from '@/types/portal'

const auth = useAuthStore()
const router = useRouter()
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)

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
    { to: '/portal/catalog',   icon: 'mdi:storefront-outline',      label: 'Catálogo' },
    { to: '/portal/orders',    icon: 'mdi:package-variant',         label: 'Pedidos' },
    { to: '/portal/invoices',  icon: 'mdi:file-document-outline',   label: 'Facturación' },
    { to: '/portal/support',   icon: 'mdi:headset',                 label: 'Soporte' },
    { to: '/portal/account',   icon: 'mdi:cog-outline',             label: 'Mi Cuenta' },
  ]
  
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

  // Background Session Monitor
  sessionInterval = window.setInterval(async () => {
    if (auth.isAuthenticated) {
      await auth.fetchMe()
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
</style>
