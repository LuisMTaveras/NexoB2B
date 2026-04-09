import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  type: 'internal' | 'customer'
}

export interface AuthCompany {
  id: string
  name: string
  slug: string
  logo?: string
  status: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token = ref<string | null>(localStorage.getItem('nexob2b_token'))
  const user = ref<AuthUser | null>(null)
  const company = ref<AuthCompany | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
  )

  function setTokens(accessToken: string) {
    token.value = accessToken
    localStorage.setItem('nexob2b_token', accessToken)
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setTokens(data.data.accessToken)
      company.value = data.data.company
      const target = data.data.user.type === 'internal' ? '/admin/dashboard' : '/portal/dashboard'
      router.push(target)
    } finally {
      loading.value = false
    }
  }

  async function register(payload: {
    companyName: string
    companySlug: string
    firstName: string
    lastName: string
    email: string
    password: string
  }) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/register', payload)
      setTokens(data.data.accessToken)
      company.value = data.data.company
      const target = data.data.user.type === 'internal' ? '/admin/dashboard' : '/portal/dashboard'
      router.push(target)
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data
      company.value = data.data.company
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    company.value = null
    localStorage.removeItem('nexob2b_token')
    router.push('/login')
  }

  async function updateProfile(payload: { firstName: string; lastName: string; email: string }) {
    loading.value = true
    try {
      const { data } = await api.put('/auth/profile', payload)
      user.value = data.data
      return data.data
    } finally {
      loading.value = false
    }
  }

  async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    loading.value = true
    try {
      await api.put('/auth/password', payload)
    } finally {
      loading.value = false
    }
  }

  return {
    token,
    user,
    company,
    loading,
    isAuthenticated,
    fullName,
    login,
    register,
    fetchMe,
    logout,
    updateProfile,
    changePassword,
  }
})
