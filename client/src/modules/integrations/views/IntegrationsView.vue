<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Integraciones ERP</h2>
        <p class="page-subtitle">Conecta tu sistema ERP y sincroniza datos comerciales</p>
      </div>
      <div class="flex items-center gap-2">
        <router-link to="/admin/integrations/queue" class="btn btn-secondary">
          <Icon icon="mdi:monitor-dashboard" class="w-4 h-4" />
          Monitor de Cola
        </router-link>
        <button class="btn btn-primary" @click="openCreateModal">
          <Icon icon="mdi:plus" class="w-4 h-4" />
          Nueva integración
        </button>
      </div>
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
            <span v-if="getResourceStatus(integration, m.resource)" class="flex items-center ml-1">
              <Icon 
                :icon="getStatusConfig(getResourceStatus(integration, m.resource)).icon" 
                :class="[getStatusConfig(getResourceStatus(integration, m.resource)).color, getStatusConfig(getResourceStatus(integration, m.resource)).animate]"
                class="w-3 h-3"
              />
            </span>
            <span v-else class="w-1.5 h-1.5 rounded-full" :class="m.isActive ? 'bg-emerald-400' : 'bg-slate-300'"></span>
          </span>
          <span v-if="integration.mappings.length === 0" class="text-xs text-[var(--color-brand-400)] italic">
            Sin recursos configurados — agrega mappings
          </span>
        </div>

        <!-- Last job status -->
        <div v-if="integration.syncJobs?.length" class="border-t border-[var(--color-brand-100)] pt-3">
          <div v-for="lastJob in integration.syncJobs.slice(0, 1)" :key="lastJob.id" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-[var(--color-brand-500)] uppercase tracking-tight">Actividad Reciente:</span>
              <Icon icon="mdi:information-outline" class="w-3.5 h-3.5 text-[var(--color-brand-300)] cursor-help" title="Muestra el estado del último proceso de sincronización ejecutado." />
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="badge" :class="getStatusConfig(lastJob.status).badge">
                <Icon 
                  :icon="getStatusConfig(lastJob.status).icon" 
                  :class="[getStatusConfig(lastJob.status).animate, 'mr-1']" 
                  class="w-3.5 h-3.5" 
                />
                {{ lastJob.status }}
              </span>
              <span class="text-[var(--color-brand-500)] font-medium">
                <span class="text-emerald-600">✓ {{ lastJob.recordsOk }}</span>
                <span v-if="lastJob.recordsFailed > 0" class="text-rose-500 ml-2">
                   ❌ {{ lastJob.recordsFailed }}
                </span>
              </span>
              <button class="text-[var(--color-accent-500)] font-bold hover:text-[var(--color-accent-700)] transition-colors" @click="openLogsModal(integration, lastJob)">
                Ver logs
              </button>
            </div>
          </div>
        </div>
        <div v-else class="border-t border-[var(--color-brand-100)] pt-3 text-center">
          <div class="flex items-center justify-center gap-2">
            <span class="text-xs text-[var(--color-brand-400)] italic">Sin actividad de sincronización reciente</span>
            <Icon icon="mdi:history" class="w-3.5 h-3.5 text-[var(--color-brand-300)] opacity-50" />
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Create Integration Modal ─────────────────────────────── -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-brand-100)]">
          <div>
            <h3 class="font-semibold text-[var(--color-brand-900)]">Nueva Integración ERP</h3>
            <p class="text-[10px] text-[var(--color-brand-400)] uppercase font-bold tracking-widest mt-0.5">Paso {{ createStep }} de 3</p>
          </div>
          <button @click="showCreateModal = false" class="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] p-1 rounded">✕</button>
        </div>

        <!-- Stepper Indicator -->
        <div class="px-6 py-4 bg-[var(--color-brand-50)] border-b border-[var(--color-brand-100)] flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-[var(--color-brand-400)]">
          <div class="flex items-center gap-2" :class="{ 'text-[var(--color-accent-600)]': createStep >= 1 }">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="createStep >= 1 ? 'border-[var(--color-accent-600)] bg-[var(--color-accent-600)] text-white' : 'border-[var(--color-brand-300)]'">1</span>
            Identidad
          </div>
          <div class="h-px bg-[var(--color-brand-200)] flex-1 mx-4"></div>
          <div class="flex items-center gap-2" :class="{ 'text-[var(--color-accent-600)]': createStep >= 2 }">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="createStep >= 2 ? 'border-[var(--color-accent-600)] bg-[var(--color-accent-600)] text-white' : 'border-[var(--color-brand-300)]'">2</span>
            Seguridad
          </div>
          <div class="h-px bg-[var(--color-brand-200)] flex-1 mx-4"></div>
          <div class="flex items-center gap-2" :class="{ 'text-[var(--color-accent-600)]': createStep >= 3 }">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="createStep >= 3 ? 'border-[var(--color-accent-600)] bg-[var(--color-accent-600)] text-white' : 'border-[var(--color-brand-300)]'">3</span>
            Prueba
          </div>
        </div>

        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="createIntegration" class="space-y-6">
            
            <!-- STEP 1: IDENTITY -->
            <div v-if="createStep === 1" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div class="p-4 bg-[var(--color-accent-50)] border border-[var(--color-accent-100)] rounded-xl flex gap-3">
                 <Icon icon="mdi:information-outline" class="w-5 h-5 text-[var(--color-accent-600)] shrink-0" />
                 <p class="text-xs text-[var(--color-accent-800)] leading-relaxed">
                   Comienza por nombrar tu conexión y proporcionar la URL base de la API de tu ERP.
                 </p>
              </div>
              <div>
                <label class="label">Nombre de la integración</label>
                <input v-model="createForm.name" class="input" placeholder="Ej: SAP Business One / Microsoft Dynamics" required />
              </div>
              <div>
                <label class="label">URL base del ERP</label>
                <div class="relative">
                  <Icon icon="mdi:web" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-400)] w-4 h-4" />
                  <input v-model="createForm.baseUrl" class="input pl-10" placeholder="https://api.empresa.com/v1" required />
                </div>
              </div>
            </div>

            <!-- STEP 2: SECURITY -->
            <div v-if="createStep === 2" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label class="label">Método de autenticación</label>
                <select v-model="createForm.authMethod" class="input">
                  <option value="API_KEY">API Key</option>
                  <option value="BEARER_TOKEN">Bearer Token</option>
                  <option value="BASIC_AUTH">Usuario / Contraseña</option>
                  <option value="OAUTH2">OAuth 2.0</option>
                </select>
              </div>

              <div class="border border-[var(--color-brand-200)] rounded-xl p-5 space-y-4 bg-[var(--color-brand-50)]/50">
                <template v-if="createForm.authMethod === 'API_KEY'">
                  <div>
                    <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">API Key</label>
                    <input v-model="createForm.credentials.apiKey" class="input" placeholder="sk_live_..." required />
                  </div>
                  <div>
                    <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Nombre del Header (Opcional)</label>
                    <input v-model="createForm.credentials.headerName" class="input" placeholder="X-API-Key" />
                  </div>
                </template>
                <template v-else-if="createForm.authMethod === 'BEARER_TOKEN'">
                  <div>
                    <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Bearer Token</label>
                    <textarea v-model="createForm.credentials.token" class="input text-xs font-mono" rows="3" placeholder="eyJ..." required></textarea>
                  </div>
                </template>
                <template v-else-if="createForm.authMethod === 'BASIC_AUTH'">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Usuario</label>
                      <input v-model="createForm.credentials.username" class="input" required />
                    </div>
                    <div>
                      <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Contraseña</label>
                      <input v-model="createForm.credentials.password" class="input" type="password" required />
                    </div>
                  </div>
                </template>
                <template v-else-if="createForm.authMethod === 'OAUTH2'">
                  <div class="space-y-3">
                    <div>
                      <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Token URL</label>
                      <input v-model="createForm.credentials.tokenUrl" class="input" placeholder="https://..." required />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Client ID</label>
                        <input v-model="createForm.credentials.clientId" class="input" required />
                      </div>
                      <div>
                        <label class="label text-xs uppercase font-bold text-[var(--color-brand-500)]">Client Secret</label>
                        <input v-model="createForm.credentials.clientSecret" class="input" type="password" required />
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- STEP 3: ADVANCED & TEST -->
            <div v-if="createStep === 3" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label class="label">Endpoint de prueba (opcional)</label>
                <input v-model="createForm.testEndpoint" class="input" placeholder="Ej: /health, /status o /ping" />
              </div>
              <div>
                <label class="label">Headers adicionales (JSON)</label>
                <textarea v-model="createForm.headersRaw" class="input font-mono text-xs" rows="3" placeholder='{"X-Tenant-ID": "123"}'></textarea>
              </div>
              
              <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <h4 class="text-xs font-bold text-indigo-900 uppercase mb-2">Resumen de Conexión</h4>
                <div class="grid grid-cols-2 gap-y-2 text-[11px]">
                  <span class="text-indigo-600 font-medium">Proveedor:</span>
                  <span class="text-indigo-900 font-bold truncate">{{ createForm.name || 'Sin nombre' }}</span>
                  <span class="text-indigo-600 font-medium">Método:</span>
                  <span class="text-indigo-900 font-bold">{{ authLabels[createForm.authMethod] }}</span>
                </div>
              </div>
            </div>

            <div v-if="createError" class="text-sm text-[var(--color-danger-500)] bg-[var(--color-danger-100)] rounded-lg px-3 py-2 border border-[var(--color-danger-200)]">
              {{ createError }}
            </div>

            <div class="flex justify-between items-center pt-2">
              <button type="button" class="btn btn-secondary" v-if="createStep === 1" @click="showCreateModal = false">Cancelar</button>
              <button type="button" class="btn btn-secondary" v-else @click="createStep--">
                <Icon icon="mdi:arrow-left" class="w-4 h-4" /> Anterior
              </button>
              
              <button 
                type="button" 
                class="btn btn-primary min-w-[120px]" 
                v-if="createStep < 3" 
                @click="createStep++"
                :disabled="!createForm.name || !createForm.baseUrl"
              >
                Siguiente <Icon icon="mdi:arrow-right" class="w-4 h-4" />
              </button>
              <button type="submit" class="btn btn-primary min-w-[120px]" v-else :disabled="creating">
                <Icon v-if="creating" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                {{ creating ? 'Configurando...' : 'Finalizar Alta' }}
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
                    <label class="label flex items-center justify-between">
                      Endpoint del ERP
                      <button 
                        v-if="mappingForm[resource].externalEndpoint"
                        @click="suggestMappings(resource)"
                        class="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100"
                        :disabled="suggesting[resource]"
                      >
                         <Icon :icon="suggesting[resource] ? 'mdi:loading' : 'mdi:auto-fix'" :class="{'animate-spin': suggesting[resource]}" />
                         {{ suggesting[resource] ? 'Analizando...' : 'Sugerir con IA' }}
                      </button>
                    </label>
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
                    <div class="text-[10px] text-[var(--color-brand-400)] text-right group relative z-50">
                      <span class="border-b border-dashed border-[var(--color-brand-300)] cursor-help">Formatos Avanzados</span>
                      
                      <!-- Tooltip flotante -->
                      <div class="absolute bottom-full right-0 mb-2 w-72 p-3 bg-slate-800 text-white rounded-lg shadow-xl invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 text-left transition-all pointer-events-none">
                        <strong class="text-[var(--color-accent-300)] block mb-1">Valores y Formatos Soportados:</strong>
                        <ul class="space-y-1">
                          <li>• <span class="font-mono text-emerald-300">campo.id</span> : Ruta JSON</li>
                          <li>• <span class="font-mono text-emerald-300">=VALOR</span> : Texto estático (Fijo)</li>
                          <li>• <span class="font-mono text-emerald-300">{{nombre}} - {{pais}}</span> : Plantilla interpolada</li>
                          <li>• <span class="font-mono text-emerald-300">__eval: record.id + "_"</span> : Código JS (Usa 'record')</li>
                        </ul>
                      </div>
                    </div>
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

                <!-- ─── Scheduling Section (Premium Corporate) ─────────────────────────── -->
                <div class="border border-[var(--color-brand-100)] rounded-2xl p-5 space-y-4 bg-[#F8FAFC] shadow-inner">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-white border border-[var(--color-brand-100)] shadow-sm flex items-center justify-center">
                         <Icon icon="mdi:clock-check-outline" class="w-5 h-5 text-[var(--color-accent-600)]" />
                      </div>
                      <div>
                        <p class="text-xs font-bold text-[var(--color-brand-800)] uppercase tracking-widest">Sincronización Automática</p>
                        <p class="text-[10px] text-[var(--color-brand-500)]">Define cuándo se ejecutará este mapping solo</p>
                      </div>
                    </div>
                    
                    <label class="inline-flex items-center cursor-pointer group">
                      <span class="text-xs font-bold text-[var(--color-brand-400)] group-hover:text-[var(--color-accent-600)] transition-colors mr-3 uppercase">
                        {{ mappingForm[resource].isScheduled ? 'Activo' : 'Inactivo' }}
                      </span>
                      <div class="relative">
                        <input type="checkbox" v-model="mappingForm[resource].isScheduled" class="sr-only" />
                        <div class="w-11 h-6 bg-slate-200 rounded-full transition-all duration-300" :class="mappingForm[resource].isScheduled ? 'bg-indigo-600' : ''"></div>
                        <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 transform" :class="mappingForm[resource].isScheduled ? 'translate-x-5' : 'translate-x-0'"></div>
                      </div>
                    </label>
                  </div>

                  <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 -translate-y-2 scale-95"
                    enter-to-class="opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 translate-y-0 scale-100"
                    leave-to-class="opacity-0 -translate-y-2 scale-95"
                  >
                    <div v-if="mappingForm[resource].isScheduled" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div class="space-y-1.5">
                          <label class="text-[10px] font-bold text-slate-500 uppercase ml-1">Frecuencia sugerida</label>
                          <div class="relative">
                            <select
                              v-model="mappingForm[resource].syncCronPreset"
                              class="input text-sm appearance-none pr-10"
                              @change="applyPreset(resource)"
                            >
                              <option value="custom">⚙️ Configuración Manual (Cron)</option>
                              <option value="*/15 * * * *">🕐 Cada 15 minutos</option>
                              <option value="0 * * * *">🕒 Cada hora</option>
                              <option value="0 */6 * * *">🕕 Cada 6 horas</option>
                              <option value="0 */12 * * *">🕛 Cada 12 horas</option>
                              <option value="0 2 * * *">📅 Diario a las 2 AM</option>
                            </select>
                            <Icon icon="mdi:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div class="space-y-1.5">
                          <label class="text-[10px] font-bold text-slate-500 uppercase ml-1">Expresión Cron experta</label>
                          <input
                            v-model="mappingForm[resource].syncCron"
                            class="input text-sm font-mono placeholder:text-slate-300"
                            placeholder="* * * * *"
                          />
                        </div>

                        <div class="col-span-1 sm:col-span-2 mt-1">
                          <div class="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                            <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                               <Icon icon="mdi:calendar-sync" class="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                               <p class="text-[10px] font-bold text-indigo-400 uppercase leading-none mb-1">Próximo evento sincronizado</p>
                               <p class="text-xs font-bold text-indigo-900 leading-none">
                                 {{ describeCron(mappingForm[resource].syncCron) }}
                               </p>
                            </div>
                          </div>
                        </div>
                    </div>
                  </Transition>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { Icon } from '@iconify/vue'
import {
  integrationsApi, RESOURCE_LABELS, RESOURCE_ICONS, DEFAULT_FIELD_MAPPINGS,
  type Integration, type SyncResource, type SyncJob
} from '@/services/integrations'

// ─── State ───────────────────────────────────────────────────────
const ALL_RESOURCES: SyncResource[] = ['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS']
const authLabels: Record<string, string> = { API_KEY: 'API Key', BEARER_TOKEN: 'Bearer Token', BASIC_AUTH: 'Basic Auth', OAUTH2: 'OAuth 2.0' }

const auth = useAuthStore()
const ui = useUiStore()
const integrations = ref<Integration[]>([])
const loading = ref(false)
const syncing = reactive<Record<string, boolean>>({})
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Create Wizard
const showCreateModal = ref(false)
const createStep = ref(1)
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

const mappingForm = reactive<Record<string, any>>({})
const suggesting = reactive<Record<string, boolean>>({})


// Logs modal
const showLogsModal = ref(false)
const selectedJob = ref<SyncJob | null>(null)
const logs = ref<any[]>([])
const logMeta = ref<any>(null)
const logPage = ref(1)
const logFilter = ref('')
const logsLoading = ref(false)

// ─── Methods ─────────────────────────────────────────────────────
// ─── Polling Logic ──────────────────────────────────────────────
let pollInterval: any = null

function startPolling() {
  if (pollInterval) return
  pollInterval = setInterval(() => {
    const hasActiveJobs = integrations.value.some(i => 
      i.syncJobs?.some(j => j.status === 'RUNNING' || j.status === 'PENDING')
    )
    if (hasActiveJobs) {
      loadQuiet() // Refresh without full loading spinner
    } else {
      stopPolling()
    }
  }, 5000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

async function load(showSpinner = true) {
  if (showSpinner) loading.value = true
  try {
    const res = await integrationsApi.list()
    integrations.value = res.data.data
    
    // Check if we need to continue/start polling
    const hasActiveJobs = integrations.value.some(i => 
      i.syncJobs?.some(j => j.status === 'RUNNING' || j.status === 'PENDING')
    )
    if (hasActiveJobs) startPolling()
    else stopPolling()

  } finally {
    if (showSpinner) loading.value = false
  }
}

async function loadQuiet() {
  try {
    const res = await integrationsApi.list()
    integrations.value = res.data.data
    // Stop polling if all jobs finished
    const hasActiveJobs = integrations.value.some(i => 
      i.syncJobs?.some(j => j.status === 'RUNNING' || j.status === 'PENDING')
    )
    if (!hasActiveJobs) stopPolling()
  } catch (err) {
    stopPolling() // Stop on error to prevent infinite retries if server down
  }
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => (toast.value = null), 3000)
}

function openCreateModal() {
  Object.assign(createForm, { name: '', baseUrl: '', authMethod: 'API_KEY', testEndpoint: '', credentials: {}, headersRaw: '' })
  createStep.value = 1
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
    ui.alert('Integración creada', 'La integración se creó correctamente', 'success')
    await load()
  } catch (err: any) {
    ui.alert('Error', err?.response?.data?.error ?? 'Error al crear integración', 'error')
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
    // Start polling immediately to catch the 'PENDING/RUNNING' state
    await load(false) 
    startPolling()
  } catch (err: any) {
    showToast('error', err?.response?.data?.error ?? 'Error al sincronizar')
  } finally {
    setTimeout(() => { syncing[integration.id] = false }, 1000)
  }
}

async function deleteIntegration(integration: Integration) {
  const confirmed = await ui.confirm(
    'Eliminar Integración',
    `¿Estás seguro que deseas eliminar "${integration.name}"? Esta acción no se puede deshacer.`
  )
  if (!confirmed) return
  
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
      fields: { ...DEFAULT_FIELD_MAPPINGS[r], ...existing?.fieldMappings },
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

async function suggestMappings(resource: SyncResource) {
  if (!selectedIntegration.value) return
  const endpoint = mappingForm[resource].externalEndpoint
  if (!endpoint) return

  suggesting[resource] = true
  try {
    const res = await integrationsApi.suggestMappings(selectedIntegration.value.id, {
      resource,
      endpoint
    })
    
    const { suggestedMappings } = res.data.data
    // Merge suggestions into current fields
    Object.assign(mappingForm[resource].fields, suggestedMappings)
    
    showToast('success', 'Se han aplicado sugerencias inteligentes para los campos.')
  } catch (err: any) {
    showToast('error', 'No se pudieron generar sugerencias. Verifica el endpoint.')
  } finally {
    suggesting[resource] = false
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

const getStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'PENDING':
      return {
        icon: 'mdi:clock-outline',
        color: 'text-slate-500',
        bg: 'bg-slate-100/80',
        badge: 'badge-neutral',
        animate: 'animate-pulse'
      }
    case 'RUNNING':
      return {
        icon: 'mdi:loading',
        color: 'text-blue-500',
        bg: 'bg-blue-100/80',
        badge: 'badge-info',
        animate: 'animate-spin'
      }
    case 'SUCCESS':
      return {
        icon: 'mdi:check-circle',
        color: 'text-emerald-500',
        bg: 'bg-emerald-100/80',
        badge: 'badge-success',
        animate: 'animate-success-pop'
      }
    case 'PARTIAL':
      return {
        icon: 'mdi:alert-circle-outline',
        color: 'text-amber-500',
        bg: 'bg-amber-100/80',
        badge: 'badge-warning',
        animate: ''
      }
    case 'FAILED':
      return {
        icon: 'mdi:alert-circle',
        color: 'text-rose-500',
        bg: 'bg-rose-100/80',
        badge: 'badge-danger',
        animate: 'animate-shake'
      }
    default:
      return {
        icon: 'mdi:help-circle-outline',
        color: 'text-slate-400',
        bg: 'bg-slate-50',
        badge: 'badge-neutral',
        animate: ''
      }
  }
}

const getResourceStatus = (integration: Integration, resource: SyncResource) => {
  if (!integration.syncJobs) return null
  const jobs = integration.syncJobs
    .filter(j => j.resource === resource)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return jobs[0]?.status ?? null
}

onMounted(load)
onUnmounted(stopPolling)
</script>
