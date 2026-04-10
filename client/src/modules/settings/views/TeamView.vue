<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-sm p-6 rounded-4xl border border-white shadow-sm">
      <div>
        <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Mi Equipo</h3>
        <p class="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Gestiona los accesos de tus empleados</p>
      </div>
      <button 
        @click="openInviteModal"
        class="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-rose-200"
      >
        <Icon icon="mdi:account-plus" class="w-4 h-4" />
        Invitar Miembro
      </button>
    </div>

    <!-- Users Table -->
    <div class="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/50">
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Miembro</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rol / Cargo</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Última Actividad</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="5" class="px-8 py-10 text-center text-slate-300">Cargando datos...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="px-8 py-12 text-center">
                <div class="flex flex-col items-center gap-2 text-slate-400">
                  <Icon icon="mdi:account-off-outline" class="w-10 h-10 opacity-20" />
                  <p class="text-sm font-bold uppercase tracking-widest">No hay miembros registrados</p>
                </div>
              </td>
            </tr>
            <tr 
              v-for="user in users" 
              :key="user.id"
              class="group hover:bg-slate-50/50 transition-colors duration-200"
            >
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ user.firstName }} {{ user.lastName }}</p>
                    <p class="text-[11px] text-slate-400 font-medium">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <span 
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white"
                >
                  {{ user.role?.name || 'SIN ROL' }}
                </span>
              </td>
              <td class="px-8 py-6">
                <span 
                  class="inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em]"
                  :class="{
                    'bg-emerald-100 text-emerald-700': user.status === 'ACTIVE',
                    'bg-amber-100 text-amber-700': user.status === 'INVITED',
                    'bg-rose-100 text-rose-700': user.status === 'INACTIVE'
                  }"
                >
                  {{ user.status === 'ACTIVE' ? 'Activo' : user.status === 'INVITED' ? 'Invitado' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-8 py-6">
                <p class="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  {{ user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Sin actividad' }}
                </p>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="editUser(user)"
                    class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Icon icon="mdi:pencil-outline" class="w-5 h-5" />
                  </button>
                  <button 
                    v-if="user.id !== authStore.user?.id"
                    @click="deleteUser(user)"
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite/Edit Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        class="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h4 class="text-xl font-black text-slate-800 uppercase tracking-tight">{{ isEditing ? 'Editar Miembro' : 'Invitar Miembro' }}</h4>
          <button @click="showInviteModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon icon="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="handleInvite" class="p-8 space-y-5">
          <!-- Invite Link Warning (If SMTP failed) -->
          <div v-if="invitationResult?.invitationUrl && !invitationResult.emailSent" class="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
             <div class="flex items-center gap-2 text-amber-700">
               <Icon icon="mdi:alert" class="w-5 h-5" />
               <p class="text-xs font-bold uppercase tracking-tight">Correo no enviado (SMTP faltante)</p>
             </div>
             <p class="text-[10px] text-amber-600 leading-tight font-medium">Copia y envía este enlace manualmente al empleado:</p>
             <div class="flex gap-2">
               <input readonly :value="invitationResult.invitationUrl" class="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-[10px] font-mono text-amber-800 focus:outline-none" />
               <button type="button" @click="copyLink(invitationResult.invitationUrl)" class="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-lg transition-colors">
                 <Icon icon="mdi:content-copy" />
               </button>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre</label>
              <input 
                v-model="form.firstName"
                required
                type="text" 
                class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300 transition-all"
                placeholder="Ej. Juan"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Apellido</label>
              <input 
                v-model="form.lastName"
                required
                type="text" 
                class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300 transition-all"
                placeholder="Ej. Pérez"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Electrónico</label>
            <input 
              v-model="form.email"
              required
              type="email" 
              class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300 transition-all"
              placeholder="juan@empresa.com"
            />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rol Asignado</label>
            <select 
              v-model="form.roleId"
              required
              class="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 transition-all appearance-none"
            >
              <option value="" disabled>Selecciona un rol...</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }} {{ role.isSystem ? '(Sistema)' : '' }}
              </option>
            </select>
            <p v-if="!isEditing" class="text-[10px] text-slate-400 tracking-wide px-1">
              El empleado recibirá una invitación por correo para configurar su contraseña.
            </p>
          </div>

          <div class="pt-6 flex gap-3">
            <button 
              type="button"
              @click="showInviteModal = false"
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
              {{ invitationResult ? 'Cerrar' : 'Cancelar' }}
            </button>
            <button 
              v-if="!invitationResult"
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
            >
              {{ submitting ? 'Enviando...' : (isEditing ? 'Guardar Cambios' : 'Enviar Invitación') }}
            </button>
          </div>
        </form>
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
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { teamService } from '../services/team.service'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const submitting = ref(false)
const users = ref<any[]>([])
const roles = ref<any[]>([])
const showInviteModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const invitationResult = ref<{ invitationUrl: string; emailSent: boolean } | null>(null)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const form = ref({
  email: '',
  firstName: '',
  lastName: '',
  roleId: ''
})

function showToastMessage(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => (toast.value = null), 3500)
}

const copyLink = (link: string) => {
  navigator.clipboard.writeText(link)
  showToastMessage('success', 'Enlace copiado al portapapeles')
}

const fetchData = async () => {
  try {
    loading.value = true
    const [usersRes, rolesRes] = await Promise.all([
      teamService.listUsers(),
      teamService.listRoles()
    ])
    users.value = Array.isArray(usersRes) ? usersRes : []
    roles.value = Array.isArray(rolesRes) ? rolesRes : []
  } catch (err: any) {
    showToastMessage('error', 'Error al cargar datos del equipo')
    users.value = []
    roles.value = []
  } finally {
    loading.value = false
  }
}

const openInviteModal = () => {
  isEditing.value = false
  editingId.value = null
  invitationResult.value = null
  form.value = { email: '', firstName: '', lastName: '', roleId: '' }
  showInviteModal.value = true
}

const editUser = (user: any) => {
  isEditing.value = true
  editingId.value = user.id
  form.value = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId
  }
  showInviteModal.value = true
}

const handleInvite = async () => {
  try {
    submitting.value = true
    if (isEditing.value && editingId.value) {
      await teamService.updateUser(editingId.value, form.value)
      showToastMessage('success', 'Usuario actualizado')
      showInviteModal.value = false
    } else {
      const res = await teamService.inviteUser(form.value) as any
      if (res.invitationUrl && !res.emailSent) {
        invitationResult.value = { invitationUrl: res.invitationUrl, emailSent: false }
        showToastMessage('success', 'Usuario creado. Copia el enlace manual.')
      } else {
        showToastMessage('success', 'Invitación enviada exitosamente')
        showInviteModal.value = false
      }
    }
    await fetchData()
  } catch (err: any) {
    showToastMessage('error', err.response?.data?.error || 'Error al procesar la solicitud')
  } finally {
    submitting.value = false
  }
}

const deleteUser = async (user: any) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${user.firstName}?`)) return
  
  try {
    await teamService.deleteUser(user.id)
    showToastMessage('success', 'Usuario eliminado')
    await fetchData()
  } catch (err: any) {
    showToastMessage('error', err.response?.data?.error || 'Error al eliminar usuario')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-DO', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  })
}

onMounted(fetchData)
</script>
