<template>
  <div>
    <div class="page-header mb-8">
      <div>
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Mis Pedidos</h2>
        <p class="text-sm text-slate-500 mt-1">Sigue el estado de tus compras en tiempo real.</p>
      </div>
    </div>
    <div class="card p-12 text-center border-dashed border-slate-200">
      <Icon icon="mdi:truck-delivery-outline" class="w-16 h-16 text-slate-200 mx-auto mb-4" />
      <h3 class="text-lg font-bold text-slate-700">Historial de Pedidos</h3>
      <p class="text-sm text-slate-500 max-w-xs mx-auto mt-2">Próximamente verás aquí el estado de tus pedidos levantados por vendedores o vía portal.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>
