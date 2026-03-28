// 认证与个人资料相关的表单类型
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
