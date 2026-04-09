import type { User, UserRole } from '@/shared/types/user'

export interface UserManagementItem extends User {
  id: string
}

export interface UserManagementPage {
  items: UserManagementItem[]
  total: number
}

export interface UserManagementStats {
  total: number
  adminCount: number
  teacherCount: number
  studentCount: number
}

export interface UserManagementQuery {
  page?: number
  pageSize?: number
  role?: UserRole
  search?: string
}

export interface UserFormValues {
  username: string
  fullName?: string
  email: string
  role: UserRole
  password?: string
}
