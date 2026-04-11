// 共享用户模型：供认证、布局、权限和业务模块复用
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
