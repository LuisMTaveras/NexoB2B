<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { integrationsApi, RESOURCE_LABELS, RESOURCE_ICONS } from '@/services/integrations'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const loading = ref(true)
const stats = ref<any>(null)
const schedules = ref<any[]>([])
const recentJobs = ref<any[]>([])
const refreshing = ref(false)

async function load() {
  refreshing.value = true
  try {
    const res = await integrationsApi.getQueueStatus()
    const payload = res.data.data
    stats.value = payload.stats
    schedules.value = payload.schedules
    recentJobs.value = payload.recentJobs
  } catch (err) {
    console.error('Error loading queue status:', err)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

let interval: any = null
onMounted(() => {
  load()
  interval = setInterval(load, 10000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function formatDate(date: string) {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM, HH:mm:ss', { locale: es })
}

function getStatusClass(status: string) {
  switch (status) {
    case 'PENDING': return 'badge-neutral'
    case 'RUNNING': return 'badge-info'
    case 'SUCCESS': return 'badge-success'
    case 'FAILED': return 'badge-danger'
    case 'PARTIAL': return 'badge-warning'
    default: return 'badge-neutral'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Monitor de Sincronización</h2>
        <p class="page-subtitle">Estado del motor de colas y ejecuciones programadas</p>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="!loading" class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sistema Activo</span>
        </div>
        <button @click="load" class="btn btn-secondary btn-sm" :disabled="refreshing">
          <Icon icon="mdi:refresh" class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-[var(--color-accent-500)]" />
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="card p-5 border-l-4 border-l-blue-500">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase">Activos Ahora</span>
            <Icon icon="mdi:sync" class="w-5 h-5 text-blue-500" />
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats?.activeCount || 0 }}</div>
          <p class="text-[10px] text-gray-400 mt-1">Sincronizaciones en ejecución</p>
        </div>

        <div class="card p-5 border-l-4 border-l-amber-500">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase">En Espera</span>
            <Icon icon="mdi:clock-outline" class="w-5 h-5 text-amber-500" />
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats?.queuedCount || 0 }}</div>
          <p class="text-[10px] text-gray-400 mt-1">Pendientes por procesar</p>
        </div>

        <div class="card p-5 border-l-4 border-l-indigo-500">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase">Programaciones</span>
            <Icon icon="mdi:calendar-clock" class="w-5 h-5 text-indigo-500" />
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ schedules.length }}</div>
          <p class="text-[10px] text-gray-400 mt-1">Tareas configuradas con Cron</p>
        </div>

        <div class="card p-5 border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase">Historial (Queue)</span>
            <Icon icon="mdi:database-outline" class="w-5 h-5 text-emerald-500" />
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats?.totalCount || 0 }}</div>
          <p class="text-[10px] text-gray-400 mt-1">Total acumulado en motor pg-boss</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Schedules Table -->
        <div class="lg:col-span-1 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:calendar-sync" class="text-indigo-500" />
              Tares Programadas
            </h3>
          </div>
          <div v-if="schedules.length === 0" class="card py-10 text-center text-gray-400 items-center justify-center flex flex-col gap-2">
             <Icon icon="mdi:calendar-blank" class="w-8 h-8 opacity-20" />
             <p class="text-xs italic">No hay mappings programados activamente</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="sch in schedules" :key="sch.key" class="card p-4 hover:border-indigo-200 transition-colors">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="text-xs font-bold text-gray-700">{{ sch.integrationName }}</h4>
                  <div class="flex items-center gap-1.5 mt-1">
                    <Icon :icon="RESOURCE_ICONS[sch.resource]" class="w-3.5 h-3.5 text-gray-400" />
                    <span class="text-[10px] text-gray-500">{{ RESOURCE_LABELS[sch.resource] }}</span>
                  </div>
                </div>
                <div class="badge badge-neutral text-[9px] font-mono leading-none py-1">
                  {{ sch.cron }}
                </div>
              </div>
              <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <span class="text-[9px] text-gray-400 italic">Key: {{ sch.key.slice(0,8) }}...</span>
                <span class="text-[9px] text-indigo-600 font-medium">{{ sch.timezone }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Global Activity -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:history" class="text-emerald-500" />
              Actividad Global Reciente
            </h3>
          </div>
          <div class="card overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Integración</th>
                  <th class="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Recurso</th>
                  <th class="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th class="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Resultados</th>
                  <th class="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="job in recentJobs" :key="job.id" class="hover:bg-gray-50/50 transition-colors cursor-default">
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-800">{{ job.integration.name }}</div>
                    <div class="text-[10px] text-gray-400 font-mono">{{ job.id.slice(0,8) }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <Icon :icon="RESOURCE_ICONS[job.resource]" class="w-3.5 h-3.5 text-gray-400" />
                      {{ RESOURCE_LABELS[job.resource] }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge" :class="getStatusClass(job.status)">{{ job.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                       <span class="text-emerald-600 font-medium">{{ job.recordsOk }} OK</span>
                       <span v-if="job.recordsFailed > 0" class="text-rose-600 font-medium">{{ job.recordsFailed }} Fail</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-500">
                    {{ formatDate(job.createdAt) }}
                  </td>
                </tr>
                <tr v-if="recentJobs.length === 0">
                  <td colspan="5" class="px-4 py-10 text-center text-gray-400 italic">No hay actividad registrada aún.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
