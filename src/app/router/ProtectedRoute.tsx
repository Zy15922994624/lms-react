import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES, getRoleHomePath } from '@/shared/constants/routes'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { UserRole } from '@/shared/types/user'

interface Props {
  children: ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isLoggedIn, isLoading, userRole } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <PageLoading tip="正在加载页面..." />
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (roles && roles.length > 0) {
    const role = userRole()
    if (!role || !roles.includes(role)) {
      return <Navigate to={getRoleHomePath(role)} replace />
    }
  }

  return <>{children}</>
}
