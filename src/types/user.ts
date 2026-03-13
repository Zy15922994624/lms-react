// 用户相关类型
export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  id?: string
  username: string
  email: string
  fullName?: string
  role: UserRole
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

// 用户表单类型
export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  email?: string
  fullName?: string
  avatar?: string | null
  currentPassword?: string
  newPassword?: string
}
