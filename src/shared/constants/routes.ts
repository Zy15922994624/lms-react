import type { UserRole } from '@/shared/types/user'

export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  TEACHER_HOME: '/teacher-home',
  TASKS: '/tasks',
  TASK_CREATE: '/tasks/create',
  TASK_DETAIL: (id: string | number) => `/tasks/${id}`,
  TASK_EDIT: (id: string | number) => `/tasks/${id}/edit`,
  COURSES: '/courses',
  COURSE_DETAIL: (id: string | number) => `/courses/${id}`,
  QUESTION_BANK: '/question-bank',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  STUDENTS: '/students',
  USERS: '/users',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export function getRoleHomePath(role: UserRole | null): string {
  return role === 'teacher' || role === 'admin' ? ROUTES.TEACHER_HOME : ROUTES.HOME
}
