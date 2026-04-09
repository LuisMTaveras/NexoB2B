<template>
  <div class="max-w-[1600px] mx-auto px-4 py-6">
    <!-- Premium Header -->
    <div class="mb-10">
      <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Configuraciones</h2>
      <p class="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
        <Icon icon="mdi:cog-outline" class="w-4 h-4" />
        Gestión técnica y cuenta empresarial
      </p>
    </div>

    <!-- Liquid Frost Tabs Navigation -->
    <div class="mb-8 p-1.5 bg-white/50 backdrop-blur-md rounded-[1.5rem] border border-white/80 shadow-sm inline-flex flex-wrap gap-2">
      <RouterLink
        to="/admin/settings/company"
        class="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
        active-class="bg-white text-indigo-600 shadow-[0_4px_15px_-5px_rgba(99,102,241,0.2)] border border-white"
        :class="$route.path.includes('/company') ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'"
      >
        <Icon icon="mdi:office-building-outline" class="w-5 h-5" />
        Mi Empresa
      </RouterLink>

      <RouterLink
        to="/admin/settings/integrations"
        class="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
        active-class="bg-white text-emerald-600 shadow-[0_4px_15px_-5px_rgba(16,185,129,0.2)] border border-white"
        :class="$route.path.includes('/integrations') ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'"
      >
        <Icon icon="mdi:api" class="w-5 h-5" />
        Integraciones ERP
      </RouterLink>

      <RouterLink
        to="/admin/settings/email"
        class="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
        active-class="bg-white text-amber-600 shadow-[0_4px_15px_-5px_rgba(245,158,11,0.2)] border border-white"
        :class="$route.path.includes('/email') ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'"
      >
        <Icon icon="mdi:email-outline" class="w-5 h-5" />
        Email SMTP
      </RouterLink>
    </div>

    <!-- Active Tab Content Container -->
    <div class="relative">
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
import { Icon } from '@iconify/vue'
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
