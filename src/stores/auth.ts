import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/user'

interface AuthState {
  currentUser: User | null
  token: string
  isLoggedIn: boolean
  isLoading: boolean

  // 计算属性（方法形式）
  userRole: () => UserRole | null
  isAdmin: () => boolean
  isTeacher: () => boolean
  isStudent: () => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean

  // 操作
  setUser: (user: User) => void
  setToken: (token: string) => void
  updateCachedUser: (partial: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: '',
      isLoggedIn: false,
      isLoading: false,

      userRole: () => get().currentUser?.role ?? null,
      isAdmin: () => get().currentUser?.role === 'admin',
      isTeacher: () => get().currentUser?.role === 'teacher',
      isStudent: () => get().currentUser?.role === 'student',
      hasRole: (roles) => {
        const role = get().currentUser?.role
        if (!role) return false
        const arr = Array.isArray(roles) ? roles : [roles]
        return arr.includes(role)
      },

      setUser: (user) => set({ currentUser: user, isLoggedIn: true }),
      setToken: (token) => set({ token }),
      updateCachedUser: (partial) => {
        const current = get().currentUser
        if (!current) return
        set({ currentUser: { ...current, ...partial } })
      },
      logout: () => set({ currentUser: null, token: '', isLoggedIn: false }),
    }),
    {
      name: 'lms-auth',
    },
  ),
)
