<template>
  <div class="max-w-4xl mx-auto">
    <div class="page-header">
      <div>
        <h2 class="page-title text-2xl font-bold text-[var(--color-brand-900)]">Configuración de Email</h2>
        <p class="page-subtitle text-[var(--color-brand-500)]">Configura tu servidor SMTP para enviar invitaciones y notificaciones.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      <!-- Left: Simple Selector -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-[var(--color-brand-400)]">Proveedor</h3>
        <button 
          v-for="p in providers" 
          :key="p.id"
          class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
          :class="form.provider === p.id ? 'border-[var(--color-accent-500)] bg-[var(--color-accent-50)] text-[var(--color-accent-900)]' : 'border-[var(--color-brand-100)] bg-white hover:border-[var(--color-brand-300)]'"
          @click="selectProvider(p)"
        >
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm">
            <Icon :icon="p.icon" class="w-6 h-6" :class="p.color" />
          </div>
          <div>
            <p class="font-bold text-sm">{{ p.name }}</p>
            <p class="text-[10px] opacity-70">{{ p.desc }}</p>
          </div>
        </button>
      </div>

      <!-- Right: Form -->
      <div class="md:col-span-2 space-y-6">
        <div class="card p-8">
          <form @submit.prevent="saveConfig" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2" v-if="form.provider !== 'CUSTOM'">
                <div class="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <Icon icon="mdi:alert-circle-outline" class="w-5 h-5 text-amber-600 shrink-0" />
                  <p class="text-xs text-amber-800 leading-relaxed">
                    Para {{ form.provider === 'GMAIL' ? 'Gmail' : 'Outlook' }}, debes usar una <strong>Contraseña de Aplicación</strong>. 
                    No uses tu contraseña personal maestra por motivos de seguridad.
                  </p>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="label">Nombre del Remitente</label>
                <input v-model="form.fromName" class="input" placeholder="Ej: NexoB2B Support" required />
              </div>

              <div class="md:col-span-2">
                <label class="label">Correo de Envío (User)</label>
                <input v-model="form.smtpUser" class="input" placeholder="usuario@dominio.com" required />
              </div>

              <div>
                <label class="label">Contraseña / Token</label>
                <input v-model="form.password" type="password" class="input" placeholder="••••••••••••" required />
              </div>

              <div>
                <label class="label">Email de respuesta</label>
                <input v-model="form.fromAddress" class="input" placeholder="noreply@empresa.com" required />
              </div>

              <template v-if="form.provider === 'CUSTOM'">
                <div class="md:col-span-2 h-px bg-[var(--color-brand-100)] my-2"></div>
                <div class="md:col-span-2 h-px bg-[var(--color-brand-100)] my-2"></div>
                <div class="md:col-span-2">
                   <h4 class="text-xs font-bold uppercase text-[var(--color-brand-400)] mb-4">Servidores (Entrante/Saliente)</h4>
                </div>
                <div>
                   <label class="label text-[10px] uppercase font-bold text-indigo-500">Servidor SMTP (Salida)</label>
                   <input v-model="form.host" class="input" placeholder="smtp.dominio.com" required />
                </div>
                <div>
                   <label class="label text-[10px] uppercase font-bold text-indigo-500">Puerto SMTP</label>
                   <input v-model.number="form.port" type="number" class="input" placeholder="587" required />
                </div>
                <div>
                   <label class="label text-[10px] uppercase font-bold text-emerald-500">Servidor IMAP (Entrada)</label>
                   <input v-model="form.imapHost" class="input" placeholder="imap.dominio.com" required />
                </div>
                <div>
                   <label class="label text-[10px] uppercase font-bold text-emerald-500">Puerto IMAP</label>
                   <input v-model.number="form.imapPort" type="number" class="input" placeholder="993" required />
                </div>
              </template>
            </div>

            <div v-if="testResult" class="p-3 rounded-lg text-sm transition-all" :class="testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'">
              {{ testResult.message }}
            </div>

            <div class="flex items-center justify-between pt-4">
              <button 
                type="button" 
                class="btn btn-secondary border-none"
                @click="testConnection"
                :disabled="testing || !form.smtpUser || !form.password"
              >
                <Icon v-if="testing" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:connection" />
                {{ testing ? 'Probando...' : 'Probar Conexión' }}
              </button>

              <button type="submit" class="btn btn-primary min-w-[140px]" :disabled="saving">
                <Icon v-if="saving" icon="mdi:loading" class="animate-spin" />
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'

const ui = useUiStore()

const providers = [
  { id: 'GMAIL', name: 'Google Workspace', desc: 'Gmail, Google Auth', icon: 'logos:google-icon', color: '' },
  { id: 'OUTLOOK', name: 'Microsoft Outlook', desc: 'Outlook, Office 365', icon: 'logos:microsoft-icon', color: '' },
  { id: 'CUSTOM', name: 'Servidor Custom', desc: 'SMTP Personalizado', icon: 'mdi:server-network', color: 'text-indigo-500' },
]

const form = reactive({
  provider: 'GMAIL',
  host: 'smtp.gmail.com',
  port: 587,
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  smtpUser: '',
  password: '',
  fromAddress: '',
  fromName: '',
  useTLS: true
})

const saving = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

function selectProvider(p: any) {
  form.provider = p.id
  if (p.id === 'GMAIL') {
    form.host = 'smtp.gmail.com'
    form.port = 587
    form.imapHost = 'imap.gmail.com'
    form.imapPort = 993
  } else if (p.id === 'OUTLOOK') {
    form.host = 'smtp.office365.com'
    form.port = 587
    form.imapHost = 'outlook.office365.com'
    form.imapPort = 993
  }
}

async function loadConfig() {
  try {
    const res = await api.get('/settings/email')
    if (res.data.data) {
      Object.assign(form, res.data.data)
      form.password = '' // Don't bind encrypted password to text input
    }
  } catch (error) {
    console.error('Failed to load email config')
  }
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    await api.post('/settings/email/test', form)
    testResult.value = { success: true, message: '¡Conexión exitosa! El servidor SMTP está listo.' }
  } catch (error: any) {
    testResult.value = { success: false, message: error.response?.data?.details || 'Error al conectar con SMTP.' }
  } finally {
    testing.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await api.post('/settings/email', form)
    ui.alert('Configuración guardada', 'Los ajustes SMTP se han actualizado correctamente.', 'success')
  } catch {
    ui.alert('Error', 'No se pudo guardar la configuración de email. Revisa los datos e intenta de nuevo.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
