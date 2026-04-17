import client from '@/shared/api/client'
import type { AuthResponse, LoginRequest } from '@/features/auth/types/auth'
import type { User } from '@/shared/types/user'

export const authService = {
  login(data: LoginRequest): Promise<AuthResponse> {
    return client.post<AuthResponse>('/auth/login', data)
  },

  logout(): Promise<void> {
    return client.post<void>('/auth/logout')
  },

  getMe(): Promise<User> {
    return client.get<User>('/auth/me')
  },
}
