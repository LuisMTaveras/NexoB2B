<template>
  <div class="max-w-[1600px] mx-auto px-4 py-6">
    <!-- Premium Header -->
    <div class="mb-10">
      <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Mi Cuenta</h2>
      <p class="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
        <Icon icon="mdi:cog-outline" class="w-4 h-4" />
        Gestión de perfil, equipo y preferencias de tu cuenta corporativa
      </p>
    </div>

    <!-- Liquid Frost Tabs Navigation -->
    <div class="mb-8 p-1.5 bg-white/50 backdrop-blur-md rounded-[1.5rem] border border-white/80 shadow-sm inline-flex flex-wrap gap-2">
      <template v-for="tab in filteredTabs" :key="tab.to">
        <RouterLink
          :to="tab.to"
          class="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
          :class="$route.path.includes(tab.pathMatch) ? `bg-white ${tab.activeColor} shadow-[0_4px_15px_-5px_rgba(99,102,241,0.2)] border border-white` : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'"
        >
          <Icon :icon="tab.icon" class="w-5 h-5 flex-shrink-0" />
          {{ tab.label }}
        </RouterLink>
      </template>
    </div>

    <!-- Active Tab Content Container -->
    <div class="relative min-h-[600px]">
      <Transition
        name="fade"
        mode="out-in"
      >
        <RouterView />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const tabs = computed(() => {
  const items = [
    { to: '/portal/account/profile',  icon: 'mdi:account-circle-outline', label: 'Mi Perfil',    activeColor: 'text-indigo-600', pathMatch: '/profile' },
  ]

  if (auth.user?.role === 'ADMIN') {
    items.push(
      { to: '/portal/account/team',    icon: 'mdi:account-group-outline',  label: 'Mi Equipo',    activeColor: 'text-violet-600', pathMatch: '/team' },
    )
  }

  return items
})

const filteredTabs = computed(() => tabs.value)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
