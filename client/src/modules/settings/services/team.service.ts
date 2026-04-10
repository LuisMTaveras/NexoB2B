import api from '@/services/api'

export const teamService = {
  // Employees
  async listUsers() {
    const { data } = await api.get('/company-users')
    return data.data
  },
  async inviteUser(userData: any) {
    const { data } = await api.post('/company-users/invite', userData)
    return data.data
  },
  async updateUser(id: string, userData: any) {
    const { data } = await api.patch(`/company-users/${id}`, userData)
    return data.data
  },
  async deleteUser(id: string) {
    const { data } = await api.delete(`/company-users/${id}`)
    return data.data
  },

  // Roles & Permissions
  async listPermissions() {
    const { data } = await api.get('/roles/permissions')
    return data.data
  },
  async listRoles() {
    const { data } = await api.get('/roles')
    return data.data
  },
  async createRole(roleData: any) {
    const { data } = await api.post('/roles', roleData)
    return data.data
  },
  async updateRole(id: string, roleData: any) {
    const { data } = await api.patch(`/roles/${id}`, roleData)
    return data.data
  },
  async deleteRole(id: string) {
    const { data } = await api.delete(`/roles/${id}`)
    return data.data
  }
}
