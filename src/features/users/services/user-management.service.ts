import client from '@/shared/api/client'
import type {
  UserFormValues,
  UserManagementPage,
  UserManagementQuery,
  UserManagementStats,
} from '@/features/users/types/user-management'

export const userManagementService = {
  async getUsers(query: UserManagementQuery) {
    return client.get<UserManagementPage>('/users', {
      params: query,
    })
  },

  async getUserStats() {
    return client.get<UserManagementStats>('/users/stats')
  },

  async createUser(payload: UserFormValues) {
    return client.post<null>('/users', payload)
  },

  async updateUser(userId: string, payload: UserFormValues) {
    return client.patch<null>(`/users/${userId}`, payload)
  },

  async deleteUser(userId: string) {
    return client.delete<null>(`/users/${userId}`)
  },
}
