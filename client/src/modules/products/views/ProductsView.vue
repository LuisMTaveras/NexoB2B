<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Catálogo de Productos</h2>
        <p class="page-subtitle">Productos y listas de precios sincronizados desde el ERP</p>
      </div>
    </div>
    <div class="card flex items-center justify-center py-16 text-center text-[var(--color-brand-400)]">
      <div>
        <Icon icon="mdi:package-variant-closed" class="w-12 h-12 mb-3 opacity-40 mx-auto" />
        <p class="text-sm font-medium">Sin productos sincronizados</p>
        <p class="text-xs mt-1">Los productos se importarán desde tu ERP</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>
