<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Mi Empresa</h2>
        <p class="page-subtitle">Perfil, branding y configuración general</p>
      </div>
    </div>
    <div class="card flex items-center justify-center py-16 text-center text-[var(--color-brand-400)]">
      <div>
        <Icon icon="mdi:office-building-outline" class="w-12 h-12 mb-3 opacity-40 mx-auto" />
        <p class="text-sm font-medium">Módulo en construcción</p>
        <p class="text-xs mt-1">Aquí podrás editar perfil, colores y dominio del portal</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>
