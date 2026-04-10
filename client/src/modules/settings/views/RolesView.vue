<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-sm p-6 rounded-4xl border border-white shadow-sm">
      <div>
        <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Roles y Permisos</h3>
        <p class="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Define quién puede hacer qué en el sistema</p>
      </div>
      <button 
        @click="openCreateModal"
        class="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-violet-200"
      >
        <Icon icon="mdi:shield-plus" class="w-4 h-4" />
        Crear Rol Personalizado
      </button>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="role in roles" :key="role.id" 
        class="group bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white p-8 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-500 relative overflow-hidden"
      >
        <!-- System Indicator -->
        <div v-if="role.isSystem" class="absolute -top-1 -right-1">
          <div class="bg-violet-600 text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-2xl shadow-sm tracking-[0.2em]">
            Sistema
          </div>
        </div>

        <div class="flex items-start justify-between mb-6">
          <div class="p-4 rounded-2xl bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform duration-500">
            <Icon icon="mdi:shield-account" class="w-8 h-8" />
          </div>
          <div class="flex gap-1" v-if="!role.isSystem">
            <button @click="editRole(role)" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Icon icon="mdi:pencil-outline" class="w-5 h-5" />
            </button>
            <button @click="confirmDelete(role)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <h4 class="text-lg font-black text-slate-800 mb-2 uppercase">{{ role.name }}</h4>
        <p class="text-xs text-slate-500 font-medium leading-relaxed mb-6">{{ role.description || 'Sin descripción' }}</p>

        <!-- Stats -->
        <div class="flex items-center gap-4 pt-6 border-t border-slate-50">
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Permisos</p>
            <p class="text-sm font-black text-slate-700">{{ role.permissions?.length || 0 }}</p>
          </div>
          <div class="w-px h-8 bg-slate-100"></div>
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Usuarios</p>
            <p class="text-sm font-black text-slate-700">{{ role._count?.users || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Creator/Editor Modal -->
    <div v-if="showModal" class="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        class="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl border border-white overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
      >
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h4 class="text-xl font-black text-slate-800 uppercase tracking-tight">
            {{ isEditing ? 'Editar Rol' : 'Nuevo Rol Personalizado' }}
          </h4>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon icon="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Left: Basic Info -->
            <div class="md:col-span-1 space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre del Rol</label>
                <input 
                  v-model="form.name"
                  required
                  type="text" 
                  class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 placeholder:text-slate-300 transition-all"
                  placeholder="Ej. Comercial Externo"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descripción</label>
                <textarea 
                  v-model="form.description"
                  rows="4"
                  class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 placeholder:text-slate-300 transition-all resize-none"
                  placeholder="Explica qué funciones cumple este rol..."
                ></textarea>
              </div>

              <div class="p-6 bg-violet-50 rounded-3xl border border-violet-100">
                <p class="text-[10px] text-violet-700 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Icon icon="mdi:information-outline" class="w-4 h-4" />
                  Privilegios Modulares
                </p>
                <p class="text-xs text-violet-600/80 font-medium leading-relaxed">
                  Activa solo los permisos requeridos. Se recomienda dar acceso a 'Ver' para que los módulos sean visibles en el menú.
                </p>
              </div>
            </div>

            <!-- Right: Permissions Grid -->
            <div class="md:col-span-2 space-y-8">
              <div v-for="(perms, module) in groupedPermissions" :key="module" class="space-y-4">
                <h5 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  Módulo: {{ module }}
                </h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    v-for="p in perms" 
                    :key="p.id"
                    @click="togglePermission(p.id)"
                    class="flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none"
                    :class="form.permissionIds.includes(p.id) ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'"
                  >
                    <div 
                      class="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                      :class="form.permissionIds.includes(p.id) ? 'bg-indigo-600' : 'bg-slate-100'"
                    >
                      <Icon v-if="form.permissionIds.includes(p.id)" icon="mdi:check" class="text-white w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p class="text-[11px] font-black text-slate-800 uppercase tracking-tight">{{ p.name }}</p>
                      <p class="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1 italic">{{ p.code }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/30">
          <button 
            type="button"
            @click="showModal = false"
            class="px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cerrar
          </button>
          <div class="flex-1"></div>
          <button 
                @click="saveRole"
                :disabled="submitting || form.permissionIds.length === 0"
                class="bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-200 disabled:opacity-50"
              >
                {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar Rol' : 'Crear Rol') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification (Premium Corporate) -->
    <Transition
      enter-active-class="transform transition duration-400 ease-out"
      enter-from-class="translate-y-10 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 flex items-center gap-4 py-3.5 px-6 rounded-2xl bg-[#0F172A] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 min-w-[340px] max-w-md">
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
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { teamService } from '../services/team.service'

// Toast state
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => (toast.value = null), 3500)
}

const roles = ref<any[]>([])
const permissions = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const submitting = ref(false)

const form = ref({
  name: '',
  description: '',
  permissionIds: [] as string[]
})

const fetchData = async () => {
  try {
    loading.value = true
    const [rolesRes, permsRes] = await Promise.all([
      teamService.listRoles(),
      teamService.listPermissions()
    ])
    roles.value = Array.isArray(rolesRes) ? rolesRes : []
    permissions.value = Array.isArray(permsRes) ? permsRes : []
  } catch (err) {
    showToast('error', 'Error al cargar configurar de roles')
    roles.value = []
    permissions.value = []
  } finally {
    loading.value = false
  }
}

const groupedPermissions = computed(() => {
  if (!Array.isArray(permissions.value)) return {}
  return permissions.value.reduce((acc: any, p: any) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})
})

const togglePermission = (id: string) => {
  const index = form.value.permissionIds.indexOf(id)
  if (index > -1) {
    form.value.permissionIds.splice(index, 1)
  } else {
    form.value.permissionIds.push(id)
  }
}

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = ''
  form.value = { name: '', description: '', permissionIds: [] }
  showModal.value = true
}

const editRole = (role: any) => {
  isEditing.value = true
  editingId.value = role.id
  form.value = {
    name: role.name,
    description: role.description || '',
    permissionIds: Array.isArray(role.permissions) 
      ? role.permissions.map((p: any) => p.permissionId)
      : []
  }
  showModal.value = true
}

const saveRole = async () => {
  try {
    submitting.value = true
    if (isEditing.value) {
      await teamService.updateRole(editingId.value, form.value)
      showToast('success', 'Rol actualizado')
    } else {
      await teamService.createRole(form.value)
      showToast('success', 'Rol creado exitosamente')
    }
    showModal.value = false
    await fetchData()
  } catch (err: any) {
    showToast('error', err.response?.data?.error || 'No se pudo guardar el rol')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async (role: any) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar el rol ${role.name}?`)) return
  try {
    await teamService.deleteRole(role.id)
    showToast('success', 'Rol eliminado')
    await fetchData()
  } catch (err: any) {
    showToast('error', err.response?.data?.error || 'Error al eliminar rol')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
