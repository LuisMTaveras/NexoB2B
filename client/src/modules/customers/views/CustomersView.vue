<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Clientes</h2>
        <p class="page-subtitle">Gestiona acceso al portal de compradores</p>
      </div>
      <button class="btn btn-primary"><Icon icon="mdi:account-plus-outline" class="w-4 h-4" /> Invitar cliente</button>
    </div>
    <div class="card flex items-center justify-center py-16 text-center text-[var(--color-brand-400)]">
      <div>
        <Icon icon="mdi:account-group-outline" class="w-12 h-12 mb-3 opacity-40 mx-auto" />
        <p class="text-sm font-medium">Sin clientes sincronizados</p>
        <p class="text-xs mt-1">Conecta tu ERP para importar tus clientes</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>
