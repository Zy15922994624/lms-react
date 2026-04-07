import { ROUTES } from '@/shared/constants/routes'

export type PageWidthMode = 'narrow' | 'standard' | 'workspace'

export function resolvePageWidthMode(pathname: string): PageWidthMode {
  if (pathname === ROUTES.COURSES || pathname === ROUTES.HOME || pathname === ROUTES.TEACHER_HOME) {
    return 'workspace'
  }

  if (pathname === ROUTES.TASKS || pathname.startsWith(`${ROUTES.TASKS}/`)) {
    return 'workspace'
  }

  if (pathname === ROUTES.QUESTION_BANK || pathname.startsWith(`${ROUTES.QUESTION_BANK}/`)) {
    return 'workspace'
  }

  if (pathname.startsWith(`${ROUTES.COURSES}/`)) {
    return 'workspace'
  }

  if (pathname === ROUTES.PROFILE) {
    return 'narrow'
  }

  return 'standard'
}
