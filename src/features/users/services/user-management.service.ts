import client from '@/shared/api/client'
import type {
  UserFormValues,
  UserManagementPage,
  UserManagementQuery,
  UserManagementStats,
} from '@/features/users/types/user-management'

export const userManagementService = {
  async getUsers(query: UserManagementQuery) {
    return (await client.get<UserManagementPage>('/users', {
      params: query,
    })) as unknown as UserManagementPage
  },

  async getUserStats() {
    return (await client.get<UserManagementStats>('/users/stats')) as unknown as UserManagementStats
  },

  async createUser(payload: UserFormValues) {
    return (await client.post('/users', payload)) as unknown as null
  },

  async updateUser(userId: string, payload: UserFormValues) {
    return (await client.patch(`/users/${userId}`, payload)) as unknown as null
  },

  async deleteUser(userId: string) {
    return (await client.delete(`/users/${userId}`)) as unknown as null
  },
}
