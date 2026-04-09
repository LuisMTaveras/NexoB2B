<template>
  <div>
    <div class="page-header mb-8 text-center pt-8">
      <div class="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-xl">
        {{ initials }}
      </div>
      <h2 class="text-2xl font-black text-slate-800 tracking-tight">{{ auth.fullName }}</h2>
      <p class="text-sm text-slate-500 mt-1">{{ auth.user?.email }}</p>
    </div>
    
    <div class="max-w-xl mx-auto space-y-6">
      <div class="card p-6">
        <h3 class="font-bold text-slate-800 mb-4">Seguridad</h3>
        <button class="btn btn-secondary w-full flex items-center justify-center gap-2">
           <Icon icon="mdi:shield-lock-outline" class="w-5 h-5 text-indigo-500" />
           Cambiar Contraseña
        </button>
      </div>
      
      <div class="text-center">
         <button @click="auth.logout()" class="text-sm font-black text-red-600 uppercase hover:underline">Cerrar Sesión Segura</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})
</script>
