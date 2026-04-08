<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Integraciones ERP</h2>
        <p class="page-subtitle">Conecta tu sistema ERP y sincroniza datos comerciales</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <Icon icon="mdi:plus" class="w-4 h-4" />
        Nueva integración
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-[var(--color-accent-500)]" />
    </div>

    <!-- Empty state -->
    <div v-else-if="integrations.length === 0" class="card flex flex-col items-center justify-center py-16 text-center">
      <div class="w-16 h-16 bg-[var(--color-accent-100)] rounded-2xl flex items-center justify-center mb-4">
        <Icon icon="mdi:api" class="w-8 h-8 text-[var(--color-accent-500)]" />
      </div>
      <h3 class="font-semibold text-[var(--color-brand-800)] mb-2">Sin integraciones configuradas</h3>
      <p class="text-sm text-[var(--color-brand-500)] max-w-sm mb-6">
        Conecta tu ERP para sincronizar automáticamente productos, clientes, precios, facturas y pedidos.
      </p>
      <button class="btn btn-primary" @click="openCreateModal">
        <Icon icon="mdi:plus" class="w-4 h-4" />Configurar primera integración
      </button>
    </div>

    <!-- Integration cards -->
    <div v-else class="space-y-4">
      <div
        v-for="integration in integrations"
        :key="integration.id"
        class="card hover:shadow-md transition-shadow"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[var(--color-brand-100)] flex items-center justify-center">
              <Icon icon="mdi:api" class="w-5 h-5 text-[var(--color-brand-600)]" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-[var(--color-brand-900)]">{{ integration.name }}</h3>
                <span class="badge" :class="integration.isActive ? 'badge-success' : 'badge-neutral'">
                  {{ integration.isActive ? 'Activa' : 'Pendiente' }}
                </span>
              </div>
              <p class="text-xs text-[var(--color-brand-500)] mt-0.5">{{ integration.baseUrl }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" @click="openMappingModal(integration)">
              <Icon icon="mdi:map-outline" class="w-4 h-4" />Mappings
            </button>
            <button
              class="btn btn-sm"
              :class="syncing[integration.id] ? 'btn-secondary' : 'btn-primary'"
              :disabled="syncing[integration.id]"
              @click="triggerSync(integration)"
            >
              <Icon :icon="syncing[integration.id] ? 'mdi:loading' : 'mdi:sync'" class="w-4 h-4" :class="{ 'animate-spin': syncing[integration.id] }" />
              {{ syncing[integration.id] ? 'Sincronizando...' : 'Sincronizar' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="testConnection(integration)">
              <Icon icon="mdi:wifi-check" class="w-4 h-4" />Probar
            </button>
            <button class="btn btn-secondary btn-sm text-[var(--color-danger-500)]" @click="deleteIntegration(integration)">
              <Icon icon="mdi:delete-outline" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Auth method -->
        <div class="flex items-center gap-4 text-xs text-[var(--color-brand-500)] mb-4">
          <span class="flex items-center gap-1">
            <Icon icon="mdi:key-outline" class="w-3.5 h-3.5" />
            {{ authLabels[integration.authMethod] }}
          </span>
          <span v-if="integration.lastSyncAt" class="flex items-center gap-1">
            <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5" />
            Última sync: {{ formatDate(integration.lastSyncAt) }}
          </span>
          <span v-else class="text-[var(--color-warning-500)]">Sin sincronizaciones</span>
        </div>

        <!-- Mappings pills -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="m in integration.mappings"
            :key="m.id"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-brand-100)] rounded-full text-xs text-[var(--color-brand-700)]"
          >
            <Icon :icon="RESOURCE_ICONS[m.resource]" class="w-3.5 h-3.5" />
            {{ RESOURCE_LABELS[m.resource] }}
            <span class="w-1.5 h-1.5 rounded-full" :class="m.isActive ? 'bg-green-500' : 'bg-gray-300'"></span>
          </span>
          <span v-if="integration.mappings.length === 0" class="text-xs text-[var(--color-brand-400)] italic">
            Sin recursos configurados — agrega mappings
          </span>
        </div>

        <!-- Last job status -->
        <div v-if="integration.syncJobs?.length" class="border-t border-[var(--color-brand-100)] pt-3">
          <div v-for="lastJob in integration.syncJobs.slice(0, 1)" :key="lastJob.id" class="flex items-center justify-between">
            <span class="text-xs text-[var(--color-brand-500)]">Último job:</span>
            <div class="flex items-center gap-3 text-xs">
              <span class="badge" :class="{
                'badge-neutral': lastJob.status === 'PENDING',
                'badge-info': lastJob.status === 'RUNNING',
                'badge-success': lastJob.status === 'SUCCESS',
                'badge-warning': lastJob.status === 'PARTIAL',
                'badge-danger': lastJob.status === 'FAILED',
              }">{{ lastJob.status }}</span>
              <span class="text-[var(--color-brand-500)]">
                ✓ {{ lastJob.recordsOk }}
                <span v-if="lastJob.recordsFailed > 0" class="text-[var(--color-danger-500)] ml-1">
                  ❌ {{ lastJob.recordsFailed }}
                </span>
              </span>
              <button class="text-[var(--color-accent-500)] hover:underline" @click="openLogsModal(integration, lastJob)">
                Ver logs
              </button>
            </div>
          </div>
        </div>
        <div v-else class="border-t border-[var(--color-brand-100)] pt-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[var(--color-brand-500)]">Último job:</span>
            <div class="text-xs text-[var(--color-brand-400)] italic">
              Sin actividad reciente
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Create Integration Modal ─────────────────────────────── -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-brand-100)]">
          <h3 class="font-semibold text-[var(--color-brand-900)]">Nueva Integración ERP</h3>
          <button @click="showCreateModal = false" class="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] p-1 rounded">✕</button>
        </div>
        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="createIntegration" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="label">Nombre de la integración</label>
                <input v-model="createForm.name" class="input" placeholder="ERP Contabilidad Pro" required />
              </div>
              <div class="col-span-2">
                <label class="label">URL base del ERP</label>
                <input v-model="createForm.baseUrl" class="input" placeholder="https://erp.miempresa.com/api" required />
              </div>
              <div>
                <label class="label">Método de autenticación</label>
                <select v-model="createForm.authMethod" class="input">
                  <option value="API_KEY">API Key</option>
                  <option value="BEARER_TOKEN">Bearer Token</option>
                  <option value="BASIC_AUTH">Usuario / Contraseña</option>
                  <option value="OAUTH2">OAuth 2.0</option>
                </select>
              </div>
              <div>
                <label class="label">Endpoint de prueba (opcional)</label>
                <input v-model="createForm.testEndpoint" class="input" placeholder="/health o /ping" />
              </div>
            </div>

            <!-- Dynamic credentials fields -->
            <div class="border border-[var(--color-brand-200)] rounded-lg p-4 space-y-3 bg-[var(--color-brand-50)]">
              <p class="text-xs font-medium text-[var(--color-brand-600)] uppercase tracking-wide">Credenciales</p>
              <template v-if="createForm.authMethod === 'API_KEY'">
                <div>
                  <label class="label">API Key</label>
                  <input v-model="createForm.credentials.apiKey" class="input" placeholder="sk_live_..." required />
                </div>
                <div>
                  <label class="label">Nombre del header (default: X-API-Key)</label>
                  <input v-model="createForm.credentials.headerName" class="input" placeholder="X-API-Key" />
                </div>
              </template>
              <template v-else-if="createForm.authMethod === 'BEARER_TOKEN'">
                <div>
                  <label class="label">Token</label>
                  <input v-model="createForm.credentials.token" class="input" placeholder="eyJ..." required />
                </div>
              </template>
              <template v-else-if="createForm.authMethod === 'BASIC_AUTH'">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Usuario</label>
                    <input v-model="createForm.credentials.username" class="input" required />
                  </div>
                  <div>
                    <label class="label">Contraseña</label>
                    <input v-model="createForm.credentials.password" class="input" type="password" required />
                  </div>
                </div>
              </template>
              <template v-else-if="createForm.authMethod === 'OAUTH2'">
                <div>
                  <label class="label">Token URL</label>
                  <input v-model="createForm.credentials.tokenUrl" class="input" placeholder="https://erp.com/oauth/token" required />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Client ID</label>
                    <input v-model="createForm.credentials.clientId" class="input" required />
                  </div>
                  <div>
                    <label class="label">Client Secret</label>
                    <input v-model="createForm.credentials.clientSecret" class="input" type="password" required />
                  </div>
                </div>
              </template>
            </div>

            <!-- Extra headers -->
            <div>
              <label class="label">Headers adicionales (JSON, opcional)</label>
              <textarea v-model="createForm.headersRaw" class="input font-mono text-xs" rows="2" placeholder='{"X-Company-ID": "123"}'></textarea>
            </div>

            <div v-if="createError" class="text-sm text-[var(--color-danger-500)] bg-[var(--color-danger-100)] rounded-lg px-3 py-2">
              {{ createError }}
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="creating">
                <Icon v-if="creating" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                {{ creating ? 'Creando...' : 'Crear integración' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ─── Mappings Modal ────────────────────────────────────────── -->
    <div v-if="showMappingModal && selectedIntegration" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-brand-100)]">
          <h3 class="font-semibold text-[var(--color-brand-900)]">Mappings — {{ selectedIntegration.name }}</h3>
          <button @click="showMappingModal = false" class="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] p-1 rounded">✕</button>
        </div>
        <div class="p-6 overflow-y-auto">
          <div class="space-y-6">
            <!-- Existing mappings -->
            <div v-for="resource in ALL_RESOURCES" :key="resource" class="border border-[var(--color-brand-200)] rounded-xl overflow-hidden">
              <div
                class="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                :class="expandedResource === resource ? 'bg-[var(--color-accent-100)]' : 'bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)]'"
                @click="toggleResource(resource)"
              >
                <div class="flex items-center gap-2">
                  <Icon :icon="RESOURCE_ICONS[resource]" class="w-4 h-4 text-[var(--color-brand-600)]" />
                  <span class="font-medium text-sm text-[var(--color-brand-800)]">{{ RESOURCE_LABELS[resource] }}</span>
                  <span
                    v-if="getMappingForResource(resource)"
                    class="badge badge-success text-xs"
                  >Configurado</span>
                  <span v-else class="badge badge-neutral text-xs">Sin configurar</span>
                </div>
                <Icon :icon="expandedResource === resource ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4 text-[var(--color-brand-400)]" />
              </div>

              <div v-if="expandedResource === resource" class="p-4 space-y-4 border-t border-[var(--color-brand-200)]">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">Endpoint del ERP</label>
                    <input v-model="mappingForm[resource].externalEndpoint" class="input font-mono text-sm" :placeholder="`/api/${resource.toLowerCase()}`" />
                  </div>
                  <div>
                    <label class="label">Tipo de paginación</label>
                    <select v-model="mappingForm[resource].paginationType" class="input">
                      <option value="none">Sin paginación</option>
                      <option value="page">Por página (page/limit)</option>
                      <option value="offset">Por offset</option>
                      <option value="cursor">Por cursor</option>
                    </select>
                  </div>
                  <template v-if="mappingForm[resource].paginationType !== 'none'">
                    <div v-if="mappingForm[resource].paginationType === 'page'">
                      <label class="label">Param de página</label>
                      <input v-model="mappingForm[resource].pageParam" class="input text-sm" placeholder="page" />
                    </div>
                    <div v-if="mappingForm[resource].paginationType === 'offset'">
                      <label class="label">Param de offset (Skip)</label>
                      <input v-model="mappingForm[resource].offsetParam" class="input text-sm" placeholder="skip" />
                    </div>
                    <div v-if="mappingForm[resource].paginationType === 'cursor'">
                      <label class="label">Param de cursor</label>
                      <input v-model="mappingForm[resource].cursorParam" class="input text-sm" placeholder="cursor" />
                    </div>
                    <div v-if="mappingForm[resource].paginationType === 'cursor'">
                      <label class="label">Ruta del siguiente cursor</label>
                      <input v-model="mappingForm[resource].nextCursorPath" class="input text-sm font-mono" placeholder="meta.next_cursor" />
                    </div>
                    <div>
                      <label class="label">Param de tamaño (Limit)</label>
                      <input v-model="mappingForm[resource].pageSizeParam" class="input text-sm" placeholder="limit" />
                    </div>
                    <div>
                      <label class="label">Registros por página</label>
                      <input v-model.number="mappingForm[resource].pageSize" type="number" class="input text-sm" placeholder="100" />
                    </div>
                    <div>
                      <label class="label">Ruta del array en respuesta</label>
                      <input v-model="mappingForm[resource].dataPath" class="input font-mono text-sm" placeholder="data.results" />
                    </div>
                    <div>
                      <label class="label">Ruta del total en respuesta</label>
                      <input v-model="mappingForm[resource].totalPath" class="input font-mono text-sm" placeholder="total" />
                    </div>
                  </template>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="label mb-0">Mapeo de campos</label>
                    <span class="text-xs text-[var(--color-brand-400)]">campo interno → campo del ERP (o =VALOR_FIJO)</span>
                  </div>
                  <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                    <div
                      v-for="(extField, intField) in mappingForm[resource].fields"
                      :key="intField"
                      class="flex items-center gap-2"
                    >
                      <div class="w-40 text-xs font-mono text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded px-2 py-1.5 flex-shrink-0">
                        {{ intField }}
                      </div>
                      <Icon icon="mdi:arrow-right" class="w-4 h-4 text-[var(--color-brand-400)] flex-shrink-0" />
                      <input
                        v-model="mappingForm[resource].fields[intField]"
                        class="input text-sm font-mono flex-1"
                        :placeholder="`campo del ERP o =VALOR_FIJO`"
                      />
                    </div>
                  </div>
                  <button class="text-xs text-[var(--color-accent-500)] mt-2 hover:underline flex items-center gap-1" @click="addCustomField(resource)">
                    <Icon icon="mdi:plus" class="w-3 h-3" /> Agregar campo personalizado
                  </button>
                </div>

                <!-- ─── Scheduling Section ─────────────────────────── -->
                <div class="border border-[var(--color-brand-200)] rounded-xl p-4 space-y-3 bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-accent-50)]">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Icon icon="mdi:clock-outline" class="w-4 h-4 text-[var(--color-accent-600)]" />
                      <p class="text-xs font-semibold text-[var(--color-brand-700)] uppercase tracking-wide">Automatización (Scheduler)</p>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs text-[var(--color-brand-500)]">Activar</span>
                      <div class="relative">
                        <input type="checkbox" v-model="mappingForm[resource].isScheduled" class="sr-only" />
                        <div class="w-9 h-5 rounded-full transition-colors" :class="mappingForm[resource].isScheduled ? 'bg-[var(--color-accent-500)]' : 'bg-[var(--color-brand-300)]'"></div>
                        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" :class="mappingForm[resource].isScheduled ? 'translate-x-4' : 'translate-x-0'"></div>
                      </div>
                    </label>
                  </div>

                  <div v-if="mappingForm[resource].isScheduled" class="space-y-3 pt-1">
                    <div>
                      <label class="label">Frecuencia</label>
                      <select
                        v-model="mappingForm[resource].syncCronPreset"
                        class="input text-sm"
                        @change="applyPreset(resource)"
                      >
                        <option value="custom">Personalizada (Cron)</option>
                        <option value="*/15 * * * *">Cada 15 minutos</option>
                        <option value="0 * * * *">Cada hora</option>
                        <option value="0 */6 * * *">Cada 6 horas</option>
                        <option value="0 */12 * * *">Cada 12 horas</option>
                        <option value="0 2 * * *">Diario a las 2 AM</option>
                        <option value="0 3 * * 1">Semanal (Lunes 3 AM)</option>
                        <option value="0 4 1 * *">Mensual (Día 1, 4 AM)</option>
                      </select>
                    </div>
                    <div>
                      <label class="label">Expresión Cron</label>
                      <input
                        v-model="mappingForm[resource].syncCron"
                        class="input text-sm font-mono"
                        placeholder="0 2 * * * (diario a las 2 AM)"
                      />
                      <p class="text-xs text-[var(--color-brand-400)] mt-1">
                        Formato: minuto hora día-mes mes día-semana · Zona horaria: America/Santo_Domingo
                      </p>
                    </div>
                    <div v-if="mappingForm[resource].syncCron" class="flex items-center gap-2 px-3 py-2 bg-[var(--color-accent-100)] rounded-lg">
                      <Icon icon="mdi:information-outline" class="w-4 h-4 text-[var(--color-accent-600)]" />
                      <span class="text-xs text-[var(--color-accent-700)]">
                        Próxima ejecución: {{ describeCron(mappingForm[resource].syncCron) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2">
                  <button
                    v-if="getMappingForResource(resource)"
                    class="btn btn-secondary btn-sm text-[var(--color-danger-500)]"
                    @click="deleteMapping(resource)"
                  >
                    <Icon icon="mdi:delete-outline" class="w-4 h-4" />Eliminar
                  </button>
                  <button class="btn btn-primary btn-sm" @click="saveMapping(resource)" :disabled="savingMapping[resource]">
                    <Icon v-if="savingMapping[resource]" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                    {{ getMappingForResource(resource) ? 'Actualizar' : 'Guardar' }} mapping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Logs Modal ───────────────────────────────────────────── -->
    <div v-if="showLogsModal && selectedJob" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-brand-100)]">
          <h3 class="font-semibold text-[var(--color-brand-900)]">Logs — {{ RESOURCE_LABELS[selectedJob.resource as SyncResource] }}</h3>
          <button @click="showLogsModal = false" class="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] p-1 rounded">✕</button>
        </div>
        <div class="p-6 overflow-y-auto">
          <div class="flex items-center gap-4 mb-4 text-sm">
            <span class="badge" :class="{
              'badge-neutral': selectedJob.status === 'PENDING',
              'badge-info': selectedJob.status === 'RUNNING',
              'badge-success': selectedJob.status === 'SUCCESS',
              'badge-warning': selectedJob.status === 'PARTIAL',
              'badge-danger': selectedJob.status === 'FAILED',
            }">{{ selectedJob.status }}</span>
            <span class="text-[var(--color-brand-600)]">
              ✅ {{ selectedJob.recordsOk }} procesados
              <span v-if="selectedJob.recordsFailed > 0" class="text-[var(--color-danger-500)] ml-2">
                ❌ {{ selectedJob.recordsFailed }} fallidos
              </span>
            </span>
            <div class="ml-auto flex gap-2">
              <button class="btn btn-secondary btn-sm" :class="logFilter === '' ? 'ring-1 ring-[var(--color-accent-400)]' : ''" @click="setLogFilter('')">Todos</button>
              <button class="btn btn-secondary btn-sm" :class="logFilter === 'error' ? 'ring-1 ring-[var(--color-danger-400)]' : ''" @click="setLogFilter('error')">Errores</button>
              <button class="btn btn-secondary btn-sm" :class="logFilter === 'warn' ? 'ring-1 ring-[var(--color-warning-400)]' : ''" @click="setLogFilter('warn')">Warnings</button>
            </div>
          </div>

          <div class="bg-[var(--color-brand-950)] rounded-xl p-4 font-mono text-xs text-[var(--color-brand-300)] max-h-96 overflow-y-auto space-y-1">
            <div v-if="logsLoading" class="text-center py-4 text-[var(--color-brand-500)]">
              <Icon icon="mdi:loading" class="w-5 h-5 animate-spin inline mr-2" />Cargando logs...
            </div>
            <div v-else-if="logs.length === 0" class="text-center py-4 text-[var(--color-brand-600)]">Sin logs para mostrar</div>
            <div v-for="log in logs" :key="log.id" class="flex gap-2">
              <span class="text-[var(--color-brand-600)] flex-shrink-0">{{ formatTime(log.createdAt) }}</span>
              <span :class="{ 'text-[var(--color-danger-400)]': log.level === 'error', 'text-[var(--color-warning-400)]': log.level === 'warn', 'text-green-400': log.level === 'info' }">[{{ log.level.toUpperCase() }}]</span>
              <span class="text-[var(--color-brand-200)]">{{ log.message }}</span>
            </div>
          </div>

          <div v-if="logMeta" class="flex items-center justify-between mt-3 text-xs text-[var(--color-brand-500)]">
            <span>{{ logMeta.total }} logs totales</span>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" :disabled="logPage <= 1" @click="loadLogs(logPage - 1)">←</button>
              <span class="px-2 py-1">{{ logPage }} / {{ logMeta.totalPages }}</span>
              <button class="btn btn-secondary btn-sm" :disabled="logPage >= logMeta.totalPages" @click="loadLogs(logPage + 1)">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast (Premium Corporate Dark) -->
    <Transition
      enter-active-class="transform transition duration-400 ease-out"
      enter-from-class="translate-y-10 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 py-3.5 px-6 rounded-2xl bg-[#0F172A] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 min-w-[340px] max-w-md">
        <Icon :icon="toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'" 
              :class="toast.type === 'success' ? 'text-green-400' : 'text-red-400'"
              class="w-6 h-6 shrink-0" />
        <p class="text-[0.95rem] font-bold tracking-tight whitespace-nowrap">{{ toast.message }}</p>
        <div class="h-4 w-px bg-white/10 mx-1"></div>
        <button @click="toast = null" class="text-white/40 hover:text-white transition-colors">
          <Icon icon="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import {
  integrationsApi, RESOURCE_LABELS, RESOURCE_ICONS, DEFAULT_FIELD_MAPPINGS,
  type Integration, type SyncResource, type SyncJob
} from '@/services/integrations'

// ─── State ───────────────────────────────────────────────────────
const ALL_RESOURCES: SyncResource[] = ['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS']
const authLabels: Record<string, string> = { API_KEY: 'API Key', BEARER_TOKEN: 'Bearer Token', BASIC_AUTH: 'Basic Auth', OAUTH2: 'OAuth 2.0' }

const integrations = ref<Integration[]>([])
const loading = ref(false)
const syncing = reactive<Record<string, boolean>>({})
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Create modal
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = reactive({
  name: '', baseUrl: '', authMethod: 'API_KEY', testEndpoint: '',
  credentials: {} as Record<string, string>,
  headersRaw: '',
})

// Mapping modal
const showMappingModal = ref(false)
const selectedIntegration = ref<Integration | null>(null)
const expandedResource = ref<SyncResource | null>(null)
const savingMapping = reactive<Record<string, boolean>>({})

function initMappingForm() {
  const form: Record<string, any> = {}
  ALL_RESOURCES.forEach((r) => {
    const existing = getMappingForResource(r)
    form[r] = {
      externalEndpoint: existing?.externalEndpoint ?? '',
      paginationType: (existing?.paginationConfig?.type) ?? 'none',
      pageParam: existing?.paginationConfig?.pageParam ?? 'page',
      pageSizeParam: existing?.paginationConfig?.pageSizeParam ?? 'limit',
      pageSize: existing?.paginationConfig?.pageSize ?? 100,
      dataPath: existing?.paginationConfig?.dataPath ?? '',
      fields: { ...DEFAULT_FIELD_MAPPINGS[r], ...(existing?.fieldMappings ?? {}) },
    }
  })
  return form
}

const mappingForm = reactive<Record<string, any>>({})

// Logs modal
const showLogsModal = ref(false)
const selectedJob = ref<SyncJob | null>(null)
const logs = ref<any[]>([])
const logMeta = ref<any>(null)
const logPage = ref(1)
const logFilter = ref('')
const logsLoading = ref(false)

// ─── Methods ─────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const res = await integrationsApi.list()
    integrations.value = res.data.data
  } finally {
    loading.value = false
  }
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => (toast.value = null), 3000)
}

function openCreateModal() {
  Object.assign(createForm, { name: '', baseUrl: '', authMethod: 'API_KEY', testEndpoint: '', credentials: {}, headersRaw: '' })
  createError.value = ''
  showCreateModal.value = true
}

async function createIntegration() {
  creating.value = true
  createError.value = ''
  try {
    let headers: any = undefined
    if (createForm.headersRaw.trim()) {
      headers = JSON.parse(createForm.headersRaw)
    }
    await integrationsApi.create({
      name: createForm.name,
      baseUrl: createForm.baseUrl,
      authMethod: createForm.authMethod,
      credentials: { ...createForm.credentials },
      headers,
      testEndpoint: createForm.testEndpoint || undefined,
    })
    showCreateModal.value = false
    showToast('success', 'La integración se creó correctamente')
    await load()
  } catch (err: any) {
    createError.value = err?.response?.data?.error ?? 'Error al crear integración'
  } finally {
    creating.value = false
  }
}

async function testConnection(integration: Integration) {
  try {
    await integrationsApi.test(integration.id)
    showToast('success', 'La conexión se estableció con éxito')
    await load()
  } catch (err: any) {
    showToast('error', 'No se pudo validar la conexión')
  }
}

async function triggerSync(integration: Integration) {
  if (integration.mappings.length === 0) {
    showToast('error', 'Configura al menos un mapping primero')
    return
  }
  syncing[integration.id] = true
  try {
    await integrationsApi.sync(integration.id)
    showToast('success', 'Sincronización iniciada')
    setTimeout(() => load(), 2000)
  } catch (err: any) {
    showToast('error', err?.response?.data?.error ?? 'Error al sincronizar')
  } finally {
    setTimeout(() => { syncing[integration.id] = false }, 3000)
  }
}

async function deleteIntegration(integration: Integration) {
  if (!confirm(`¿Eliminar la integración "${integration.name}"? Esta acción no se puede deshacer.`)) return
  await integrationsApi.delete(integration.id)
  showToast('success', 'Integración eliminada')
  await load()
}

function openMappingModal(integration: Integration) {
  selectedIntegration.value = integration
  ALL_RESOURCES.forEach((r) => {
    const existing = integration.mappings.find((m) => m.resource === r)
    mappingForm[r] = {
      externalEndpoint: existing?.externalEndpoint ?? '',
      paginationType: (existing?.paginationConfig as any)?.type ?? 'none',
      pageParam: (existing?.paginationConfig as any)?.pageParam ?? 'page',
      offsetParam: (existing?.paginationConfig as any)?.offsetParam ?? 'skip',
      cursorParam: (existing?.paginationConfig as any)?.cursorParam ?? 'cursor',
      nextCursorPath: (existing?.paginationConfig as any)?.nextCursorPath ?? '',
      pageSizeParam: (existing?.paginationConfig as any)?.pageSizeParam ?? 'limit',
      pageSize: (existing?.paginationConfig as any)?.pageSize ?? 100,
      dataPath: (existing?.paginationConfig as any)?.dataPath ?? '',
      totalPath: (existing?.paginationConfig as any)?.totalPath ?? '',
      fields: { ...DEFAULT_FIELD_MAPPINGS[r], ...(existing?.fieldMappings ?? {}) },
      // Scheduling
      isScheduled: (existing as any)?.isScheduled ?? false,
      syncCron: (existing as any)?.syncCron ?? '',
      syncInterval: (existing as any)?.syncInterval ?? '',
      syncCronPreset: (existing as any)?.syncCron ?? 'custom',
    }
  })
  expandedResource.value = null
  showMappingModal.value = true
}

function getMappingForResource(resource: SyncResource) {
  return selectedIntegration.value?.mappings.find((m) => m.resource === resource)
}

function toggleResource(resource: SyncResource) {
  expandedResource.value = expandedResource.value === resource ? null : resource
}

function addCustomField(resource: SyncResource) {
  const fieldName = prompt('Nombre del campo interno (ej: brand, unit):')
  if (fieldName) mappingForm[resource].fields[fieldName] = ''
}

async function saveMapping(resource: SyncResource) {
  if (!selectedIntegration.value) return
  savingMapping[resource] = true
  const form = mappingForm[resource]
  try {
    const paginationConfig = form.paginationType === 'none' ? undefined : {
      type: form.paginationType,
      pageParam: form.pageParam,
      offsetParam: form.offsetParam,
      cursorParam: form.cursorParam,
      nextCursorPath: form.nextCursorPath || undefined,
      pageSizeParam: form.pageSizeParam,
      pageSize: form.pageSize,
      dataPath: form.dataPath || undefined,
      totalPath: form.totalPath || undefined,
    }
    await integrationsApi.createMapping(selectedIntegration.value.id, {
      resource,
      externalEndpoint: form.externalEndpoint,
      fieldMappings: form.fields,
      paginationConfig,
      isScheduled: form.isScheduled ?? false,
      syncCron: form.isScheduled && form.syncCron ? form.syncCron : null,
      syncInterval: form.isScheduled && form.syncCron ? describeCron(form.syncCron) : null,
    })
    showToast('success', `Mapping de ${RESOURCE_LABELS[resource]} guardado`)
    await load()
    selectedIntegration.value = integrations.value.find((i) => i.id === selectedIntegration.value!.id) ?? null
  } catch (err: any) {
    showToast('error', err?.response?.data?.error ?? 'Error al guardar mapping')
  } finally {
    savingMapping[resource] = false
  }
}

function applyPreset(resource: SyncResource) {
  const preset = mappingForm[resource].syncCronPreset
  if (preset !== 'custom') {
    mappingForm[resource].syncCron = preset
  }
}

function describeCron(cron: string): string {
  if (!cron) return ''
  const presets: Record<string, string> = {
    '*/15 * * * *': 'cada 15 minutos',
    '0 * * * *': 'cada hora',
    '0 */6 * * *': 'cada 6 horas',
    '0 */12 * * *': 'cada 12 horas',
    '0 2 * * *': 'diario a las 2:00 AM',
    '0 3 * * 1': 'semanal los lunes a las 3:00 AM',
    '0 4 1 * *': 'el 1ro de cada mes a las 4:00 AM',
  }
  return presets[cron] ?? `expresión: ${cron}`
}

async function deleteMapping(resource: SyncResource) {
  const mapping = getMappingForResource(resource)
  if (!mapping || !selectedIntegration.value) return
  await integrationsApi.deleteMapping(selectedIntegration.value.id, mapping.id)
  showToast('success', 'Mapping eliminado')
  await load()
  selectedIntegration.value = integrations.value.find((i) => i.id === selectedIntegration.value!.id) ?? null
}

async function openLogsModal(integration: Integration, job: SyncJob) {
  selectedIntegration.value = integration
  selectedJob.value = job
  logPage.value = 1
  logFilter.value = ''
  showLogsModal.value = true
  await loadLogs(1)
}

function setLogFilter(filter: string) {
  logFilter.value = filter
  loadLogs(1)
}

async function loadLogs(page: number) {
  if (!selectedIntegration.value || !selectedJob.value) return
  logsLoading.value = true
  logPage.value = page
  try {
    const res = await integrationsApi.jobLogs(
      selectedIntegration.value.id,
      selectedJob.value.id,
      { page, limit: 50, ...(logFilter.value && { level: logFilter.value }) }
    )
    logs.value = (res.data as any).data
    logMeta.value = (res.data as any).meta
  } finally {
    logsLoading.value = false
  }
}

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleString('es-DO')
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('es-DO')
}

onMounted(load)
</script>
