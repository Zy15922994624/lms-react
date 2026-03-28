import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/shared/types/user'

interface AuthState {
  currentUser: User | null
  token: string
  isLoggedIn: boolean
  isLoading: boolean
  userRole: () => UserRole | null
  isAdmin: () => boolean
  isTeacher: () => boolean
  isStudent: () => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
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
        const currentRole = get().currentUser?.role
        if (!currentRole) return false
        const roleList = Array.isArray(roles) ? roles : [roles]
        return roleList.includes(currentRole)
      },

      setUser: (user) => set({ currentUser: user, isLoggedIn: true, isLoading: false }),
      setToken: (token) => set({ token, isLoggedIn: Boolean(token) }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearAuth: () => set({ currentUser: null, token: '', isLoggedIn: false, isLoading: false }),
      updateCachedUser: (partial) => {
        const currentUser = get().currentUser
        if (!currentUser) return
        set({ currentUser: { ...currentUser, ...partial } })
      },
      logout: () => set({ currentUser: null, token: '', isLoggedIn: false, isLoading: false }),
    }),
    {
      name: 'lms-auth',
    },
  ),
)
