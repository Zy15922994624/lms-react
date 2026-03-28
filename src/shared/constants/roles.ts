import type { UserRole } from '@/shared/types/user'

export const ROLES: Record<string, UserRole> = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
}
